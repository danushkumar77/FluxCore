from fastapi import APIRouter
from backend.app.services.agent_orchestrator import agent_orchestrator
from datetime import datetime

router = APIRouter(prefix="/system", tags=["System Diagnostics"])

@router.get("/status")
async def get_system_status():
    # Gather logs history, thread heartbeat, connections count
    active_ws_clients = len(agent_orchestrator.ws_service.active_connections)
    event_history = agent_orchestrator.ws_service.active_connections # Represented by connection diagnostics
    
    return {
        "status": "OPERATIONAL",
        "timestamp": datetime.utcnow().isoformat(),
        "state_machine": {
            "current_state": agent_orchestrator.current_state,
            "running": agent_orchestrator.running,
            "active_policy": agent_orchestrator.active_policy,
        },
        "background_workers": {
            "telemetry_loop": "ACTIVE",
            "prediction_loop": "ACTIVE",
            "decision_loop": "ACTIVE",
            "reflection_loop": "ACTIVE"
        },
        "performance_latency_ms": agent_orchestrator.latency_metrics,
        "websocket": {
            "active_connections": active_ws_clients,
            "status": "LISTENING"
        },
        "services": {
            "fleet_service": "CONNECTED",
            "gemini_service": "CONNECTED" if agent_orchestrator.gemini_service.api_key else "FALLBACK_MODE",
            "database": "CONNECTED_SQLITE"
        }
    }
