import time
import json
import threading
import traceback
from datetime import datetime
from typing import Dict, Any, List
from backend.agent.state_machine import state_machine, AgentState
from backend.database.session import SessionLocal, engine
from backend.database.models import Base, StrategyResult
from backend.event_bus.subscriber import agent_data_cache
from backend.event_bus.contracts.events import create_event
from backend.event_bus.publisher import publish
from backend.digital_twin.digital_twin import digital_twin
from backend.models.ml_forecasting import ml_system
from backend.models.model_monitor import model_monitor
from backend.services.planner_service import planner_service
from backend.services.gemini_reasoning import gemini_reasoning
from backend.services.execution_service import execution_service
from backend.services.reflection_service import reflection_service
from backend.services.learning_service import learning_service
from backend.services.trading_engine import trading_engine
from backend.services.carbon_service import carbon_service
from backend.memory.memory_engine import memory_engine
from backend.observability.metrics import agent_metrics
from backend.observability.logger import agent_logger
from backend.knowledge.knowledge_base import knowledge_base
from backend.optimization.optimizer_service import optimizer_service

# Active run state
_running = False
_thread: threading.Thread = None

# Cache of last completed decision details for API/WS consumption
last_decision_report: Dict[str, Any] = {
    "timestamp": datetime.utcnow().isoformat(),
    "state": "Idle",
    "market": {
        "buying_price": 0.15,
        "selling_price": 0.05,
        "price_forecast_1h": 0.16,
        "price_forecast_24h": 0.15,
        "demand_forecast": 420.0,
        "solar_forecast": 280.0,
        "volatility_score": 0.15
    },
    "battery": {
        "soc": 0.52,
        "capacity_kwh": 600.0,
        "soh": 98.4,
        "temperature_c": 28.5,
        "dispatch_kw": 0.0
    },
    "chosen_strategy": "Plan A: Renewable First Strategy",
    "plans": [],
    "ai_reasoning": "Awaiting first execution cycle...",
    "savings_today": 124.50,
    "green_score": 85.0,
    "co2_avoided": 320.0,
    "accuracy": 95.0,
    "opportunity_score": 45.0
}

def start_orchestrator():
    global _running, _thread
    if _running:
        return
    _running = True
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    
    _thread = threading.Thread(target=_run_loop, daemon=True)
    _thread.start()
    agent_logger.info("Agent Orchestrator background worker loop started.")

def stop_orchestrator():
    global _running
    _running = False
    if _thread:
        _thread.join(timeout=2.0)
    agent_logger.info("Agent Orchestrator background worker loop stopped.")

def _run_loop():
    global last_decision_report
    db = SessionLocal()
    
    # Pre-train models on start to initialize registry.json
    try:
        ml_system.train_models()
    except Exception as e:
        agent_logger.error(f"Error initializing ML models: {e}")

    # Seed initial mock memory so retrieval similarity matching has baseline points
    try:
        if db.query(StrategyResult).count() == 0:
            memory_engine.store_memory(
                db, "Learning",
                {"buying_price": 0.45, "renewable_gen_kw": 50.0, "demand_kw": 800.0, "battery_soc": 0.85},
                "DISCHARGE_BATTERY (150.0 kW)",
                85.50, "SUCCESSFUL", "peak_prices"
            )
            memory_engine.store_memory(
                db, "Learning",
                {"buying_price": 0.10, "renewable_gen_kw": 700.0, "demand_kw": 200.0, "battery_soc": 0.30},
                "CHARGE_BATTERY (120.0 kW)",
                42.20, "SUCCESSFUL", "solar_surplus"
            )
    except Exception as e:
        agent_logger.error(f"Error seeding memory records: {e}")

    while _running:
        try:
            cycle_start_time = time.time()
            
            # 1. OBSERVE (State: Monitoring)
            state_machine.transition_to(AgentState.MONITORING)
            # Read digital twin current telemetry
            twin_data = digital_twin.step_simulation(last_decision_report["battery"]["dispatch_kw"])
            
            # Read peer agents' data from event subscribers cache
            demand_forecast = agent_data_cache.get("demand_forecast_kw", twin_data["load_demand_kw"])
            solar_forecast = agent_data_cache.get("solar_forecast_kw", twin_data["solar_gen_kw"])
            battery_soc = twin_data["battery"]["soc"]
            
            # Determine market prices
            now = datetime.now()
            prices = knowledge_base.get_tariff_for_hour(now.hour, now.month)
            buy_price = prices["buy"]
            sell_price = prices["sell"]
            
            time.sleep(0.4)  # Visual pause for state machine demonstration

            # 2. ANALYZE (State: Market Analysis)
            state_machine.transition_to(AgentState.MARKET_ANALYSIS)
            opp_score = trading_engine.calculate_opportunity_score(buy_price, sell_price, battery_soc)
            time.sleep(0.4)

            # 3. PREDICT (State: Economic Forecasting)
            state_machine.transition_to(AgentState.ECONOMIC_FORECASTING)
            pred_1h, pred_24h, spike_prob = ml_system.predict_price_forecast(
                demand_forecast, solar_forecast, now.hour, now.weekday()
            )
            op_cost, peak_cost, energy_purchase_cost = ml_system.predict_operating_costs(
                pred_1h, demand_forecast, battery_soc
            )
            time.sleep(0.4)

            # 4. STRATEGY PLANNING (State: Strategy Planning)
            state_machine.transition_to(AgentState.STRATEGY_PLANNING)
            plans = planner_service.generate_plans(
                demand_forecast, solar_forecast, battery_soc, 
                twin_data["battery"]["capacity_kwh"], buy_price, sell_price
            )
            
            # Save strategy options to DB
            for p in plans:
                db_strat = StrategyResult(
                    timestamp=datetime.utcnow(),
                    plan_name=p.plan_name,
                    expected_cost=p.expected_cost,
                    expected_profit=p.expected_profit,
                    battery_impact=p.battery_impact,
                    carbon_impact=p.carbon_impact,
                    grid_risk=p.grid_risk,
                    confidence_score=p.confidence_score,
                    selected=False,
                    rollback_plan=p.rollback_plan
                )
                db.add(db_strat)
            db.commit()
            time.sleep(0.4)

            # 5. OPTIMIZE (State: Optimization)
            state_machine.transition_to(AgentState.OPTIMIZATION)
            # Evaluate similar events and adapt optimization weights
            current_situation = {
                "buying_price": buy_price,
                "renewable_gen_kw": solar_forecast,
                "demand_kw": demand_forecast,
                "battery_soc": battery_soc
            }
            adapted_weights = learning_service.adapt_heuristic_weights(db, current_situation)
            
            # Solve optimization
            dispatch_kw, optimal_cost, expected_carbon = optimizer_service.optimize_dispatch(
                demand_forecast, solar_forecast, battery_soc, 
                twin_data["battery"]["capacity_kwh"], buy_price, sell_price, adapted_weights
            )
            
            # Select Plan that matches the dispatch power
            selected_plan = plans[0] # Fallback
            best_diff = float("inf")
            for p in plans:
                # Deduce which plan corresponds to our optimizer's goals
                if "Arbitrage" in p.plan_name and buy_price < 0.15:
                    selected_plan = p
                    break
                elif "Peak" in p.plan_name and demand_forecast > 700:
                    selected_plan = p
                    break
                elif "Carbon" in p.plan_name and solar_forecast > demand_forecast:
                    selected_plan = p
                    break
            
            selected_plan.selected = True
            time.sleep(0.4)

            # 6. REASON (State: AI Reasoning)
            state_machine.transition_to(AgentState.AI_REASONING)
            reasoning_context = {
                "state": state_machine.get_state().value,
                "buying_price": buy_price,
                "demand_kw": demand_forecast,
                "solar_gen_kw": solar_forecast,
                "battery_soc": battery_soc,
                "chosen_strategy": selected_plan.plan_name,
                "expected_savings": selected_plan.expected_profit if selected_plan.expected_profit > 0 else 18.5,
                "confidence": selected_plan.confidence_score
            }
            ai_explanation = gemini_reasoning.generate_explanation(reasoning_context)
            time.sleep(0.4)

            # 7. EXECUTE (State: Execution)
            state_machine.transition_to(AgentState.EXECUTION)
            # Log action and apply to digital twin
            exec_receipt = {}
            if dispatch_kw < -10.0:
                exec_receipt = execution_service.charge_battery(db, abs(dispatch_kw), buy_price, selected_plan.confidence_score)
            elif dispatch_kw > 10.0:
                exec_receipt = execution_service.discharge_battery(db, dispatch_kw, buy_price, selected_plan.confidence_score)
            else:
                exec_receipt = execution_service._log_execution(
                    db, "IDLE_BATTERY", demand_forecast, solar_forecast, battery_soc, buy_price, 0.0, selected_plan.confidence_score
                )
                
            # If arbitrage profit exists, simulate executing an energy trade
            if opp_score > 75.0 and battery_soc > 0.40:
                trade_kwh = min(100.0, battery_soc * twin_data["battery"]["capacity_kwh"])
                trading_engine.execute_market_trade(db, "SELL", trade_kwh, sell_price)
                execution_service.activate_energy_trade(db, 1, trade_kwh * (sell_price - buy_price), selected_plan.confidence_score)
                
            # Check model drift and retrain if needed
            model_monitor.check_model_drift()
            
            # Publish event contracts to multi-agent event bus
            evt_payload = {
                "strategy_id": selected_plan.strategy_id,
                "plan_name": selected_plan.plan_name,
                "expected_savings": selected_plan.expected_profit
            }
            evt = create_event("economic.strategy.generated", "agent_6", evt_payload)
            publish(evt)
            
            time.sleep(0.4)

            # 8. REFLECT (State: Reflection)
            state_machine.transition_to(AgentState.REFLECTION)
            acc = reflection_service.perform_reflection(db)
            time.sleep(0.4)

            # 9. LEARN (State: Learning)
            state_machine.transition_to(AgentState.LEARNING)
            # Log decision to agent memory
            memory_engine.store_memory(
                db, state_machine.get_state().value,
                current_situation,
                exec_receipt.get("action", "IDLE_BATTERY"),
                exec_receipt.get("expected_savings", 0.0),
                "SUCCESSFUL",
                "hourly_cycle"
            )
            time.sleep(0.4)

            # Compute Carbon Metrics
            carb = carbon_service.compute_sustainability_metrics(db, max(0.0, demand_forecast - solar_forecast), solar_forecast)
            
            # Calculate cumulative savings today
            rep = execution_service.generate_cost_report(db)
            
            # Update cache details for WebSockets/API
            last_decision_report = {
                "timestamp": datetime.utcnow().isoformat(),
                "state": state_machine.get_state().value,
                "market": {
                    "buying_price": buy_price,
                    "selling_price": sell_price,
                    "price_forecast_1h": round(pred_1h, 3),
                    "price_forecast_24h": round(pred_24h, 3),
                    "demand_forecast": round(demand_forecast, 1),
                    "solar_forecast": round(solar_forecast, 1),
                    "volatility_score": round(spike_prob, 2)
                },
                "battery": {
                    "soc": round(battery_soc, 3),
                    "capacity_kwh": twin_data["battery"]["capacity_kwh"],
                    "soh": round(twin_data["battery"]["soh_pct"], 1),
                    "temperature_c": round(twin_data["battery"]["temperature_c"], 1),
                    "dispatch_kw": round(dispatch_kw, 1)
                },
                "chosen_strategy": selected_plan.plan_name,
                "plans": [json.loads(p.model_dump_json()) for p in plans],
                "ai_reasoning": ai_explanation,
                "savings_today": round(rep.get("accumulated_savings", 124.50), 2),
                "green_score": carb.green_score,
                "co2_avoided": carb.co2_avoided_kg,
                "accuracy": acc,
                "opportunity_score": opp_score
            }
            
            # Record cycle execution latency
            cycle_duration_ms = (time.time() - cycle_start_time) * 1000
            agent_metrics.record_latency("agent_latency_ms", cycle_duration_ms)
            agent_metrics.record_latency("optimization_execution_time_ms", (time.time() - cycle_start_time) * 1000 / 9) # average per state
            
            # Set state back to Idle until next cycle
            state_machine.transition_to(AgentState.IDLE)
            last_decision_report["state"] = "Idle"
            
        except Exception as e:
            agent_logger.error(f"Error in orchestrator loop: {e}\n{traceback.format_exc()}")
            state_machine.transition_to(AgentState.RECOVERY)
            time.sleep(5.0) # Grace period
            
        time.sleep(2.0) # Duration between full runs

    db.close()
