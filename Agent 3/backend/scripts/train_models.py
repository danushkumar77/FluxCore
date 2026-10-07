import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Ensure output directory exists
os.makedirs("backend/models", exist_ok=True)

def calculate_mape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    # Avoid division by zero
    mask = y_true != 0
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

def train_degradation_model():
    print("Training Degradation Model...")
    # Generate synthetic cycling data
    np.random.seed(42)
    n_samples = 1500
    
    cycles = np.random.randint(1, 6000, n_samples)
    avg_temp = np.random.uniform(15, 50, n_samples)
    depth_of_discharge = np.random.uniform(20, 100, n_samples)
    charge_rate = np.random.uniform(0.1, 1.5, n_samples)
    
    # SOH degradation formula with noise
    soh = 100.0 - (cycles * 0.003) - (avg_temp - 25)**2 * 0.005 - (depth_of_discharge - 50)**2 * 0.0015 - (charge_rate * 2.0)
    soh = np.clip(soh + np.random.normal(0, 0.5, n_samples), 50.0, 100.0)
    
    df = pd.DataFrame({
        "cycles": cycles,
        "avg_temp": avg_temp,
        "dod": depth_of_discharge,
        "charge_rate": charge_rate,
        "soh": soh
    })
    
    X = df[["cycles", "avg_temp", "dod", "charge_rate"]]
    y = df["soh"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = calculate_mape(y_test, y_pred)
    r2 = model.score(X_test, y_test)
    
    metrics = {"mae": float(mae), "rmse": float(rmse), "mape": float(mape), "r2": float(r2)}
    feature_importance = dict(zip(X.columns, [float(x) for x in model.feature_importances_]))
    
    joblib.dump({"model": model, "metrics": metrics, "feature_importance": feature_importance}, "backend/models/degradation_model.joblib")
    print(f"Degradation Model Trained. R2: {r2:.4f}, RMSE: {rmse:.4f}")

def train_rul_model():
    print("Training Remaining Useful Life (RUL) Model...")
    np.random.seed(42)
    n_samples = 1200
    
    current_soh = np.random.uniform(80.0, 100.0, n_samples)
    avg_temp = np.random.uniform(20, 48, n_samples)
    cycle_history = np.random.randint(100, 4000, n_samples)
    resistance = np.random.uniform(1.2, 5.0, n_samples)
    
    # RUL is cycles remaining until SOH drops to 80%
    rul = (current_soh - 80.0) * 150 - (avg_temp - 25)**2 * 3.5 - (resistance * 80)
    rul = np.clip(rul + np.random.normal(0, 25, n_samples), 0, 5000)
    
    df = pd.DataFrame({
        "current_soh": current_soh,
        "avg_temp": avg_temp,
        "cycle_history": cycle_history,
        "resistance": resistance,
        "rul": rul
    })
    
    X = df[["current_soh", "avg_temp", "cycle_history", "resistance"]]
    y = df["rul"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = calculate_mape(y_test, y_pred)
    r2 = model.score(X_test, y_test)
    
    metrics = {"mae": float(mae), "rmse": float(rmse), "mape": float(mape), "r2": float(r2)}
    feature_importance = dict(zip(X.columns, [float(x) for x in model.feature_importances_]))
    
    joblib.dump({"model": model, "metrics": metrics, "feature_importance": feature_importance}, "backend/models/rul_model.joblib")
    print(f"RUL Model Trained. R2: {r2:.4f}, RMSE: {rmse:.4f}")

def train_charge_optimization_model():
    print("Training Charge Optimization Model...")
    np.random.seed(42)
    n_samples = 2000
    
    soc = np.random.uniform(5.0, 95.0, n_samples)
    solar_surplus = np.random.uniform(0.0, 500.0, n_samples)  # kW
    grid_price = np.random.uniform(-50.0, 350.0, n_samples)   # $/MWh
    temp = np.random.uniform(10.0, 48.0, n_samples)
    
    # Target charge power (kW): high when solar surplus is high, price is low, and soc is low. Reduced when temp is hot.
    target_charge = (solar_surplus * 0.7) + (350.0 - grid_price) * 0.3 + (100.0 - soc) * 1.5
    target_charge = np.where(temp > 45.0, target_charge * 0.2, target_charge)
    target_charge = np.where(soc > 95.0, 0.0, target_charge)
    target_charge = np.clip(target_charge + np.random.normal(0, 10, n_samples), 0, 500.0)
    
    df = pd.DataFrame({
        "soc": soc,
        "solar_surplus": solar_surplus,
        "grid_price": grid_price,
        "temp": temp,
        "target_charge": target_charge
    })
    
    X = df[["soc", "solar_surplus", "grid_price", "temp"]]
    y = df["target_charge"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = calculate_mape(y_test, y_pred)
    r2 = model.score(X_test, y_test)
    
    metrics = {"mae": float(mae), "rmse": float(rmse), "mape": float(mape), "r2": float(r2)}
    feature_importance = dict(zip(X.columns, [float(x) for x in model.feature_importances_]))
    
    joblib.dump({"model": model, "metrics": metrics, "feature_importance": feature_importance}, "backend/models/charge_opt_model.joblib")
    print(f"Charge Opt Model Trained. R2: {r2:.4f}, RMSE: {rmse:.4f}")

def train_discharge_optimization_model():
    print("Training Discharge Optimization Model...")
    np.random.seed(42)
    n_samples = 2000
    
    soc = np.random.uniform(5.0, 95.0, n_samples)
    demand_load = np.random.uniform(100.0, 800.0, n_samples)  # kW
    grid_price = np.random.uniform(-50.0, 350.0, n_samples)   # $/MWh
    temp = np.random.uniform(10.0, 48.0, n_samples)
    
    # Target discharge power (kW): high when grid price is high, demand is high, and soc is high.
    target_discharge = (demand_load * 0.4) + (grid_price * 1.2) + (soc * 2.0)
    target_discharge = np.where(temp > 45.0, target_discharge * 0.25, target_discharge)
    target_discharge = np.where(soc < 10.0, 0.0, target_discharge)
    target_discharge = np.clip(target_discharge + np.random.normal(0, 15, n_samples), 0, 500.0)
    
    df = pd.DataFrame({
        "soc": soc,
        "demand_load": demand_load,
        "grid_price": grid_price,
        "temp": temp,
        "target_discharge": target_discharge
    })
    
    X = df[["soc", "demand_load", "grid_price", "temp"]]
    y = df["target_discharge"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = calculate_mape(y_test, y_pred)
    r2 = model.score(X_test, y_test)
    
    metrics = {"mae": float(mae), "rmse": float(rmse), "mape": float(mape), "r2": float(r2)}
    feature_importance = dict(zip(X.columns, [float(x) for x in model.feature_importances_]))
    
    joblib.dump({"model": model, "metrics": metrics, "feature_importance": feature_importance}, "backend/models/discharge_opt_model.joblib")
    print(f"Discharge Opt Model Trained. R2: {r2:.4f}, RMSE: {rmse:.4f}")

if __name__ == "__main__":
    train_degradation_model()
    train_rul_model()
    train_charge_optimization_model()
    train_discharge_optimization_model()
    print("All ML models trained and saved to backend/models/")
