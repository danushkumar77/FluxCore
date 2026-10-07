from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.app.services.agent_orchestrator import agent_orchestrator

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

class ChatRequest(BaseModel):
    message: str
    container_id: str = "BESS-001"

@router.post("/chat")
async def post_chat(req: ChatRequest):
    container = await agent_orchestrator.fleet_service.get_container(req.container_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
        
    telemetry = await agent_orchestrator.telemetry_service.get_latest_telemetry(req.container_id)
    telemetry_dict = telemetry.dict() if telemetry else container.dict()
    
    # Run Gemini Chat Copilot
    response_text = await agent_orchestrator.gemini_service.get_copilot_response(req.message, telemetry_dict)
    
    return {
        "user_message": req.message,
        "copilot_response": response_text,
        "timestamp": telemetry_dict.get("timestamp", "")
    }
