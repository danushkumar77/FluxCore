import os
import json
import pickle
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from generate_data import generate_synthetic_data
from feature_engineering import engineer_features

# Feature definitions for each asset type
SOLAR_FEATURES = [
    "solar_irradiance", "cloud_cover", "solar_zenith_angle", "solar_efficiency_index", 
    "cloud_attenuation_factor", "solar_irradiance_lag_1h", "solar_irradiance_lag_24h", 
    "hour_sin", "hour_cos", "day_sin", "day_cos", "temperature", 
    "cloud_cover_roll_mean_3h", "cloud_cover_roll_std_3h"
]

WIND_FEATURES = [
    "wind_speed", "wind_direction", "air_density", "wind_power_density", 
    "wind_speed_lag_1h", "wind_speed_lag_2h", "wind_speed_lag_24h", 
    "wind_speed_roll_mean_3h", "wind_speed_roll_std_3h", "wind_speed_roll_mean_6h", 
    "wind_speed_roll_mean_24h", "temperature", "atmospheric_pressure"
]

HYDRO_FEATURES = [
    "reservoir_level", "reservoir_utilization", "hydro_flow_index", "rainfall", 
    "grid_demand", "reservoir_level_lag_1h", "reservoir_level_lag_24h", 
    "season", "month_sin", "month_cos"
]

def calculate_mape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    # Avoid division by zero
    mask = y_true > 0
    if not np.any(mask):
        return 0.0
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

def train_and_evaluate_model(name, X, y, features, cv_splits=3):
    print(f"\n--- Training {name} Model ---")
    
    # Train/Test Split (80% train, 20% test)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    # Time Series Split for CV
    tscv = TimeSeriesSplit(n_splits=cv_splits)
    
    # Lightweight hyperparameter grid for fast execution
    param_grid = {
        'n_estimators': [50, 100],
        'max_depth': [3, 5],
        'learning_rate': [0.05, 0.1],
        'subsample': [0.8],
        'colsample_bytree': [0.8]
    }
    
    model = xgb.XGBRegressor(random_state=42, objective='reg:squarederror')
    
    grid_search = GridSearchCV(
        estimator=model,
        param_grid=param_grid,
        cv=tscv,
        scoring='neg_mean_absolute_error',
        n_jobs=-1
    )
    
    grid_search.fit(X_train[features], y_train)
    best_model = grid_search.best_estimator_
    
    # Predict on test set
    y_pred = best_model.predict(X_test[features])
    y_pred = np.clip(y_pred, 0.0, None) # output cannot be negative
    
    # Metrics
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = calculate_mape(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Best Parameters: {grid_search.best_params_}")
    print(f"MAE: {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"MAPE: {mape:.2f}%")
    print(f"R² Score: {r2:.4f}")
    
    # Feature Importances
    importances = best_model.feature_importances_
    feat_importance = {features[idx]: float(importances[idx]) for idx in np.argsort(importances)[::-1]}
    
    return best_model, {
        "mae": float(mae),
        "rmse": float(rmse),
        "mape": float(mape),
        "r2": float(r2),
        "best_params": grid_search.best_params_,
        "feature_importance": feat_importance
    }

def main():
    csv_path = "backend/ml/historical_generation.csv"
    if not os.path.exists(csv_path):
        generate_synthetic_data(csv_path)
        
    df = pd.read_csv(csv_path)
    df_engineered = engineer_features(df)
    
    models = {}
    metrics_summary = {}
    
    # Train Solar
    solar_model, solar_metrics = train_and_evaluate_model(
        "Solar", 
        df_engineered, 
        df_engineered["solar_generation"], 
        SOLAR_FEATURES
    )
    models["solar"] = (solar_model, SOLAR_FEATURES)
    metrics_summary["solar"] = solar_metrics
    
    # Train Wind
    wind_model, wind_metrics = train_and_evaluate_model(
        "Wind", 
        df_engineered, 
        df_engineered["wind_generation"], 
        WIND_FEATURES
    )
    models["wind"] = (wind_model, WIND_FEATURES)
    metrics_summary["wind"] = wind_metrics
    
    # Train Hydro
    hydro_model, hydro_metrics = train_and_evaluate_model(
        "Hydro", 
        df_engineered, 
        df_engineered["hydro_generation"], 
        HYDRO_FEATURES
    )
    models["hydro"] = (hydro_model, HYDRO_FEATURES)
    metrics_summary["hydro"] = hydro_metrics
    
    # Save models and information
    model_dir = "backend/models"
    os.makedirs(model_dir, exist_ok=True)
    
    # Save model artifacts
    for name, (model, features) in models.items():
        # Native save
        model.save_model(os.path.join(model_dir, f"{name}_model.json"))
        # Save features metadata
        with open(os.path.join(model_dir, f"{name}_features.json"), "w") as f:
            json.dump(features, f)
            
    # Save metrics and params
    with open(os.path.join(model_dir, "model_info.json"), "w") as f:
        json.dump(metrics_summary, f, indent=2)
        
    print("\nAll models trained and saved to backend/models/")

if __name__ == "__main__":
    main()
