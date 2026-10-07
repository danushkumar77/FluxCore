import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.feature_engineering import engineer_features
from agent.knowledge_engine import KnowledgeEngine
from agent.decision_engine import DecisionEngine
from agent.reflection_engine import ReflectionEngine
from agent.memory_manager import MemoryManager

def test_feature_engineering():
    # Construct minimal weather dataset
    test_data = {
        "timestamp": [datetime(2025, 6, 1, 12, 0).isoformat(), datetime(2025, 6, 1, 13, 0).isoformat()],
        "solar_irradiance": [800.0, 750.0],
        "cloud_cover": [0.1, 0.2],
        "wind_speed": [8.0, 9.0],
        "wind_direction": [180.0, 190.0],
        "temperature": [28.0, 29.0],
        "humidity": [40.0, 42.0],
        "rainfall": [0.0, 0.0],
        "atmospheric_pressure": [1013.25, 1012.8],
        "reservoir_level": [80.0, 79.9],
        "grid_demand": [15000.0, 15200.0],
        "battery_soc": [50.0, 52.0],
        "electricity_price": [50.0, 52.0],
        "season": [3, 3]
    }
    
    df = pd.DataFrame(test_data)
    df_eng = engineer_features(df)
    
    # Assert columns are generated
    assert "solar_zenith_angle" in df_eng.columns
    assert "air_density" in df_eng.columns
    assert "wind_power_density" in df_eng.columns
    assert "solar_efficiency_index" in df_eng.columns
    assert "weather_severity_index" in df_eng.columns
    assert "renewable_stability_index" in df_eng.columns
    
    # Assert cyclic encoding is correct
    assert -1.0 <= df_eng["hour_sin"].iloc[0] <= 1.0
    assert -1.0 <= df_eng["hour_cos"].iloc[0] <= 1.0

def test_knowledge_compliance():
    ke = KnowledgeEngine()
    
    # Test storm shut-down wind threshold (safety cutoff: 25 m/s)
    warnings = ke.check_compliance(
        solar_forecast=5000, 
        wind_forecast=0, 
        hydro_forecast=3000, 
        reservoir_level=80.0, 
        wind_speed=28.0 # Storm wind
    )
    
    # Assert we caught the safety cut-out warning
    has_storm_warning = any(["Storm cut-out" in w["message"] for w in warnings])
    assert has_storm_warning is True
    
    # Test reservoir low warning
    warnings_low_res = ke.check_compliance(
        solar_forecast=100,
        wind_forecast=100,
        hydro_forecast=0,
        reservoir_level=12.0, # Below 15% minimum safety level
        wind_speed=5.0
    )
    has_low_reservoir_critical = any(["critical low" in w["message"] for w in warnings_low_res])
    assert has_low_reservoir_critical is True

def test_decision_engine():
    ke = KnowledgeEngine()
    de = DecisionEngine(ke)
    
    weather = {
        "solar_irradiance": 900.0,
        "cloud_cover": 0.05,
        "wind_speed": 10.0,
        "wind_direction": 180.0,
        "temperature": 25.0,
        "humidity": 30.0,
        "rainfall": 0.0,
        "atmospheric_pressure": 1013.25,
        "reservoir_level": 80.0,
        "grid_demand": 15000.0,
        "battery_soc": 40.0,
        "electricity_price": 40.0,
        "season": 3
    }
    
    forecasts = {
        "solar_generation": 9000.0, # Massive solar
        "wind_generation": 7000.0,  # Massive wind
        "hydro_generation": 3000.0,  # Stable hydro
        "total_renewable": 19000.0
    }
    
    results = de.evaluate_plans(weather, forecasts)
    
    # Verify Plan evaluation output
    assert "plans" in results
    assert "Plan A (Prioritize Solar)" in results["plans"]
    assert "Plan D (Charge Battery)" in results["plans"]
    assert "optimal_strategy" in results
    assert len(results["optimal_strategy"]["recommendations"]) > 0

if __name__ == "__main__":
    print("Running Unit Tests...")
    test_feature_engineering()
    print("[OK] Feature Engineering Tests Passed.")
    test_knowledge_compliance()
    print("[OK] Knowledge Compliance Tests Passed.")
    test_decision_engine()
    print("[OK] Decision Engine Tests Passed.")
    print("All Unit Tests Passed successfully!")
