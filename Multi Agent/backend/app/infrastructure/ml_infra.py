import os
import pickle
import logging
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb

logger = logging.getLogger("FluxCore.MLInfra")

class ModelRegistry:
    def __init__(self, registry_dir: str = "models"):
        self.registry_dir = registry_dir
        os.makedirs(registry_dir, exist_ok=True)
        # Maps model_name -> {version: {path, metrics, updated_at}}
        self._registry: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._active_versions: Dict[str, str] = {}

    def register_model(self, model_name: str, version: str, model_object: Any, metrics: Dict[str, float]):
        """Persists a trained model structure into the local registry."""
        model_path = os.path.join(self.registry_dir, f"{model_name}_v{version}.pkl")
        try:
            with open(model_path, "wb") as f:
                pickle.dump(model_object, f)
            
            if model_name not in self._registry:
                self._registry[model_name] = {}

            self._registry[model_name][version] = {
                "path": model_path,
                "metrics": metrics,
                "registered_at": datetime.utcnow().isoformat()
            }
            logger.info(f"Registered model: {model_name} (Version: {version}) with metrics: {metrics}")
            
            # Default to active if first model registered
            if model_name not in self._active_versions:
                self._active_versions[model_name] = version
        except Exception as e:
            logger.error(f"Failed to register model {model_name}: {e}")

    def set_active_version(self, model_name: str, version: str):
        if model_name in self._registry and version in self._registry[model_name]:
            self._active_versions[model_name] = version
            logger.info(f"Activated model '{model_name}' version: {version}")
        else:
            raise ValueError(f"Version '{version}' not found for model '{model_name}'")

    def load_active_model(self, model_name: str) -> Optional[Any]:
        """Loads and returns the active model object from pickle files."""
        version = self._active_versions.get(model_name)
        if not version or model_name not in self._registry:
            logger.warning(f"No active model found for: {model_name}")
            return None
        
        model_path = self._registry[model_name][version]["path"]
        try:
            with open(model_path, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return None

class FeatureStore:
    def __init__(self):
        # Maps entity_id -> DataFrame of calculated feature histories
        self._store: Dict[str, pd.DataFrame] = {}

    def push_features(self, entity_id: str, df: pd.DataFrame):
        if entity_id not in self._store:
            self._store[entity_id] = df
        else:
            combined = pd.concat([self._store[entity_id], df], ignore_index=True)
            # Remove duplicate timestamps to prevent collisions
            if "timestamp" in combined.columns:
                combined = combined.drop_duplicates(subset=["timestamp"], keep="last")
            self._store[entity_id] = combined.reset_index(drop=True)

    def read_features(self, entity_id: str, limit: int = 100) -> pd.DataFrame:
        df = self._store.get(entity_id, pd.DataFrame())
        return df.tail(limit)

class MLTrainingPipeline:
    @staticmethod
    def train_forecaster_grid_search(
        X: pd.DataFrame, 
        y: pd.Series, 
        model_type: str = "random_forest"
    ) -> Tuple[Any, Dict[str, float]]:
        """
        Executes a GridSearchCV with TimeSeriesSplit to avoid data leakage in forecasting models.
        Supports Scikit-Learn RandomForest and XGBoost.
        """
        # TimeSeriesSplit (5 splits) for sequential evaluation
        tscv = TimeSeriesSplit(n_splits=5)
        
        if model_type == "random_forest":
            model = RandomForestRegressor(random_state=42)
            param_grid = {
                "n_estimators": [50, 100],
                "max_depth": [5, 10]
            }
        elif model_type == "xgboost":
            model = xgb.XGBRegressor(objective="reg:squarederror", random_state=42)
            param_grid = {
                "max_depth": [3, 5],
                "learning_rate": [0.05, 0.1]
            }
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

        # GridSearchCV wrapper
        grid_search = GridSearchCV(
            estimator=model,
            param_grid=param_grid,
            cv=tscv,
            scoring="neg_mean_squared_error",
            n_jobs=-1
        )

        grid_search.fit(X, y)
        best_model = grid_search.best_estimator_
        
        # Capture metrics
        metrics = {
            "best_cv_neg_mse": float(grid_search.best_score_),
            "best_params": str(grid_search.best_params_)
        }
        
        return best_model, metrics

# Global instances for DI
model_registry = ModelRegistry()
feature_store = FeatureStore()
ml_training_pipeline = MLTrainingPipeline()
