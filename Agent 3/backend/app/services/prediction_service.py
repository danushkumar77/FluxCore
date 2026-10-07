import os
import joblib
import logging
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from backend.app.domain.entities import BatteryTelemetry, BatteryHealth
from backend.app.core.event_bus import EventBus, EventContract, event_bus_instance

logger = logging.getLogger("FluxCore.PredictionService")

class PredictionService:
    def __init__(self, event_bus: EventBus = event_bus_instance):
        self.event_bus = event_bus
        self.models = {}
        self.metrics = {}
        self.feature_importances = {}
        self._load_models()

    def _load_models(self):
        model_paths = {
            "degradation": "backend/models/degradation_model.joblib",
            "rul": "backend/models/rul_model.joblib",
            "charge": "backend/models/charge_opt_model.joblib",
            "discharge": "backend/models/discharge_opt_model.joblib"
        }
        
        for key, path in model_paths.items():
            if os.path.exists(path):
                try:
                    data = joblib.load(path)
                    self.models[key] = data["model"]
                    self.metrics[key] = data.get("metrics", {})
                    self.feature_importances[key] = data.get("feature_importance", {})
                    logger.info(f"Successfully loaded {key} model from {path}")
                except Exception as e:
                    logger.error(f"Failed to load model {key}: {str(e)}")
            else:
                logger.warning(f"Model file not found: {path}. Predictions will use safe fallback calculations.")

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "loaded_models": list(self.models.keys()),
            "metrics": self.metrics,
            "feature_importance": self.feature_importances
        }

    async def predict_degradation_and_rul(self, telemetry: BatteryTelemetry, correlation_id: str) -> BatteryHealth:
        # Features for degradation: cycles, avg_temp, dod, charge_rate
        # Calculate features from telemetry
        cycles = telemetry.charge_cycles
        avg_temp = telemetry.avg_cell_temp
        dod = 80.0  # Assumed operating average Depth of Discharge
        charge_rate = abs(telemetry.current_draw_a * 480.0 / 1000.0) / 1000.0  # C-rate approximation
        charge_rate = max(0.1, min(charge_rate, 1.5))
        
        # Features for RUL: current_soh, avg_temp, cycle_history, resistance
        current_soh = telemetry.soh
        resistance = 2.0 + (100.0 - current_soh) * 0.05
        
        # 1. Predict Degradation (SOH)
        if "degradation" in self.models:
            X_deg = pd.DataFrame([[cycles, avg_temp, dod, charge_rate]], columns=["cycles", "avg_temp", "dod", "charge_rate"])
            predicted_soh = float(self.models["degradation"].predict(X_deg)[0])
        else:
            # Fallback formula
            predicted_soh = current_soh - 0.001 * cycles / 1000.0
            
        predicted_soh = min(100.0, max(50.0, predicted_soh))
        
        # 2. Predict RUL
        if "rul" in self.models:
            X_rul = pd.DataFrame([[predicted_soh, avg_temp, cycles, resistance]], columns=["current_soh", "avg_temp", "cycle_history", "resistance"])
            predicted_rul = int(self.models["rul"].predict(X_rul)[0])
        else:
            predicted_rul = int(max(0, (predicted_soh - 80.0) * 150))

        risk_score = min(100.0, max(0.0, (50.0 - (predicted_soh - 80.0) * 2.5 + (avg_temp - 25.0) * 1.5)))
        
        health_record = BatteryHealth(
            container_id=telemetry.container_id,
            soh_pct=predicted_soh,
            capacity_loss_pct=100.0 - predicted_soh,
            rul_cycles=predicted_rul,
            degradation_rate_pct_cycle=0.003,
            resistance_mohm=resistance,
            risk_score=risk_score
        )
        
        # Publish events
        deg_event = EventContract(
            event_type="battery.degradation.predicted",
            correlation_id=correlation_id,
            payload={"container_id": telemetry.container_id, "predicted_soh": predicted_soh}
        )
        await self.event_bus.publish(deg_event)
        
        rul_event = EventContract(
            event_type="battery.rul.predicted",
            correlation_id=correlation_id,
            payload={"container_id": telemetry.container_id, "predicted_rul": predicted_rul, "risk_score": risk_score}
        )
        await self.event_bus.publish(rul_event)
        
        return health_record

    def predict_optimal_charge_rate(self, soc: float, solar_surplus: float, grid_price: float, temp: float) -> float:
        if "charge" in self.models:
            X = pd.DataFrame([[soc, solar_surplus, grid_price, temp]], columns=["soc", "solar_surplus", "grid_price", "temp"])
            return float(self.models["charge"].predict(X)[0])
        else:
            # Fallback rule
            target = (solar_surplus * 0.7) + (350.0 - grid_price) * 0.3 + (100.0 - soc) * 1.5
            if temp > 45.0:
                target *= 0.2
            return max(0.0, min(500.0, target))

    def predict_optimal_discharge_rate(self, soc: float, demand_load: float, grid_price: float, temp: float) -> float:
        if "discharge" in self.models:
            X = pd.DataFrame([[soc, demand_load, grid_price, temp]], columns=["soc", "demand_load", "grid_price", "temp"])
            return float(self.models["discharge"].predict(X)[0])
        else:
            # Fallback rule
            target = (demand_load * 0.4) + (grid_price * 1.2) + (soc * 2.0)
            if temp > 45.0:
                target *= 0.25
            return max(0.0, min(500.0, target))
