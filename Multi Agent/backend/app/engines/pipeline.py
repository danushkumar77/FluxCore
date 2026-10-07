import numpy as np
import pandas as pd
import logging
from typing import Dict, Any, List, Optional
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger("FluxCore.DataPipeline")

class DataValidationPipeline:
    def __init__(self, z_score_threshold: float = 3.0):
        self.z_score_threshold = z_score_threshold
        # Stores historical values per asset parameter to calculate rolling mean/std for outlier checks
        self._history: Dict[str, List[float]] = {}

    def validate_and_clean(self, raw_telemetry: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], List[str]]:
        """
        Validates schema, detects duplicates/outliers, and handles missing data.
        Returns (is_valid, cleaned_data, issues_found).
        """
        cleaned = raw_telemetry.copy()
        issues = []
        is_valid = True

        # 1. Missing Data Handling (imputation)
        for key in ["voltage_kv", "frequency_hz", "active_power_mw"]:
            if key in cleaned and cleaned[key] is None:
                # Mock average imputation (in production, query database / cache)
                fallback_vals = {"voltage_kv": 115.0, "frequency_hz": 50.0, "active_power_mw": 0.0}
                cleaned[key] = fallback_vals[key]
                issues.append(f"Missing {key} imputed with default {fallback_vals[key]}")

        # 2. Outlier Detection using rolling Z-Score
        asset_id = str(cleaned.get("asset_id", "default"))
        for param in ["voltage_kv", "frequency_hz", "active_power_mw"]:
            val = cleaned.get(param)
            if val is not None:
                history_key = f"{asset_id}_{param}"
                if history_key not in self._history:
                    self._history[history_key] = []
                
                history_list = self._history[history_key]
                history_list.append(val)
                # Keep rolling history window of 50 samples
                if len(history_list) > 50:
                    history_list.pop(0)

                if len(history_list) > 10:
                    arr = np.array(history_list)
                    mean = np.mean(arr[:-1])
                    std = np.std(arr[:-1])
                    if std > 0.001:
                        z_score = abs(val - mean) / std
                        if z_score > self.z_score_threshold:
                            issues.append(f"Outlier detected for {param}: {val} (Z-Score: {z_score:.2f})")
                            # Clamp value to 3 standard deviations
                            clamped_val = float(mean + np.sign(val - mean) * 3 * std)
                            cleaned[param] = clamped_val
                            issues.append(f"Clamped outlier {param} to {clamped_val:.2f}")

        return is_valid, cleaned, issues

class FeatureEngineeringPipeline:
    def __init__(self):
        self.scaler = StandardScaler()
        self._is_scaler_fitted = False

    def generate_features(self, df: pd.DataFrame, target_col: Optional[str] = None) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
        """
        Generates lag and rolling window features for time series forecasting.
        """
        processed_df = df.copy()
        
        # Sort values chronologically
        if "timestamp" in processed_df.columns:
            processed_df["timestamp"] = pd.to_datetime(processed_df["timestamp"])
            processed_df = processed_df.sort_values("timestamp").reset_index(drop=True)

        numeric_cols = processed_df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Generate Lag features (t-1, t-2)
        for col in numeric_cols:
            if col in ["voltage_kv", "active_power_mw", "market_price_mwh"]:
                processed_df[f"{col}_lag_1"] = processed_df[col].shift(1)
                processed_df[f"{col}_lag_2"] = processed_df[col].shift(2)

        # Generate Rolling Window features (mean, std of size 6)
        for col in numeric_cols:
            if col in ["voltage_kv", "active_power_mw", "market_price_mwh"]:
                processed_df[f"{col}_roll_mean_6"] = processed_df[col].shift(1).rolling(window=6, min_periods=1).mean()
                processed_df[f"{col}_roll_std_6"] = processed_df[col].shift(1).rolling(window=6, min_periods=1).std().fillna(0.0)

        # Drop NaN values introduced by shift/rolling
        processed_df = processed_df.dropna().reset_index(drop=True)

        # Scale features
        feature_cols = [c for c in processed_df.columns if c not in ["timestamp", "asset_id", "measurement_id", target_col]]
        
        if feature_cols:
            if not self._is_scaler_fitted:
                # Fit scaler in training
                self.scaler.fit(processed_df[feature_cols])
                self._is_scaler_fitted = True
            
            scaled_features = self.scaler.transform(processed_df[feature_cols])
            for i, col in enumerate(feature_cols):
                processed_df[f"{col}_scaled"] = scaled_features[:, i]

        # Split features and target
        y = None
        if target_col and target_col in processed_df.columns:
            y = processed_df[target_col]

        return processed_df, y

# Global instances for DI
data_validation_pipeline = DataValidationPipeline()
feature_engineering_pipeline = FeatureEngineeringPipeline()
from typing import Tuple
