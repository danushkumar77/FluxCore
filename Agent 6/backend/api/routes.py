import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel

from backend.database.session import get_db
from backend.database.models import (
    OptimizationHistory, MarketPrice, TradingTransaction,
    CarbonRecord, AgentMemory, StrategyResult, ModelMetric
)
from backend.agent.agent_orchestrator import last_decision_report
from backend.agent.state_machine import state_machine
from backend.models.ml_forecasting import ml_system
from backend.services.gemini_reasoning import gemini_reasoning
from backend.services.trading_engine import trading_engine
from backend.services.execution_service import execution_service
from backend.services.planner_service import planner_service
from backend.event_bus.publisher import event_log
from backend.observability.metrics import agent_metrics

router = APIRouter()

# --- Pydantic Request Models ---
class ChatRequest(BaseModel):
    message: str

class SimulateTradeRequest(BaseModel):
    trade_type: str
    energy_kwh: float
    price_per_kwh: float

class OptimizeRequest(BaseModel):
    demand_kw: float
    solar_gen_kw: float
    battery_soc: float

# --- GET Endpoints ---

@router.get("/agent/state")
def get_agent_state():
    return {
        "state": state_machine.get_state().value,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/economy/metrics")
def get_economy_metrics():
    return agent_metrics.get_snapshot()

@router.get("/economy/history")
def get_economy_history(db: Session = Depends(get_db)):
    records = db.query(OptimizationHistory).order_by(OptimizationHistory.timestamp.desc()).limit(50).all()
    return records

@router.get("/market/prices")
def get_market_prices(db: Session = Depends(get_db)):
    records = db.query(MarketPrice).order_by(MarketPrice.timestamp.desc()).limit(50).all()
    # If no records exist, return some mock hourly pricing
    if not records:
        mock_prices = []
        for i in range(24):
            mock_prices.append({
                "id": i,
                "timestamp": datetime.utcnow().isoformat(),
                "market_type": "real_time",
                "buying_price": 0.15 + 0.10 * (i % 6),
                "selling_price": 0.05 + 0.02 * (i % 6),
                "forecasted_price": 0.14 + 0.09 * (i % 6),
                "demand_kw": 400.0 + 100 * (i % 4),
                "renewable_gen_kw": 100.0 * (i % 8)
            })
        return mock_prices
    return records

@router.get("/strategies")
def get_strategies(db: Session = Depends(get_db)):
    records = db.query(StrategyResult).order_by(StrategyResult.timestamp.desc()).limit(25).all()
    return records

@router.get("/savings")
def get_savings(db: Session = Depends(get_db)):
    return execution_service.generate_cost_report(db)

@router.get("/carbon-impact")
def get_carbon_impact(db: Session = Depends(get_db)):
    records = db.query(CarbonRecord).order_by(CarbonRecord.timestamp.desc()).limit(50).all()
    return records

@router.get("/model-info")
def get_model_info():
    return ml_system.load_registry()

@router.get("/agent/memory")
def get_agent_memory(db: Session = Depends(get_db)):
    records = db.query(AgentMemory).order_by(AgentMemory.timestamp.desc()).limit(50).all()
    return records


# --- POST Endpoints ---

@router.post("/economy/analyze")
def economy_analyze(req: OptimizeRequest):
    pred_1h, pred_24h, spike = ml_system.predict_price_forecast(req.demand_kw, req.solar_gen_kw, 12, 1)
    op, pk, pur = ml_system.predict_operating_costs(pred_1h, req.demand_kw, req.battery_soc)
    return {
        "analysis_timestamp": datetime.utcnow().isoformat(),
        "price_projections": {"hour_ahead": pred_1h, "day_ahead": pred_24h, "spike_probability": spike},
        "operating_cost_projections": {"total": op, "peak_demand_charge": pk, "net_energy_purchase": pur}
    }

@router.post("/economy/optimize")
def economy_optimize(req: OptimizeRequest):
    # Generates plans a-e
    plans = planner_service.generate_plans(req.demand_kw, req.solar_gen_kw, req.battery_soc, 600.0, 0.28, 0.08)
    return {
        "optimization_timestamp": datetime.utcnow().isoformat(),
        "plans": plans
    }

@router.post("/strategy/generate")
def strategy_generate(req: OptimizeRequest):
    plans = planner_service.generate_plans(req.demand_kw, req.solar_gen_kw, req.battery_soc, 600.0, 0.28, 0.08)
    best_plan = plans[1] # Battery Arbitrage default
    return {
        "generation_timestamp": datetime.utcnow().isoformat(),
        "strategy": best_plan
    }

@router.post("/trading/simulate")
def trading_simulate(req: SimulateTradeRequest, db: Session = Depends(get_db)):
    receipt = trading_engine.execute_market_trade(db, req.trade_type, req.energy_kwh, req.price_per_kwh)
    return receipt

@router.post("/copilot/chat")
def copilot_chat(req: ChatRequest):
    # Call Gemini reasoning based on current grid report
    context = {
        "state": state_machine.get_state().value,
        "buying_price": last_decision_report["market"]["buying_price"],
        "demand_kw": last_decision_report["market"]["demand_forecast"],
        "solar_gen_kw": last_decision_report["market"]["solar_forecast"],
        "battery_soc": last_decision_report["battery"]["soc"],
        "chosen_strategy": last_decision_report["chosen_strategy"],
        "expected_savings": last_decision_report["savings_today"],
        "confidence": last_decision_report["accuracy"]
    }
    
    # Prepend user message to prompt context
    user_query = f"User asks: {req.message}\nGrid Context Report:\n{context}\n\nPlease address the user's question directly with expert financial/grid analysis."
    ai_response = gemini_reasoning.generate_explanation({"buying_price": context["buying_price"], "demand_kw": context["demand_kw"], "solar_gen_kw": context["solar_gen_kw"], "battery_soc": context["battery_soc"], "chosen_strategy": f"Custom Query: {req.message}", "expected_savings": 10.0, "confidence": 95.0})
    
    return {
        "response": ai_response,
        "timestamp": datetime.utcnow().isoformat()
    }


# --- WebSocket Endpoint ---

active_connections: List[WebSocket] = []

@router.websocket("/ws/economy")
async def ws_economy(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Stream the latest decision report + event bus logs + metrics
            payload = {
                "telemetry": last_decision_report,
                "metrics": agent_metrics.get_snapshot(),
                "event_bus_logs": event_log[-15:]  # last 15 items
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        print(f"WS connection error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)
