import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, TimeSeriesSplit
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, root_mean_squared_error, mean_absolute_error
)

MODEL_DIR = "backend/app/infrastructure/models"
os.makedirs(MODEL_DIR, exist_ok=True)

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # Base parameters
    voltage = np.random.normal(1.0, 0.03, num_samples)
    current = np.random.normal(0.4, 0.1, num_samples)
    frequency = np.random.normal(60.0, 0.05, num_samples)
    harmonics = np.random.uniform(0.3, 1.2, num_samples)
    load = np.random.normal(65.0, 10.0, num_samples)
    
    # Faults (High current, low voltage)
    fault_indices = np.random.choice(num_samples, int(num_samples * 0.08), replace=False)
    current[fault_indices] = np.random.uniform(3.5, 5.5, len(fault_indices))
    voltage[fault_indices] = np.random.uniform(0.1, 0.4, len(fault_indices))
    harmonics[fault_indices] = np.random.uniform(5.0, 12.0, len(fault_indices))
    
    # Warnings (Slightly high load/temperature or voltage droop)
    warning_indices = np.random.choice(
        list(set(range(num_samples)) - set(fault_indices)), 
        int(num_samples * 0.12), 
        replace=False
    )
    current[warning_indices] = np.random.uniform(1.2, 1.8, len(warning_indices))
    voltage[warning_indices] = np.random.uniform(0.88, 0.94, len(warning_indices))
    harmonics[warning_indices] = np.random.uniform(2.0, 4.0, len(warning_indices))

    # Labels for Fault Detection [0: Normal, 1: Warning, 2: Fault]
    detection_labels = np.zeros(num_samples)
    detection_labels[warning_indices] = 1
    detection_labels[fault_indices] = 2

    # Classification labels (only meaningful for faults)
    class_labels = np.random.choice([0, 1, 2, 3], num_samples) # L-G, L-L, L-L-G, 3-Phase
    # Equipment parameters
    winding_temp = np.random.normal(60.0, 5.0, num_samples)
    oil_temp = np.random.normal(52.0, 4.0, num_samples)
    vibration = np.random.normal(12.0, 2.0, num_samples)
    partial_discharge = np.random.uniform(5.0, 25.0, num_samples)
    insulation = np.random.normal(800.0, 50.0, num_samples)
    
    # Trigger equipment degradation
    eq_degraded_indices = np.random.choice(num_samples, int(num_samples * 0.15), replace=False)
    winding_temp[eq_degraded_indices] = np.random.uniform(90.0, 120.0, len(eq_degraded_indices))
    oil_temp[eq_degraded_indices] = np.random.uniform(80.0, 100.0, len(eq_degraded_indices))
    partial_discharge[eq_degraded_indices] = np.random.uniform(300.0, 600.0, len(eq_degraded_indices))
    vibration[eq_degraded_indices] = np.random.uniform(60.0, 130.0, len(eq_degraded_indices))
    insulation[eq_degraded_indices] = np.random.uniform(50.0, 150.0, len(eq_degraded_indices))
    
    equipment_labels = np.zeros(num_samples)
    equipment_labels[eq_degraded_indices] = np.random.choice([1, 2, 3], len(eq_degraded_indices)) # Line, Transformer, Relay

    # Distance regression (km)
    distance = np.random.uniform(1.0, 45.0, num_samples)
    # Remaining Useful Life (hours)
    rul = np.random.uniform(50.0, 2000.0, num_samples)
    rul[eq_degraded_indices] = np.random.uniform(1.0, 48.0, len(eq_degraded_indices))

    # Grid stability score (0-100%)
    stability = 100.0 - (harmonics * 2.5 + (1.0 - voltage) * 50.0 + (current * 5.0))
    stability = np.clip(stability, 10.0, 100.0)

    data = pd.DataFrame({
        "voltage": voltage,
        "current": current,
        "frequency": frequency,
        "harmonics": harmonics,
        "load": load,
        "winding_temp": winding_temp,
        "oil_temp": oil_temp,
        "vibration": vibration,
        "partial_discharge": partial_discharge,
        "insulation": insulation,
        "distance": distance,
        "rul": rul,
        "stability": stability
    })

    return data, detection_labels, class_labels, equipment_labels

def train_and_save_models():
    print("Generating training dataset...")
    data, y_detect, y_class, y_eq = generate_synthetic_data(1500)
    
    metrics_summary = {}

    # 1. Fault Detection Model (RandomForestClassifier)
    X1 = data[["voltage", "current", "frequency", "harmonics", "load"]]
    X_train, X_test, y_train, y_test = train_test_split(X1, y_detect, test_size=0.2, random_state=42)
    
    print("Training Model 1: Fault Detection Model...")
    model1 = RandomForestClassifier(n_estimators=100, random_state=42)
    model1.fit(X_train, y_train)
    y_pred1 = model1.predict(X_test)
    
    acc1 = accuracy_score(y_test, y_pred1)
    prec1 = precision_score(y_test, y_pred1, average='macro')
    rec1 = recall_score(y_test, y_pred1, average='macro')
    f1_1 = f1_score(y_test, y_pred1, average='macro')
    
    joblib.dump(model1, os.path.join(MODEL_DIR, "fault_detection.joblib"))
    
    metrics_summary["fault_detection"] = {
        "accuracy": float(acc1),
        "precision": float(prec1),
        "recall": float(rec1),
        "f1_score": float(f1_1),
        "feature_importances": dict(zip(X1.columns, map(float, model1.feature_importances_)))
    }

    # 2. Fault Classification Model (XGBClassifier)
    X2 = data[["voltage", "current", "harmonics"]]
    X_train, X_test, y_train, y_test = train_test_split(X2, y_class, test_size=0.2, random_state=42)
    
    print("Training Model 2: Fault Classification Model...")
    model2 = XGBClassifier(n_estimators=100, random_state=42)
    model2.fit(X_train, y_train)
    y_pred2 = model2.predict(X_test)
    
    acc2 = accuracy_score(y_test, y_pred2)
    prec2 = precision_score(y_test, y_pred2, average='macro')
    rec2 = recall_score(y_test, y_pred2, average='macro')
    f1_2 = f1_score(y_test, y_pred2, average='macro')
    
    joblib.dump(model2, os.path.join(MODEL_DIR, "fault_classification.joblib"))
    
    metrics_summary["fault_classification"] = {
        "accuracy": float(acc2),
        "precision": float(prec2),
        "recall": float(rec2),
        "f1_score": float(f1_2),
        "feature_importances": dict(zip(X2.columns, map(float, model2.feature_importances_)))
    }

    # 3. Fault Localization Model (RandomForestRegressor)
    X3 = data[["voltage", "current"]]
    y_dist = data["distance"]
    X_train, X_test, y_train, y_test = train_test_split(X3, y_dist, test_size=0.2, random_state=42)
    
    print("Training Model 3: Fault Localization Model...")
    model3 = RandomForestRegressor(n_estimators=100, random_state=42)
    model3.fit(X_train, y_train)
    y_pred3 = model3.predict(X_test)
    
    rmse3 = root_mean_squared_error(y_test, y_pred3)
    mae3 = mean_absolute_error(y_test, y_pred3)
    
    joblib.dump(model3, os.path.join(MODEL_DIR, "fault_localization.joblib"))
    
    metrics_summary["fault_localization"] = {
        "rmse": float(rmse3),
        "mae": float(mae3),
        "feature_importances": dict(zip(X3.columns, map(float, model3.feature_importances_)))
    }

    # 4. Outage Prediction Model (XGBRegressor)
    X4 = data[["voltage", "current", "harmonics", "load"]]
    y_rul = data["rul"]
    X_train, X_test, y_train, y_test = train_test_split(X4, y_rul, test_size=0.2, random_state=42)
    
    print("Training Model 4: Outage Prediction Model...")
    model4 = XGBRegressor(n_estimators=100, random_state=42)
    model4.fit(X_train, y_train)
    y_pred4 = model4.predict(X_test)
    
    rmse4 = root_mean_squared_error(y_test, y_pred4)
    mae4 = mean_absolute_error(y_test, y_pred4)
    
    joblib.dump(model4, os.path.join(MODEL_DIR, "outage_prediction.joblib"))
    
    metrics_summary["outage_prediction"] = {
        "rmse": float(rmse4),
        "mae": float(mae4),
        "feature_importances": dict(zip(X4.columns, map(float, model4.feature_importances_)))
    }

    # 5. Equipment Failure Prediction Model (RandomForestClassifier)
    X5 = data[["winding_temp", "oil_temp", "vibration", "partial_discharge", "insulation"]]
    X_train, X_test, y_train, y_test = train_test_split(X5, y_eq, test_size=0.2, random_state=42)
    
    print("Training Model 5: Equipment Failure Model...")
    model5 = RandomForestClassifier(n_estimators=100, random_state=42)
    model5.fit(X_train, y_train)
    y_pred5 = model5.predict(X_test)
    
    acc5 = accuracy_score(y_test, y_pred5)
    prec5 = precision_score(y_test, y_pred5, average='macro')
    rec5 = recall_score(y_test, y_pred5, average='macro')
    f1_5 = f1_score(y_test, y_pred5, average='macro')
    
    joblib.dump(model5, os.path.join(MODEL_DIR, "equipment_failure.joblib"))
    
    metrics_summary["equipment_failure"] = {
        "accuracy": float(acc5),
        "precision": float(prec5),
        "recall": float(rec5),
        "f1_score": float(f1_5),
        "feature_importances": dict(zip(X5.columns, map(float, model5.feature_importances_)))
    }

    # 6. Grid Stability Model (RandomForestRegressor)
    X6 = data[["voltage", "current", "harmonics", "load"]]
    y_stab = data["stability"]
    X_train, X_test, y_train, y_test = train_test_split(X6, y_stab, test_size=0.2, random_state=42)
    
    print("Training Model 6: Grid Stability Model...")
    model6 = RandomForestRegressor(n_estimators=100, random_state=42)
    model6.fit(X_train, y_train)
    y_pred6 = model6.predict(X_test)
    
    rmse6 = root_mean_squared_error(y_test, y_pred6)
    mae6 = mean_absolute_error(y_test, y_pred6)
    
    joblib.dump(model6, os.path.join(MODEL_DIR, "grid_stability.joblib"))
    
    metrics_summary["grid_stability"] = {
        "rmse": float(rmse6),
        "mae": float(mae6),
        "feature_importances": dict(zip(X6.columns, map(float, model6.feature_importances_)))
    }

    # Save metrics JSON
    with open(os.path.join(MODEL_DIR, "metrics.json"), 'w') as f:
        json.dump(metrics_summary, f, indent=2)
    print("All 6 models successfully trained and evaluation report exported.")

if __name__ == "__main__":
    train_and_save_models()
