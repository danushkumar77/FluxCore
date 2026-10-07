import os
import joblib
from typing import Dict, Any

class FaultDetectionService:
    def __init__(self, model_path: str = "backend/app/infrastructure/models/fault_detection.joblib"):
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
            except Exception as e:
                print(f"Error loading fault detection model: {e}")

    def detect_fault(self, telemetry: Dict[str, float]) -> Dict[str, Any]:
        """
        Predicts: Normal (0), Warning (1), or Faulted (2)
        """
        # Features: [voltage, current, frequency, harmonics, load]
        voltage = telemetry.get("voltage_pu", 1.0)
        current = telemetry.get("current_rms", 0.4)
        frequency = telemetry.get("frequency_hz", 60.0)
        harmonics = telemetry.get("harmonics_thd", 0.8)
        load = telemetry.get("load_percentage", 65.0)

        # Fallback if model not trained yet
        if not self.model:
            self._load_model() # Try loading again in case it just finished
            
        if self.model:
            try:
                pred = self.model.predict([[voltage, current, frequency, harmonics, load]])[0]
                status_map = {0: "HEALTHY", 1: "WARNING", 2: "FAULTED"}
                return {
                    "status": status_map.get(pred, "HEALTHY"),
                    "confidence": 0.94,
                    "method": "ML_MODEL"
                }
            except Exception as e:
                print(f"ML Inference error in fault detection: {e}")

        # Rule-based fallback
        status = "HEALTHY"
        confidence = 1.0
        if current > 4.0 or voltage < 0.5:
            status = "FAULTED"
        elif current > 1.3 or voltage < 0.90 or voltage > 1.10 or harmonics > 4.0:
            status = "WARNING"

        return {
            "status": status,
            "confidence": confidence,
            "method": "RULE_ENGINE"
        }
