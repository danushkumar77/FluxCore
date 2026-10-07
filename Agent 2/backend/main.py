import os
import json
import queue
import asyncio
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pandas as pd

from backend.agent.scheduler import AgentScheduler
from backend.agent.agent_state import AgentState
from backend.ml.feature_engineering import engineer_features

# Enterprise Modules
from backend.agent.copilot import AICopilotEngine
from backend.agent.scenario_simulator import ScenarioSimulatorEngine

# ----------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------
class WeatherInput(BaseModel):
    solar_irradiance: float
    cloud_cover: float
    wind_speed: float
    wind_direction: float
    temperature: float
    humidity: float
    rainfall: float
    atmospheric_pressure: float
    reservoir_level: float
    grid_demand: float
    battery_soc: float
    electricity_price: float
    season: int

class ChatRequest(BaseModel):
    message: str
    history: List[dict]

class ScenarioRequest(BaseModel):
    cloud_cover_add: float
    wind_speed_mult: float
    reservoir_level_mult: float
    grid_demand_mult: float

class ActionRequest(BaseModel):
    id: int
    comment: Optional[str] = ""

# ----------------------------------------------------
# WebSocket Manager
# ----------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Client disconnected. Active left: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

# ----------------------------------------------------
# FastAPI Initialization
# ----------------------------------------------------
app = FastAPI(
    title="🌿 FluxCore - Renewable Energy Intelligence Platform",
    description="Autonomous Smart Grid Engineering Agent Operations Center.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = AgentScheduler()
manager = ConnectionManager()
copilot_engine = AICopilotEngine()
scenario_engine = ScenarioSimulatorEngine()

loop = None

@app.on_event("startup")
async def startup_event():
    global loop
    loop = asyncio.get_running_loop()
    
    # Register WebSocket broadcast callback in scheduler
    def ws_broadcast_callback(event):
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(manager.broadcast(event), loop)
            
    scheduler.websocket_listeners.append(ws_broadcast_callback)
    
    # Start the scheduler
    scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.stop()

# ----------------------------------------------------
# WebSockets Endpoint
# ----------------------------------------------------
@app.websocket("/agent/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial state on connection
        initial_event = {
            "type": "connection_established",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "current_state": scheduler.state_machine.current_state,
                "last_run": scheduler.last_run_data
            }
        }
        await websocket.send_json(initial_event)
        
        while True:
            # Keep connection alive / read incoming ping
            data = await websocket.receive_text()
            # Simple Echo ping
            await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] Error in socket loop: {e}")
        manager.disconnect(websocket)

# ----------------------------------------------------
# Operational endpoints
# ----------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agent_running": scheduler.running,
        "models_loaded": all([
            scheduler.solar_model is not None,
            scheduler.wind_model is not None,
            scheduler.hydro_model is not None
        ]),
        "active_websockets": len(manager.active_connections)
    }

@app.get("/agent/state")
def get_agent_state():
    return {
        "current_state": scheduler.state_machine.current_state,
        "history": scheduler.state_machine.get_history()
    }

@app.get("/model-info")
def get_model_info():
    info_path = "backend/models/model_info.json"
    if not os.path.exists(info_path):
        raise HTTPException(status_code=404, detail="Model metrics metadata not found.")
    with open(info_path, "r") as f:
        return json.load(f)

@app.get("/feature-importance")
def get_feature_importance():
    info_path = "backend/models/model_info.json"
    if not os.path.exists(info_path):
        raise HTTPException(status_code=404, detail="Model metrics metadata not found.")
    with open(info_path, "r") as f:
        data = json.load(f)
    return {
        "solar": data.get("solar", {}).get("feature_importance", {}),
        "wind": data.get("wind", {}).get("feature_importance", {}),
        "hydro": data.get("hydro", {}).get("feature_importance", {})
    }

@app.get("/history")
def get_history(limit: int = 50):
    return scheduler.memory.get_forecast_history(limit)

@app.get("/tool-logs")
def get_tool_logs(limit: int = 50):
    return scheduler.memory.get_tool_logs(limit)

@app.get("/reflections")
def get_reflections(limit: int = 20):
    return scheduler.memory.get_reflections(limit)

@app.get("/metrics")
def get_metrics():
    history = scheduler.memory.get_forecast_history(limit=100)
    reflections = scheduler.memory.get_reflections(limit=100)
    
    if not history:
        return {
            "avg_renewable_score": 0.0,
            "avg_confidence": 0.0,
            "avg_learning_score": 0.0,
            "avg_model_drift": 0.0,
            "total_runs": 0
        }
        
    avg_score = sum([h["renewable_score"] for h in history]) / len(history)
    avg_conf = sum([h["confidence"] for h in history]) / len(history)
    
    avg_learning = 0.0
    avg_drift = 0.0
    if reflections:
        avg_learning = sum([r["learning_score"] for r in reflections]) / len(reflections)
        avg_drift = sum([r["model_drift"] for r in reflections]) / len(reflections)
        
    return {
        "avg_renewable_score": round(avg_score, 2),
        "avg_confidence": round(avg_conf, 2),
        "avg_learning_score": round(avg_learning, 2),
        "avg_model_drift": round(avg_drift, 2),
        "total_runs": len(history)
    }

# ----------------------------------------------------
# Upgraded API Endpoints
# ----------------------------------------------------
@app.post("/forecast")
async def trigger_forecast():
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, scheduler.run_once)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/copilot/chat")
def trigger_copilot_chat(request: ChatRequest):
    """
    Submits user message and conversation log to the AI Copilot.
    """
    try:
        rules = scheduler.knowledge.get_rules()
        reply = copilot_engine.chat_response(
            message=request.message,
            history=request.history,
            last_run=scheduler.last_run_data,
            rules=rules
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot error: {e}")

@app.post("/scenario/simulate")
def trigger_scenario_simulation(request: ScenarioRequest):
    """
    Simulates what-if meteorological conditions on generation curves.
    """
    try:
        current_weather = scheduler.last_run_data.get("weather")
        if not current_weather:
            # Fetch fresh weather fallback if no previous run data
            current_weather = scheduler.weather.fetch_live_weather()
            
        result = scenario_engine.simulate(
            current_weather=current_weather,
            solar_model=scheduler.solar_model,
            wind_model=scheduler.wind_model,
            hydro_model=scheduler.hydro_model,
            solar_features=scheduler.solar_features,
            wind_features=scheduler.wind_features,
            hydro_features=scheduler.hydro_features,
            adjustments={
                "cloud_cover_add": request.cloud_cover_add,
                "wind_speed_mult": request.wind_speed_mult,
                "reservoir_level_mult": request.reservoir_level_mult,
                "grid_demand_mult": request.grid_demand_mult
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {e}")

@app.get("/actions/pending")
def get_pending_approvals():
    return scheduler.operator_workflow.get_pending()

@app.get("/actions/history")
def get_approval_history(limit: int = 30):
    return scheduler.operator_workflow.get_approval_history(limit)

@app.post("/actions/approve")
def approve_operator_action(req: ActionRequest):
    result = scheduler.operator_workflow.approve_action(req.id, req.comment)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/actions/reject")
def reject_operator_action(req: ActionRequest):
    result = scheduler.operator_workflow.reject_action(req.id, req.comment)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.get("/decision-traces")
def get_decision_traces(limit: int = 30):
    return scheduler.trace_system.get_traces(limit)

@app.get("/alerts/active")
def get_active_alerts():
    return scheduler.alert_system.get_active()

@app.get("/alerts/history")
def get_alerts_history(limit: int = 50):
    return scheduler.alert_system.get_history(limit)

@app.post("/alerts/acknowledge/{alert_id}")
def acknowledge_alert(alert_id: int):
    try:
        scheduler.alert_system.acknowledge_alert(alert_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/stream")
async def stream_agent(request: Request):
    """
    SSE stream router fallback if WebSocket connection is not supported.
    """
    q = queue.Queue(maxsize=100)
    scheduler.add_stream_listener(q)
    
    async def event_generator():
        try:
            initial_event = {
                "type": "connection_established",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "current_state": scheduler.state_machine.current_state,
                    "last_run": scheduler.last_run_data
                }
            }
            yield f"data: {json.dumps(initial_event)}\n\n"
            
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = q.get_nowait()
                    yield f"data: {json.dumps(event)}\n\n"
                except queue.Empty:
                    await asyncio.sleep(0.2)
        finally:
            scheduler.remove_stream_listener(q)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8001, reload=True)
