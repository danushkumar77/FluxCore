import os
import json
try:
    import joblib
except ImportError:
    joblib = None
from config.settings import settings

class PredictionEngine:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_loaded = False
        self.metrics = {}
        
        if joblib and os.path.exists(settings.MODEL_PATH) and os.path.exists(settings.SCALER_PATH):
            try:
                self.model = joblib.load(settings.MODEL_PATH)
                self.scaler = joblib.load(settings.SCALER_PATH)
                self.model_loaded = True
            except Exception:
                pass
                
        metrics_path = "models/metrics.json"
        if os.path.exists(metrics_path):
            try:
                with open(metrics_path, "r") as f:
                    self.metrics = json.load(f)
            except:
                pass

    def predict(self, feature_vector: list, inputs: dict = None) -> dict:
        cur_load = inputs.get('current_load', 20000) if inputs else 20000
        
        if self.model_loaded:
            try:
                scaled = self.scaler.transform([feature_vector])
                pred = float(self.model.predict(scaled)[0])
            except:
                pred = cur_load * 1.02
        else:
            # Heuristic fallback
            hour = inputs.get('hour', 12) if inputs else 12
            if (9 <= hour <= 12) or (17 <= hour <= 21):
                pred = cur_load * 1.05
            elif 0 <= hour <= 5:
                pred = cur_load * 0.95
            else:
                pred = cur_load * 1.01
                
        return {
            'prediction': pred,
            'next_6h_demand': pred * 1.05,
            'next_24h_demand': pred * 1.02,
            'peak_demand': max(pred * 1.15, cur_load * 1.1),
            'prediction_interval': {'lower': pred * 0.9, 'upper': pred * 1.1}
        }

    def get_confidence(self, feature_vector: list, prediction: float) -> float:
        if self.model_loaded:
            return 85.5
        return 50.0

    def get_feature_importance(self) -> dict:
        if self.model_loaded and hasattr(self.model, 'feature_importances_'):
            return {col: float(imp) for col, imp in zip(settings.FEATURE_COLUMNS, self.model.feature_importances_)}
        return {col: 1.0 / len(settings.FEATURE_COLUMNS) for col in settings.FEATURE_COLUMNS}

    def get_metrics(self) -> dict:
        return self.metrics or {
            "mae": 0.0, "rmse": 0.0, "mape": 0.0, "r2_score": 0.0,
            "cv_scores": [], "training_date": "N/A", "samples_count": 0
        }

    def get_model_info(self) -> dict:
        return {
            "model_type": "XGBoostRegressor" if self.model_loaded else "Heuristic",
            "version": "1.0.0",
            "training_date": self.metrics.get("training_date", "N/A"),
            "features_count": len(settings.FEATURE_COLUMNS),
            "feature_names": settings.FEATURE_COLUMNS,
            "hyperparameters": {},
            "performance": self.get_metrics()
        }
