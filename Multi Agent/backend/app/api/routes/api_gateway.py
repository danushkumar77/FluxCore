import time
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime
from app.core.config import config_service, get_settings
from app.core.orchestrator import orchestrator
from app.api.security import create_access_token, get_current_user, UserTokenPayload, RoleChecker
from app.api.websocket import websocket_manager
from app.domain.contracts.api import APIResponse, SimulationRequest, ConfigurationRequest
from app.domain.contracts.events import GridFaultDetectedEvent
from app.core.event_bus import event_bus

router = APIRouter()

# Metrics Tracker
API_METRICS = {
    "total_requests": 0,
    "start_time": time.time()
}

@router.post("/auth/token", response_model=Dict[str, str])
def login(username: str = Query(...), role: str = Query("Viewer")):
    """Enterprise oauth/token generation endpoint for testing security foundation."""
    if role not in ["Administrator", "Grid Operator", "Maintenance Engineer", "Energy Analyst", "Viewer"]:
        raise HTTPException(status_code=400, detail="Invalid system role")
    
    token = create_access_token({"sub": username, "role": role})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/health", response_model=APIResponse[Dict[str, Any]])
def get_health():
    """System overall health report."""
    agent_states = orchestrator.get_all_agents()
    system_health = "healthy"
    
    # If any core agent is degraded/dead, reflect it in the system status
    for state in agent_states:
        if state.health_status in ["degraded", "error"]:
            system_health = "degraded"

    data = {
        "status": system_health,
        "database": "online",
        "event_bus": "online" if event_bus._running else "offline",
        "active_agents": len([a for a in agent_states if a.current_state != "Idle"]),
        "registered_agents": len(agent_states)
    }
    
    return APIResponse(
        status="success",
        message="FluxCore System Health Check",
        data=data
    )

@router.post("/config/reload", response_model=APIResponse[Dict[str, Any]])
def reload_config(current_user: UserTokenPayload = Depends(RoleChecker(["Administrator"]))):
    """Triggers dynamic config reload. Secured for Administrator role only."""
    new_settings = config_service.reload()
    return APIResponse(
        status="success",
        message="Configuration reloaded successfully",
        data={
            "environment": new_settings.ENVIRONMENT,
            "ai_reasoning_enabled": new_settings.ENABLE_AI_REASONING,
            "ml_predictions_enabled": new_settings.ENABLE_ML_PREDICTIONS
        }
    )

@router.get("/metrics", response_model=APIResponse[Dict[str, Any]])
def get_metrics(current_user: UserTokenPayload = Depends(RoleChecker(["Administrator", "Grid Operator", "Energy Analyst"]))):
    """Exports structured metrics for system observation."""
    uptime_sec = time.time() - API_METRICS["start_time"]
    throughput = API_METRICS["total_requests"] / max(uptime_sec, 1)
    
    data = {
        "active_websocket_connections": len(websocket_manager.active_connections),
        "api_throughput_req_sec": round(throughput, 2),
        "total_requests": API_METRICS["total_requests"],
        "event_bus_queue_size": event_bus._queue.qsize(),
        "event_bus_dlq_size": len(event_bus.dlq),
        "uptime_seconds": round(uptime_sec, 1)
    }
    return APIResponse(
        status="success",
        message="Observability Performance Metrics",
        data=data
    )

@router.post("/simulations/trigger", response_model=APIResponse[Dict[str, Any]])
async def trigger_simulation(
    req: SimulationRequest,
    current_user: UserTokenPayload = Depends(RoleChecker(["Administrator", "Grid Operator"]))
):
    """
    Triggers simulated scenario faults (voltage drop, outage) into the Grid Event Bus.
    """
    logger_msg = f"Operator {current_user.sub} triggered simulation: {req.scenario_type} on asset {req.target_id}"
    
    # Broadcast incident to Event Bus
    event = GridFaultDetectedEvent(
        producer="SimulationEngine",
        priority=2 if req.severity == "medium" else (1 if req.severity == "high" else 3),
        payload={
            "scenario": req.scenario_type,
            "asset_id": str(req.target_id),
            "severity": req.severity,
            "duration_minutes": req.duration_minutes,
            "triggered_by": current_user.sub
        }
    )
    await event_bus.publish(event)
    
    return APIResponse(
        status="success",
        message="Simulation event published to Event Bus.",
        data={
            "event_id": str(event.event_id),
            "scenario": req.scenario_type,
            "severity": req.severity
        }
    )

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    """API Gateway Websocket stream router."""
    await websocket_manager.connect(websocket, token)
    try:
        while True:
            # Wait for client commands (e.g. subscribing to rooms)
            data = await websocket.receive_json()
            action = data.get("action")
            room = data.get("room")
            
            if action == "subscribe" and room:
                websocket_manager.subscribe(websocket, room)
                await websocket.send_json({"status": "subscribed", "room": room})
            elif action == "unsubscribe" and room:
                websocket_manager.unsubscribe(websocket, room)
                await websocket.send_json({"status": "unsubscribed", "room": room})
            else:
                await websocket.send_json({"status": "error", "message": "Invalid command"})
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        websocket_manager.disconnect(websocket)
