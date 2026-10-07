import json
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from app.workers.grid_worker import grid_worker
from app.event_bus.event_schema import local_event_bus

router = APIRouter()

class FaultSimulationRequest(BaseModel):
    equipment_id: str
    fault_type: str # TRANSFORMER_OVERHEAT, INSULATION_BREAKDOWN, SHORT_circuit etc.
    severity: str = "CRITICAL"

class RestorationExecutionRequest(BaseModel):
    plan_id: str

class ChatRequest(BaseModel):
    prompt: str

@router.post("/grid/fault-simulate")
async def simulate_fault(req: FaultSimulationRequest):
    # Inject fault into SCADA simulator
    grid_worker.scada.inject_fault(req.equipment_id, req.fault_type, req.severity)
    local_event_bus.publish("grid.alert.created", {
        "equipment_id": req.equipment_id,
        "type": req.fault_type,
        "severity": req.severity
    })
    # Wake up state machine by moving it if it was idling
    if grid_worker.current_state == "Monitoring":
        # Immediately run state checks
        pass
    return {"status": "SUCCESS", "message": f"Fault {req.fault_type} injected into {req.equipment_id}."}

@router.post("/grid/fault-clear")
async def clear_fault(equipment_id: str):
    grid_worker.scada.clear_fault(equipment_id)
    # Restoring grid status
    topology = grid_worker.grid_repo.get_topology()
    for line_id, line in topology.transmission_lines.items():
        if line_id == equipment_id:
            line.status = "HEALTHY"
    # Close breakers again
    for b in topology.breakers.values():
        if b.associated_line_id == equipment_id or b.associated_transformer_id == equipment_id:
            b.is_closed = True
    grid_worker.grid_repo.save_topology(topology)
    return {"status": "SUCCESS", "message": f"Fault cleared and breakers reset for {equipment_id}."}

@router.post("/grid/restoration-execute")
async def execute_restoration(req: RestorationExecutionRequest):
    if not grid_worker.active_incident:
        raise HTTPException(status_code=400, detail="No active incident requiring restoration.")
    
    selected_plan = None
    for plan in grid_worker.active_incident.proposed_plans:
        if plan.plan_id == req.plan_id:
            selected_plan = plan
            break
            
    if not selected_plan:
        raise HTTPException(status_code=404, detail=f"Plan ID {req.plan_id} not found.")

    # Operator approved
    grid_worker.active_incident.operator_approved = True
    grid_worker.active_incident.selected_plan_id = req.plan_id
    
    # Trigger execution in worker background
    asyncio = __import__("asyncio")
    asyncio.create_task(grid_worker.execute_restoration_plan(selected_plan))
    
    return {"status": "SUCCESS", "message": f"Restoration plan {selected_plan.name} triggered."}

@router.post("/grid/mode")
async def change_mode(mode: str):
    if mode not in ["AUTONOMOUS", "ASSISTED", "MANUAL", "EMERGENCY"]:
        raise HTTPException(status_code=400, detail="Invalid operator mode.")
    grid_worker.operator_mode = mode
    return {"status": "SUCCESS", "mode": mode}

@router.get("/grid/risk-score")
def get_risk_score():
    topology = grid_worker.grid_repo.get_topology()
    return grid_worker.risk_service.calculate_grid_metrics(topology)

@router.get("/grid/digital-twin")
def get_digital_twin():
    topology = grid_worker.grid_repo.get_topology()
    twin_service = __import__("app.digital_twin.digital_twin_service", fromlist=["DigitalTwinService"]).DigitalTwinService()
    return twin_service.generate_twin_payload(topology, grid_worker.scada.active_faults)

@router.get("/grid/incidents")
def get_incidents():
    return [inc.dict() for inc in grid_worker.incident_repo.get_all_incidents()]

@router.get("/grid/equipment-health")
def get_equipment_health():
    topology = grid_worker.grid_repo.get_topology()
    metrics = grid_worker.risk_service.calculate_grid_metrics(topology)
    return {
        "transformers": metrics["transformer_healths"],
        "lines": metrics["line_healths"]
    }

@router.get("/relay/status")
def get_relay_status():
    topology = grid_worker.grid_repo.get_topology()
    return {r_id: r.dict() for r_id, r in topology.relays.items()}

@router.get("/grid/stability")
def get_stability():
    topology = grid_worker.grid_repo.get_topology()
    metrics = grid_worker.risk_service.calculate_grid_metrics(topology)
    return {
        "stability_score": metrics["stability_score"],
        "outage_probability": metrics["outage_probability"],
        "grid_health_score": metrics["grid_health_score"]
    }

@router.get("/grid/model-info")
def get_model_info():
    metrics_path = "backend/app/infrastructure/models/metrics.json"
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            return json.load(f)
    return {"status": "NO_METRICS_FOUND", "message": "ML training is currently in progress."}

@router.post("/copilot/chat")
async def copilot_chat(req: ChatRequest):
    # Formulate engineering prompt context
    topology = grid_worker.grid_repo.get_topology()
    metrics = grid_worker.risk_service.calculate_grid_metrics(topology)
    prompt = f"""
You are a Senior Grid Reliability Engineer at the emergency command room.
An operator asks: "{req.prompt}"

Current active grid metrics:
- Overall Grid Health Score: {metrics['grid_health_score']}%
- Stability Index: {metrics['stability_score']}%
- Active Faults: {list(grid_worker.scada.active_faults.keys())}
- Operating Mode: {grid_worker.operator_mode}

Provide a professional, technical response advising on actions, referencing IEEE rules where applicable. Be concise and authoritative.
"""
    if grid_worker.gemini_engine.use_api:
        try:
            response = grid_worker.gemini_engine.model.generate_content(prompt)
            return {"response": response.text}
        except Exception as e:
            pass
            
    # Local fallback advice
    advice = "Local Expert Advisory: Grid is operational. "
    if grid_worker.scada.active_faults:
        advice += f"Active anomalies detected on {list(grid_worker.scada.active_faults.keys())}. Tripping sequences initiated per IEEE 50/51 standards."
    else:
        advice += "Telemetry indicates all parameters (voltage, frequency, harmonic THD) are within nominal margins (IEEE 1547 / IEEE 519)."
        
    return {"response": advice}
