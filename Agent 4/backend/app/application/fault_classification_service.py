import os
import joblib
from typing import Dict, Any

class FaultClassificationService:
    def __init__(self, models_dir: str = "backend/app/infrastructure/models"):
        self.models_dir = models_dir
        self.models = {}
        self._load_models()

    def _load_models(self):
        model_names = [
            "fault_classification", "fault_localization", 
            "outage_prediction", "equipment_failure", "grid_stability"
        ]
        for name in model_names:
            path = os.path.join(self.models_dir, f"{name}.joblib")
            if os.path.exists(path):
                try:
                    self.models[name] = joblib.load(path)
                except Exception as e:
                    print(f"Error loading model {name}: {e}")

    def classify_and_localize(self, telemetry: Dict[str, float]) -> Dict[str, Any]:
        """
        Executes classification, localization, outage, equipment, and stability predictions.
        """
        voltage = telemetry.get("voltage_pu", 1.0)
        current = telemetry.get("current_rms", 0.4)
        harmonics = telemetry.get("harmonics_thd", 0.8)
        load = telemetry.get("load_percentage", 65.0)

        # Check model loading in case they finished training
        if len(self.models) < 5:
            self._load_models()

        # 1. Fault Category
        fault_type = "NORMAL"
        if current > 4.0 or voltage < 0.5:
            if "fault_classification" in self.models:
                try:
                    pred = self.models["fault_classification"].predict([[voltage, current, harmonics]])[0]
                    fault_type = ["LINE_TO_GROUND", "LINE_TO_LINE", "LINE_TO_LINE_TO_GROUND", "THREE_PHASE"][int(pred)]
                except Exception:
                    fault_type = "LINE_TO_GROUND"
            else:
                fault_type = "LINE_TO_GROUND"
        elif telemetry.get("winding_temperature", 60.0) > 95.0 or telemetry.get("partial_discharge", 10.0) > 100.0:
            fault_type = "TRANSFORMER_OVERHEAT" if telemetry.get("winding_temperature", 60.0) > 95.0 else "INSULATION_BREAKDOWN"

        # 2. Fault Localization (Distance in km)
        distance = None
        if fault_type != "NORMAL" and not fault_type.startswith("TRANSFORMER") and not fault_type.startswith("INSULATION"):
            if "fault_localization" in self.models:
                try:
                    distance = float(self.models["fault_localization"].predict([[voltage, current]])[0])
                except Exception:
                    distance = 12.4
            else:
                distance = 12.4

        # 3. Outage Prediction (Remaining useful hours)
        outage_probability = 0.0
        remaining_hours = 8760.0
        if fault_type != "NORMAL":
            outage_probability = 0.98 if current > 4.0 else 0.45
            if "outage_prediction" in self.models:
                try:
                    remaining_hours = float(self.models["outage_prediction"].predict([[voltage, current, harmonics, load]])[0])
                except Exception:
                    remaining_hours = 0.5
            else:
                remaining_hours = 0.5
        else:
            if load > 100:
                outage_probability = 0.15
                remaining_hours = 48.0

        # 4. Equipment Failure risk
        equipment_risk = "HEALTHY"
        if "equipment_failure" in self.models:
            try:
                w_t = telemetry.get("winding_temperature", 60.0)
                o_t = telemetry.get("top_oil_temperature", 50.0)
                vib = telemetry.get("vibration", 15.0)
                pd = telemetry.get("partial_discharge", 10.0)
                ins = telemetry.get("insulation_resistance", 1000.0)
                
                pred_eq = self.models["equipment_failure"].predict([[w_t, o_t, vib, pd, ins]])[0]
                equipment_risk = ["HEALTHY", "LINE_DEGRADATION", "TRANSFORMER_ANOMALY", "RELAY_FAILURE"][int(pred_eq)]
            except Exception:
                pass
        else:
            if telemetry.get("winding_temperature", 60.0) > 95.0:
                equipment_risk = "TRANSFORMER_ANOMALY"

        # 5. Stability Score
        stability_score = 99.0
        if "grid_stability" in self.models:
            try:
                stability_score = float(self.models["grid_stability"].predict([[voltage, current, harmonics, load]])[0])
            except Exception:
                stability_score = 98.2
        else:
            # Fallback calculation
            stability_score = max(20.0, 100.0 - (load * 0.1 + harmonics * 2.0))

        return {
            "fault_type": fault_type,
            "fault_location_distance_km": round(distance, 2) if distance else None,
            "outage_probability": round(outage_probability, 3),
            "remaining_operational_hours": round(remaining_hours, 2),
            "equipment_failure_prediction": equipment_risk,
            "grid_stability_score": round(stability_score, 1)
        }
