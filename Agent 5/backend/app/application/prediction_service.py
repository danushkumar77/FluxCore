import os
import pickle
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.domain.entities.Asset import Asset

class PredictionService:
    def __init__(self, models_path="backend/models/models.pkl"):
        self.models_path = models_path
        self.models = None
        self.last_load_attempt = None

    def _load_models(self):
        if self.models is not None:
            return True
        if os.path.exists(self.models_path):
            try:
                with open(self.models_path, "rb") as f:
                    self.models = pickle.load(f)
                print("ML models loaded successfully in prediction service.")
                return True
            except Exception as e:
                print(f"Error loading ML models: {e}")
        return False

    def _get_feature_vector(self, asset: Asset) -> np.ndarray:
        asset_type = asset.type
        subtype = getattr(asset, "subtype", "Wind")
        telemetry = asset.telemetry or {}
        
        # Mapping rules matching train_models.py
        if asset_type == "Transformer":
            code = 0.0
            temp = float(telemetry.get("oil_temp", 45.0))
            vibration = float(telemetry.get("vibration", 1.2))
            pressure = 0.0
            elec_voltage = float(telemetry.get("breakdown_voltage", 65.0))
            elec_current = float(telemetry.get("load_factor", 60.0))
            wear = float(telemetry.get("moisture", 12.0))
            cycles = 0.0
            load = float(telemetry.get("load_factor", 60.0))
        elif asset_type == "CircuitBreaker":
            code = 1.0
            temp = float(telemetry.get("ambient_temp", 25.0))
            vibration = 0.0
            pressure = float(telemetry.get("sf6_pressure", 6.2))
            elec_voltage = 0.0
            elec_current = float(telemetry.get("coil_current", 2.1))
            wear = float(telemetry.get("contact_wear", 5.0))
            cycles = float(telemetry.get("switching_operations", 150.0))
            load = 0.0
        elif asset_type == "TransmissionLine":
            code = 2.0
            temp = float(telemetry.get("conductor_temp", 40.0))
            vibration = 0.0
            pressure = 0.0
            elec_voltage = 0.0
            elec_current = float(telemetry.get("current_load", 450.0))
            wear = float(telemetry.get("sag", 1.5))
            cycles = 0.0
            load = float(telemetry.get("current_load", 450.0))
        elif asset_type == "Renewable":
            if subtype == "Wind":
                code = 3.0
                temp = float(telemetry.get("gearbox_oil_temp", 62.0))
                vibration = float(telemetry.get("turbine_vibration", 0.15))
                pressure = 0.0
                elec_current = float(telemetry.get("power_output", 1.8))
                elec_voltage = 0.0
                wear = float(telemetry.get("blade_pitch_angle", 2.5))
                cycles = float(telemetry.get("rotor_speed", 15.0))
                load = float(telemetry.get("power_output", 1.8))
            else: # Solar
                code = 4.0
                temp = float(telemetry.get("panel_temp", 42.0))
                vibration = 0.0
                pressure = 0.0
                elec_voltage = float(telemetry.get("dc_voltage", 620.0))
                elec_current = float(telemetry.get("string_current", 8.5))
                wear = float(telemetry.get("dust_degradation", 1.2))
                cycles = 0.0
                load = float(telemetry.get("inverter_efficiency", 97.5))
        elif asset_type == "Battery":
            code = 5.0
            temp = float(telemetry.get("cell_temp", 28.0))
            vibration = 0.0
            pressure = 0.0
            elec_voltage = float(telemetry.get("max_cell_voltage", 3.82))
            elec_current = float(telemetry.get("current_draw", -50.0))
            wear = float(telemetry.get("internal_resistance", 15.0))
            cycles = float(telemetry.get("charge_cycles", 240))
            load = float(telemetry.get("soh", 98.0))
        else:
            code = 0.0
            temp = 25.0
            vibration = 0.0
            pressure = 0.0
            elec_voltage = 0.0
            elec_current = 0.0
            wear = 0.0
            cycles = 0.0
            load = 100.0

        # Age calculation
        try:
            inst = datetime.strptime(asset.installation_date, "%Y-%m-%d")
            age = float((datetime.utcnow() - inst).days)
        except Exception:
            age = 365.0

        # Trends (normally calculated from history, default to safe values)
        temp_trend = 0.0
        vibration_trend = 0.0
        elec_trend = 0.0
        drift_flag = 0.0
        criticality = float(asset.criticality_score)

        # Vector structure: 15 columns
        vec = [
            code, temp, vibration, pressure, elec_voltage, elec_current, wear, cycles, load,
            age, temp_trend, vibration_trend, elec_trend, drift_flag, criticality
        ]
        return np.array(vec).reshape(1, -1)

    def predict_failure_probability(self, asset: Asset) -> float:
        if not self._load_models():
            return self._heuristic_failure_prob(asset)
        
        try:
            vec = self._get_feature_vector(asset)
            # Use random forest classifier predict_proba
            prob = self.models["model_fail"].predict_proba(vec)[0][1]
            return float(prob)
        except Exception as e:
            print(f"Prediction failed: {e}. Fallback to heuristic.")
            return self._heuristic_failure_prob(asset)

    def predict_rul(self, asset: Asset) -> float:
        if not self._load_models():
            return self._heuristic_rul(asset)
        
        try:
            vec = self._get_feature_vector(asset)
            days = self.models["model_rul"].predict(vec)[0]
            return float(days)
        except Exception as e:
            print(f"RUL prediction failed: {e}. Fallback to heuristic.")
            return self._heuristic_rul(asset)

    def detect_anomaly(self, asset: Asset) -> Dict[str, Any]:
        if not self._load_models():
            return {"is_anomaly": False, "score": 0.0}
        
        try:
            vec = self._get_feature_vector(asset)
            # Isolation forest decision_function returns negative values for anomalies
            score = self.models["model_anomaly"].decision_function(vec)[0]
            # Isolation Forest predict returns -1 for anomalies
            pred = self.models["model_anomaly"].predict(vec)[0]
            is_anomaly = bool(pred == -1)
            # Normalize score to a 0-1 range (where higher is more anomalous)
            norm_score = float(np.clip(-score * 2.0, 0.0, 1.0))
            return {"is_anomaly": is_anomaly, "score": norm_score}
        except Exception as e:
            print(f"Anomaly detection failed: {e}.")
            return {"is_anomaly": False, "score": 0.0}

    def detect_drift(self, asset: Asset) -> bool:
        if not self._load_models():
            return False
        try:
            vec = self._get_feature_vector(asset)
            pred = self.models["model_drift"].predict(vec)[0]
            return bool(pred == -1)
        except Exception:
            return False

    def classify_failure_mode(self, asset: Asset) -> str:
        if not self._load_models():
            return "Unknown"
        try:
            vec = self._get_feature_vector(asset)
            class_code = self.models["model_class"].predict(vec)[0]
            # Classes: 0: Electrical, 1: Mechanical, 2: Thermal, 3: Environmental
            classes = {0: "Electrical", 1: "Mechanical", 2: "Thermal", 3: "Environmental"}
            return classes.get(class_code, "None")
        except Exception:
            return "Unknown"

    def predict_maintenance_timing(self, asset: Asset) -> float:
        if not self._load_models():
            return 30.0
        try:
            vec = self._get_feature_vector(asset)
            days = self.models["model_time"].predict(vec)[0]
            return float(days)
        except Exception:
            return 30.0

    # Heuristic fallback logic
    def _heuristic_failure_prob(self, asset: Asset) -> float:
        telemetry = asset.telemetry or {}
        prob = 0.05
        if asset.type == "Transformer":
            if float(telemetry.get("oil_temp", 45.0)) > 80.0:
                prob += 0.4
            if float(telemetry.get("c2h2_gas", 0.0)) > 2.0:
                prob += 0.35
            if float(telemetry.get("breakdown_voltage", 65.0)) < 50.0:
                prob += 0.15
        elif asset.type == "Battery":
            if float(telemetry.get("cell_temp", 28.0)) > 45.0:
                prob += 0.5
            if float(telemetry.get("soh", 100.0)) < 85.0:
                prob += 0.3
        elif asset.type == "CircuitBreaker":
            if float(telemetry.get("contact_wear", 0.0)) > 25.0:
                prob += 0.4
        elif asset.type == "TransmissionLine":
            if float(telemetry.get("conductor_temp", 0.0)) > 75.0:
                prob += 0.35
        elif asset.type == "Renewable":
            if asset.telemetry.get("turbine_vibration", 0.0) > 0.28:
                prob += 0.4
        return float(np.clip(prob, 0.0, 0.99))

    def _heuristic_rul(self, asset: Asset) -> float:
        prob = self._heuristic_failure_prob(asset)
        # Higher failure prob = lower RUL
        return float(np.clip(180.0 - (prob * 170.0), 1.0, 180.0))
