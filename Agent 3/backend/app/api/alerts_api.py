from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from backend.app.domain.entities import BatteryAlert
from backend.app.services.agent_orchestrator import agent_orchestrator

router = APIRouter(prefix="/alerts", tags=["System Alerts"])

class ResolveAlertRequest(BaseModel):
    alert_id: str

@router.get("")
async def get_alerts(active_only: bool = False, limit: int = 50) -> List[BatteryAlert]:
    if active_only:
        return await agent_orchestrator.health_service.get_active_alerts()
    else:
        return await agent_orchestrator.health_service.get_all_alerts(limit)

@router.post("/resolve")
async def post_resolve_alert(req: ResolveAlertRequest):
    await agent_orchestrator.health_service.resolve_alert(req.alert_id)
    return {"status": "SUCCESS", "message": f"Alert {req.alert_id} resolved."}
