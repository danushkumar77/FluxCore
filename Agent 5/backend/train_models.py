import os
import pickle
import json
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score

# Ensure the output directory exists
os.makedirs("backend/models", exist_ok=True)

print("Starting training script for FluxCore Agent 5...")

# 1. Generate Synthetic Data
np.random.seed(42)
num_samples = 1500

# Features:
# 0: asset_type_code (0: Transformer, 1: Breaker, 2: Line, 3: Wind, 4: Solar, 5: Battery)
# 1: temp
# 2: vibration
# 3: pressure
# 4: elec_voltage
# 5: elec_current
# 6: wear_factor
# 7: operational_cycles
# 8: load_factor
# 9: age_days
# 10: temp_trend (rate of change)
# 11: vibration_trend
# 12: elec_trend
# 13: drift_flag (0: Normal, 1: Drifted)
# 14: criticality

data = []
for i in range(num_samples):
    asset_type = np.random.randint(0, 6)
    age = np.random.randint(10, 3000)
    criticality = np.random.uniform(10.0, 100.0)
    
    # Defaults
    temp = np.random.normal(45.0, 10.0)
    vibration = np.random.normal(1.2, 0.3)
    pressure = 0.0
    elec_voltage = np.random.normal(220.0, 15.0)
    elec_current = np.random.normal(100.0, 20.0)
    wear = np.random.uniform(0.0, 10.0)
    cycles = np.random.randint(10, 500)
    load = np.random.normal(60.0, 10.0)
    drift = 0.0
    
    # Modify based on asset types
    if asset_type == 0:  # Transformer
        temp = np.random.normal(55.0, 15.0)
        vibration = np.random.normal(1.5, 0.5)
        elec_voltage = np.random.normal(65.0, 5.0)  # kV breakdown
        wear = np.random.uniform(1.0, 30.0)         # moisture
    elif asset_type == 1:  # Breaker
        pressure = np.random.normal(6.0, 0.4)
        cycles = np.random.randint(100, 1200)
        wear = np.random.uniform(5.0, 45.0)         # contact wear
    elif asset_type == 2:  # Line
        temp = np.random.normal(35.0, 10.0)
        wear = np.random.uniform(0.5, 3.5)          # sag
    elif asset_type == 3:  # Wind
        vibration = np.random.normal(0.18, 0.08)    # g
        temp = np.random.normal(60.0, 12.0)         # gearbox oil
        cycles = np.random.randint(100, 600)        # speed rpm
    elif asset_type == 4:  # Solar
        temp = np.random.normal(40.0, 8.0)          # panel temp
        wear = np.random.uniform(0.5, 5.0)          # dust
        load = np.random.normal(95.0, 2.0)          # inverter efficiency
    elif asset_type == 5:  # Battery
        temp = np.random.normal(28.0, 6.0)
        cycles = np.random.randint(100, 1500)
        wear = np.random.uniform(10.0, 40.0)        # resistance
        load = np.random.normal(85.0, 5.0)          # SOH
        
    # Inject degradation and trends
    is_degrading = np.random.rand() > 0.8
    temp_trend = np.random.normal(0.05, 0.02)
    vibration_trend = np.random.normal(0.01, 0.01)
    elec_trend = np.random.normal(0.0, 0.1)
    
    if is_degrading:
        # Increase values indicating degradation
        temp += np.random.uniform(15.0, 40.0)
        vibration *= np.random.uniform(1.5, 3.5)
        wear *= np.random.uniform(1.5, 2.5)
        temp_trend += np.random.uniform(0.5, 2.0)
        vibration_trend += np.random.uniform(0.1, 0.5)
        if asset_type == 1:  # Breaker SF6 leakage
            pressure -= np.random.uniform(0.8, 1.8)
        if asset_type == 5:  # Battery cell SOH drop
            load -= np.random.uniform(15.0, 45.0)  # SOH drop
            
    # Inject Sensor Drift randomly (in 5% of cases)
    is_drift = np.random.rand() > 0.95
    if is_drift:
        drift = 1.0
        # Drift means flat sensor or calibration shift
        temp += 30.0 if np.random.rand() > 0.5 else -20.0
        temp_trend = 0.0  # frozen sensor
        
    # Determine Targets based on physics-like rules
    fail_prob = 0.02
    if is_degrading:
        fail_prob = np.random.uniform(0.5, 0.98)
    else:
        # Age-based failure risk
        fail_prob += (age / 3000.0) * 0.15
        
    failure_label = 1 if fail_prob > 0.6 else 0
    
    # RUL calculation
    if failure_label == 1:
        rul_days = np.random.uniform(2.0, 25.0)
    else:
        rul_days = np.random.uniform(25.0, 180.0)
        
    # Failure class (0: Electrical, 1: Mechanical, 2: Thermal, 3: Environmental)
    if failure_label == 1:
        if asset_type in [0, 5]:
            fail_class = 2 if np.random.rand() > 0.4 else 0  # Thermal or Electrical
        elif asset_type in [1, 3]:
            fail_class = 1  # Mechanical
        elif asset_type == 2:
            fail_class = 3 if np.random.rand() > 0.5 else 1  # Environmental or Mechanical
        else:
            fail_class = 0
    else:
        fail_class = -1  # No failure
        
    # Optimal maintenance timing (days from now)
    if failure_label == 1:
        opt_timing = np.maximum(1.0, rul_days - np.random.uniform(1.0, 5.0))
    else:
        opt_timing = np.random.uniform(30.0, 90.0)
        
    data.append([
        asset_type, temp, vibration, pressure, elec_voltage, elec_current, wear, cycles, load,
        age, temp_trend, vibration_trend, elec_trend, drift, criticality,
        failure_label, fail_prob, rul_days, fail_class, opt_timing
    ])

columns = [
    "asset_type", "temp", "vibration", "pressure", "elec_voltage", "elec_current", "wear", "cycles", "load",
    "age", "temp_trend", "vibration_trend", "elec_trend", "drift", "criticality",
    "failure_label", "fail_prob", "rul_days", "fail_class", "opt_timing"
]
df = pd.DataFrame(data, columns=columns)

# Split features and labels
X = df.iloc[:, :15].values
y_fail = df["failure_label"].values
y_rul = df["rul_days"].values
y_class = df["fail_class"].values
y_time = df["opt_timing"].values
y_drift = df["drift"].values

# Train-Test Splits
X_train, X_test, y_fail_train, y_fail_test = train_test_split(X, y_fail, test_size=0.2, random_state=42)
_, _, y_rul_train, y_rul_test = train_test_split(X, y_rul, test_size=0.2, random_state=42)
_, _, y_class_train, y_class_test = train_test_split(X, y_class, test_size=0.2, random_state=42)
_, _, y_time_train, y_time_test = train_test_split(X, y_time, test_size=0.2, random_state=42)
_, _, y_drift_train, y_drift_test = train_test_split(X, y_drift, test_size=0.2, random_state=42)

# Normal data for anomaly models
normal_idx = np.where(y_fail == 0)[0]
X_normal = X[normal_idx]

# 2. Train Models

# Model 1: Asset Failure Prediction (RF Classifier)
model_fail = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
model_fail.fit(X_train, y_fail_train)
y_fail_pred = model_fail.predict(X_test)
fail_acc = accuracy_score(y_fail_test, y_fail_pred)
fail_f1 = f1_score(y_fail_test, y_fail_pred, zero_division=0)
print(f"Model 1: Failure Prediction Acc: {fail_acc:.4f}, F1: {fail_f1:.4f}")

# Model 2: Remaining Useful Life Regressor (RF Regressor)
model_rul = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
model_rul.fit(X_train, y_rul_train)
y_rul_pred = model_rul.predict(X_test)
rul_rmse = np.sqrt(mean_squared_error(y_rul_test, y_rul_pred))
rul_r2 = r2_score(y_rul_test, y_rul_pred)
print(f"Model 2: RUL Regressor RMSE: {rul_rmse:.4f}, R2: {rul_r2:.4f}")

# Model 3: Anomaly Detection (Isolation Forest)
model_anomaly = IsolationForest(contamination=0.1, random_state=42)
model_anomaly.fit(X_normal)
print("Model 3: Anomaly Detection Isolation Forest fitted.")

# Model 6: Failure Classification (RF Classifier)
# Filter test indices where failure actually occurs for evaluation
fail_eval_idx = np.where(y_class_test != -1)[0]
# Use all training failure classes for fitting
model_class = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
# Treat -1 as a distinct class or fit just on failures. Let's fit on all, including -1, as 'No Failure' = -1
model_class.fit(X_train, y_class_train)
y_class_pred = model_class.predict(X_test)
class_acc = accuracy_score(y_class_test, y_class_pred)
print(f"Model 6: Failure Classification Acc: {class_acc:.4f}")

# Model 7: Predictive Maintenance Timing Model
model_time = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
model_time.fit(X_train, y_time_train)
y_time_pred = model_time.predict(X_test)
time_rmse = np.sqrt(mean_squared_error(y_time_test, y_time_pred))
print(f"Model 7: Maintenance Timing RMSE: {time_rmse:.4f}")

# Model 8: Sensor Drift Detection (Isolation Forest)
model_drift = IsolationForest(contamination=0.05, random_state=42)
model_drift.fit(X_train)
print("Model 8: Sensor Drift Isolation Forest fitted.")

# Save Models
models_dict = {
    "model_fail": model_fail,
    "model_rul": model_rul,
    "model_anomaly": model_anomaly,
    "model_class": model_class,
    "model_time": model_time,
    "model_drift": model_drift
}

with open("backend/models/models.pkl", "wb") as f:
    pickle.dump(models_dict, f)
print("All models pickled successfully to backend/models/models.pkl")

# Generate and Save Metrics JSON
metrics = {
    "model_1_failure_prediction": {
        "accuracy": float(fail_acc),
        "precision": float(precision_score(y_fail_test, y_fail_pred, zero_division=0)),
        "recall": float(recall_score(y_fail_test, y_fail_pred, zero_division=0)),
        "f1_score": float(fail_f1)
    },
    "model_2_rul_prediction": {
        "rmse_days": float(rul_rmse),
        "r2_score": float(rul_r2)
    },
    "model_6_failure_classification": {
        "accuracy": float(class_acc)
    },
    "model_7_maintenance_timing": {
        "rmse_days": float(time_rmse)
    },
    "training_samples": num_samples,
    "timestamp": datetime.utcnow().isoformat()
}

with open("backend/models/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print("Metrics saved successfully to backend/models/metrics.json")
