import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from backend.app.domain.entities import BatteryContainer, BatteryTelemetry, BatteryDecision
from backend.app.services.agent_orchestrator import agent_orchestrator

router = APIRouter(prefix="/battery", tags=["Battery Operations"])

class ForecastRequest(BaseModel):
    container_id: str
    hours: int = 24

class OptimizeRequest(BaseModel):
    container_id: str
    policy: str

class SimulateRequest(BaseModel):
    container_id: str
    scenario: str

@router.post("/forecast")
async def post_forecast(req: ForecastRequest):
    # Retrieve forecast metadata for BESS
    container = await agent_orchestrator.fleet_service.get_container(req.container_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
        
    latest_telemetry = await agent_orchestrator.telemetry_service.get_latest_telemetry(req.container_id)
    solar_base = latest_telemetry.solar_forecast_kw if latest_telemetry else 150.0
    demand_base = latest_telemetry.demand_forecast_kw if latest_telemetry else 500.0
    
    # Generate forecasted hourly arrays
    forecasts = []
    current_hour = datetime.utcnow().hour
    for h in range(req.hours):
        hour = (current_hour + h) % 24
        solar = max(0.0, solar_base - 5.0 * (hour - 12)**2) if 6 <= hour <= 18 else 0.0
        demand = demand_base + 50.0 * (1 if 8 <= hour <= 10 or 17 <= hour <= 21 else 0)
        
        # pricing
        if 8 <= hour <= 10 or 17 <= hour <= 21:
            price = 180.0
        elif 11 <= hour <= 15:
            price = -5.0 if solar > 350.0 else 25.0
        else:
            price = 55.0
            
        forecasts.append({
            "hour_offset": h,
            "solar_kw": float(solar),
            "demand_kw": float(demand),
            "price_usd_mwh": float(price)
        })
    return {"container_id": req.container_id, "forecasts": forecasts}

@router.post("/optimize")
async def post_optimize(req: OptimizeRequest):
    container = await agent_orchestrator.fleet_service.get_container(req.container_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
        
    # Set active policy
    await agent_orchestrator.set_policy(req.policy)
    
    # Run dynamic optimization cycle
    telemetry = await agent_orchestrator.telemetry_service.get_latest_telemetry(req.container_id)
    if not telemetry:
        telemetry = await agent_orchestrator.telemetry_service.generate_simulated_telemetry(container)
        
    correlation_id = str(uuid.uuid4())
    strategies = await agent_orchestrator.planner_service.generate_strategies(telemetry, correlation_id)
    best_plan, opt_record = await agent_orchestrator.optimizer_service.optimize(strategies, req.policy, correlation_id, correlation_id)
    
    # Retrieve Gemini reasoning explanation
    reasoning = await agent_orchestrator.gemini_service.analyze_and_reason(telemetry.dict(), strategies, req.policy)
    
    return {
        "best_plan": best_plan,
        "all_plans": strategies,
        "optimization_scores": opt_record.calculated_scores,
        "gemini_reasoning": reasoning
    }

@router.post("/simulate")
async def post_simulate(req: SimulateRequest):
    # Verify BESS Container exists
    container = await agent_orchestrator.fleet_service.get_container(req.container_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
        
    simulation = await agent_orchestrator.simulation_service.simulate_scenario(req.scenario, req.container_id)
    return simulation

@router.get("/history")
async def get_history(container_id: str = "BESS-001", limit: int = 50):
    telemetry = await agent_orchestrator.telemetry_service.get_historical_telemetry(container_id, limit)
    decisions = await agent_orchestrator.decision_repo.get_historical_decisions(container_id, limit)
    executions = await agent_orchestrator.decision_repo.get_historical_executions(container_id, limit)
    
    return {
        "telemetry": telemetry,
        "decisions": decisions,
        "executions": executions
    }

@router.get("/assets")
async def get_assets():
    fleet = await agent_orchestrator.fleet_service.get_fleet()
    return fleet

@router.get("/health")
async def get_health(container_id: str = "BESS-001"):
    telemetry = await agent_orchestrator.telemetry_service.get_latest_telemetry(container_id)
    if not telemetry:
        container = await agent_orchestrator.fleet_service.get_container(container_id)
        if not container:
            raise HTTPException(status_code=404, detail="Container not found")
        telemetry = await agent_orchestrator.telemetry_service.generate_simulated_telemetry(container)
        
    health = await agent_orchestrator.prediction_service.predict_degradation_and_rul(telemetry, str(uuid.uuid4()))
    return health

@router.get("/metrics")
async def get_metrics(container_id: str = "BESS-001"):
    telemetry_history = await agent_orchestrator.telemetry_service.get_historical_telemetry(container_id, limit=50)
    decision_history = await agent_orchestrator.decision_repo.get_historical_decisions(container_id, limit=50)
    
    total_savings = sum((d.expected_revenue - d.expected_cost) for d in decision_history if d.status == "SUCCESS")
    avg_soc = sum(t.soc for t in telemetry_history) / len(telemetry_history) if telemetry_history else 50.0
    avg_temp = sum(t.avg_cell_temp for t in telemetry_history) / len(telemetry_history) if telemetry_history else 25.0
    
    return {
        "container_id": container_id,
        "cumulative_savings_usd": float(total_savings),
        "average_soc": float(avg_soc),
        "average_temp": float(avg_temp),
        "total_operational_cycles": len(telemetry_history)
    }

@router.get("/model-info")
async def get_model_info():
    info = agent_orchestrator.prediction_service.get_model_info()
    return info

@router.get("/state")
async def get_state():
    return {
        "current_state": agent_orchestrator.current_state,
        "active_policy": agent_orchestrator.active_policy,
        "last_run_time": agent_orchestrator.last_run_time.isoformat()
    }

@router.get("/lessons")
async def get_lessons(query: Optional[str] = None, limit: int = 50):
    if query:
        return await agent_orchestrator.memory_service.search_memory(query, limit)
    else:
        return await agent_orchestrator.memory_service.get_all_lessons(limit)
