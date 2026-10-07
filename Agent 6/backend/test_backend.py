import sys
import os

# Add workspace directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.session import SessionLocal, Base, engine
from backend.database.models import StrategyResult
from backend.agent.state_machine import state_machine
from backend.digital_twin.digital_twin import digital_twin
from backend.models.ml_forecasting import ml_system
from backend.services.planner_service import planner_service
from backend.optimization.optimizer_service import optimizer_service
from backend.services.trading_engine import trading_engine

def run_diagnostics():
    print("=== STARTING AGENT 6 DIAGNOSTICS ===")
    
    print("1. Creating database schemas...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    print("2. Training ML models registry...")
    ml_system.train_models()
    reg = ml_system.load_registry()
    print(f"   ML Registry Loaded. Models in registry: {list(reg.get('models', {}).keys())}")
    
    print("3. Evaluating multi-objective optimizer and strategy planner...")
    plans = planner_service.generate_plans(
        demand_kw=550.0,
        solar_gen_kw=420.0,
        battery_soc=0.65,
        battery_capacity_kwh=600.0,
        buy_price=0.28,
        sell_price=0.08
    )
    print(f"   Planner successfully generated {len(plans)} plans.")
    for p in plans:
        print(f"   - {p.plan_name}: cost=${p.expected_cost}, profit=${p.expected_profit}, battery_wear=${p.battery_impact}, confidence={p.confidence_score}%")

    print("4. Stepping grid digital twin simulation...")
    twin_state = digital_twin.step_simulation(battery_dispatch_kw=50.0)
    print(f"   Digital Twin status: solar={twin_state['solar_gen_kw']}kW, load={twin_state['load_demand_kw']}kW, battery_soc={twin_state['battery']['soc']}")

    print("5. Running market trading log simulation...")
    receipt = trading_engine.execute_market_trade(db, "SELL", 80.0, 0.32)
    print(f"   Trade completed. Receipt TX ID: {receipt.get('transaction_id')}, Status: {receipt.get('status')}")

    db.close()
    print("=== DIAGNOSTICS COMPLETE - ALL MODULES NOMINAL ===")

if __name__ == "__main__":
    run_diagnostics()
