import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent.identity import AgentIdentity
from agent.goals import GoalManagementEngine
from agent.trace import DecisionTraceSystem
from agent.simulation import AssetSimulator
from agent.operator import OperatorApprovalWorkflow
from agent.alerts import AlertManagementSystem
from agent.memory_manager import MemoryManager
from agent.tools import SimulatedTools
from agent.scenario_simulator import ScenarioSimulatorEngine

def test_identity():
    identity = AgentIdentity()
    prof = identity.get_profile()
    assert prof["codename"] == "FluxCore-Ren-02"
    assert "SAFETY_FIRST" in prof["principles"]

def test_goals():
    goals = GoalManagementEngine()
    grid = {"battery_soc": 40.0, "grid_demand": 15000.0, "surplus": 2000.0}
    scores = {"Availability": 90, "Carbon": 95, "Stability": 85, "Battery": 80}
    evals = goals.evaluate_decision("Plan A (Prioritize Solar)", scores, grid)
    assert evals["overall_compatibility"] > 50
    assert "maximize_renewable_utilization" in evals["evaluations"]

def test_simulator():
    sim = AssetSimulator()
    weather = {"temperature": 25.0, "solar_irradiance": 800.0, "wind_speed": 10.0, "reservoir_level": 80.0, "battery_soc": 55.0}
    forecasts = {"solar_generation": 8000, "wind_generation": 6000, "hydro_generation": 2500, "total_renewable": 16500}
    res = sim.run_simulation(weather, forecasts, "Plan A (Prioritize Solar)")
    assert "solar" in res
    assert res["solar"]["cell_temp"] > 25.0
    assert res["wind"]["rotor_state"] == "SPINNING"

def test_operator_relays():
    mem = MemoryManager(db_path="backend/test_enterprise.db")
    tools = SimulatedTools(mem)
    workflow = OperatorApprovalWorkflow(mem, tools)
    
    # Check if sell excess requires operator approval
    req = workflow.queue_action(1111, "sell_excess_power", {"power_mw": 5.0, "price_per_mwh": 50.0}, "Sell risk analysis")
    assert req is True
    
    pending = workflow.get_pending()
    assert len(pending) > 0
    item_id = pending[0]["id"]
    
    # Approve
    res = workflow.approve_action(item_id, "Approved for testing")
    assert res["status"] == "success"
    
    # Clean up test DB file
    conn = mem._get_connection()
    conn.close()
    if os.path.exists("backend/test_enterprise.db"):
        try:
            os.remove("backend/test_enterprise.db")
        except Exception:
            pass

if __name__ == "__main__":
    print("Running Enterprise Unit Tests...")
    test_identity()
    print("[OK] Identity Module Verified.")
    test_goals()
    print("[OK] Goal Management Engine Verified.")
    test_simulator()
    print("[OK] Operational Digital Twin Simulator Verified.")
    test_operator_relays()
    print("[OK] Operator Approval Relays Verified.")
    print("All Enterprise Unit Tests Passed successfully!")
