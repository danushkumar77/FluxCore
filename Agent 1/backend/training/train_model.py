import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

def train():
    data_path = os.path.join(os.path.dirname(__file__), '../datasets/demand_data.csv')
    df = pd.read_csv(data_path)
    
    FEATURE_COLUMNS = [
        'hour', 'minute', 'month', 'year', 'weekday', 'is_weekend', 'is_holiday', 'season',
        'temperature', 'humidity', 'wind_speed', 'rainfall', 'solar_irradiance', 'atmospheric_pressure',
        'current_load', 'previous_hour_load', 'previous_day_load',
        'grid_frequency', 'voltage', 'power_factor',
        'solar_generation', 'wind_generation', 'hydro_generation', 'renewable_percentage',
        'battery_soc', 'available_storage',
        'electricity_price', 'demand_response_event',
        'load_change_1h', 'load_change_24h', 'demand_growth_rate',
        'temperature_index', 'temp_squared',
        'renewable_ratio', 'net_load', 'battery_utilization',
        'peak_hour', 'off_peak',
        'hour_sin', 'hour_cos', 'month_sin', 'month_cos',
        'day_of_week_sin', 'day_of_week_cos',
        'price_load_ratio'
    ]
    
    df['load_change_1h'] = df['current_load'] - df['previous_hour_load']
    df['load_change_24h'] = df['current_load'] - df['previous_day_load']
    df['demand_growth_rate'] = (df['current_load'] - df['previous_hour_load']) / df['previous_hour_load'].replace(0, 1) * 100
    df['temperature_index'] = abs(df['temperature'] - 22)
    df['temp_squared'] = df['temperature'] ** 2
    df['renewable_ratio'] = (df['solar_generation'] + df['wind_generation'] + df['hydro_generation']) / df['current_load'].clip(lower=1)
    df['net_load'] = df['current_load'] - (df['solar_generation'] + df['wind_generation'] + df['hydro_generation'])
    df['battery_utilization'] = (100 - df['battery_soc']) / 100
    df['peak_hour'] = df['hour'].isin([9,10,11,12,17,18,19,20,21]).astype(int)
    df['off_peak'] = df['hour'].isin([0,1,2,3,4,5]).astype(int)
    df['hour_sin'] = np.sin(2*np.pi*df['hour']/24)
    df['hour_cos'] = np.cos(2*np.pi*df['hour']/24)
    df['month_sin'] = np.sin(2*np.pi*df['month']/12)
    df['month_cos'] = np.cos(2*np.pi*df['month']/12)
    df['day_of_week_sin'] = np.sin(2*np.pi*df['weekday']/7)
    df['day_of_week_cos'] = np.cos(2*np.pi*df['weekday']/7)
    df['price_load_ratio'] = df['electricity_price'] / df['current_load'].clip(lower=1) * 1000
    
    df = df.dropna()
    
    X = df[FEATURE_COLUMNS]
    y = df['demand_mw']
    
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    tscv = TimeSeriesSplit(n_splits=5)
    param_grid = {
        'n_estimators': [200, 500],
        'max_depth': [4, 6],
        'learning_rate': [0.05, 0.1],
        'subsample': [0.8],
        'colsample_bytree': [0.8],
        'min_child_weight': [3, 5]
    }
    
    xgb = XGBRegressor(random_state=42)
    grid = GridSearchCV(xgb, param_grid, cv=tscv, scoring='neg_mean_absolute_error', n_jobs=-1, verbose=1)
    grid.fit(X_train_scaled, y_train)
    
    best_model = grid.best_estimator_
    
    y_pred = best_model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    r2 = r2_score(y_test, y_pred)
    
    print(f"MAE: {mae}")
    print(f"RMSE: {rmse}")
    print(f"MAPE: {mape}")
    print(f"R2: {r2}")
    print(f"Best Params: {grid.best_params_}")
    
    models_dir = os.path.join(os.path.dirname(__file__), '../models')
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(best_model, os.path.join(models_dir, 'demand_model.joblib'))
    joblib.dump(scaler, os.path.join(models_dir, 'scaler.joblib'))
    
    feature_importance = {col: float(imp) for col, imp in zip(FEATURE_COLUMNS, best_model.feature_importances_)}
    with open(os.path.join(models_dir, 'feature_importance.json'), 'w') as f:
        json.dump(feature_importance, f, indent=4)
        
    metrics = {
        'MAE': float(mae),
        'RMSE': float(rmse),
        'MAPE': float(mape),
        'R2': float(r2),
        'training_date': pd.Timestamp.now().isoformat(),
        'samples_count': len(df),
        'best_params': grid.best_params_,
        'feature_names': FEATURE_COLUMNS
    }
    cv_scores = grid.cv_results_['mean_test_score'].tolist()
    metrics['cv_scores'] = cv_scores
    
    with open(os.path.join(models_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=4)
        
    print("Done training and saving model.")

if __name__ == "__main__":
    train()
