import random
from typing import Dict, Any
from backend.models.ml_forecasting import ml_system

class ModelMonitor:
    def __init__(self):
        pass

    def check_model_drift(self) -> Dict[str, Any]:
        """
        Calculates simulated accuracy drift. Returns a map indicating status per model.
        """
        registry = ml_system.load_registry()
        drift_report = {}
        
        for model_name, model_info in registry.get("models", {}).items():
            # Add a random drift factor (e.g. increase error by 0 to 5%)
            drift_factor = random.uniform(0.0, 0.04)
            current_status = model_info.get("status", "ACTIVE")
            
            # If drift factor is high, flag retraining required
            needs_retrain = drift_factor > 0.035
            
            drift_report[model_name] = {
                "drift_factor": round(drift_factor, 4),
                "status": "DRIFT_DETECTED" if needs_retrain else current_status,
                "needs_retraining": needs_retrain
            }
            
            if needs_retrain:
                # Update model status in registry
                registry["models"][model_name]["status"] = "DRIFT_DETECTED"
                
        ml_system.save_registry(registry)
        return drift_report

    def trigger_retraining(self) -> Dict[str, Any]:
        """
        Fires off a training cycle to update registry metrics.
        """
        print("[Model Monitor] Error threshold exceeded. Launching retraining worker...")
        return ml_system.train_models()

# Global singleton
model_monitor = ModelMonitor()
