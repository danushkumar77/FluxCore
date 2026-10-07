import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.infrastructure.sqlite_repos import init_db
from backend.app.services.agent_orchestrator import agent_orchestrator
from backend.app.services.websocket_service import websocket_service_instance
from backend.app.api import battery_api, copilot_api, alerts_api, system_api

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("FluxCore.Main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and start orchestrator background loop
    logger.info("Initializing SQLite databases...")
    await init_db()
    
    logger.info("Starting BESS Agent Orchestrator background loop...")
    agent_orchestrator.start()
    
    yield
    
    # Shutdown: Stop orchestrator
    logger.info("Stopping BESS Agent Orchestrator background loop...")
    agent_orchestrator.stop()

app = FastAPI(
    title="FluxCore BESS Agent - API Gateway",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

@app.get("/history")
async def root_get_history(limit: int = 50):
    return {
        "telemetry": await agent_orchestrator.telemetry_service.get_historical_telemetry("BESS-001", limit),
        "decisions": await agent_orchestrator.decision_repo.get_historical_decisions("BESS-001", limit),
        "executions": await agent_orchestrator.decision_repo.get_historical_executions("BESS-001", limit)
    }

@app.get("/actions/pending")
async def root_get_actions_pending():
    decisions = await agent_orchestrator.decision_repo.get_historical_decisions("BESS-001", limit=10)
    pending = [d for d in decisions if d.status == "PENDING" or d.status == "EXECUTING"]
    return pending

@app.get("/decision-traces")
async def root_get_decision_traces(limit: int = 50):
    return await agent_orchestrator.decision_repo.get_historical_decisions("BESS-001", limit)

@app.get("/alerts/active")
async def root_get_alerts_active():
    return await agent_orchestrator.health_service.get_active_alerts()

@app.get("/alerts/history")
async def root_get_alerts_history(limit: int = 50):
    return await agent_orchestrator.health_service.get_all_alerts(limit)

@app.get("/tool-logs")
async def root_get_tool_logs(limit: int = 50):
    return await agent_orchestrator.decision_repo.get_historical_executions("BESS-001", limit)

@app.get("/reflections")
async def root_get_reflections(limit: int = 50):
    return await agent_orchestrator.memory_service.get_all_lessons(limit)

# Attach API routers
app.include_router(battery_api.router)
app.include_router(copilot_api.router)
app.include_router(alerts_api.router)
app.include_router(system_api.router)

# WebSocket streaming gateway
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_service_instance.connect(websocket)
    logger.info("WebSocket client connected to live feed.")
    
    # Keep connection open and monitor disconnects
    try:
        while True:
            # We only receive ping-pong messages or system changes from client
            data = await websocket.receive_text()
            # If client changes policy, handle it
            try:
                import json
                payload = json.loads(data)
                if payload.get("action") == "change_policy":
                    policy = payload.get("policy")
                    await agent_orchestrator.set_policy(policy)
            except Exception:
                pass
    except WebSocketDisconnect:
        websocket_service_instance.disconnect(websocket)
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"WebSocket endpoint exception: {str(e)}")
        websocket_service_instance.disconnect(websocket)

@app.get("/")
def get_root():
    return {
        "app": "FluxCore BESS Agent 3 - Battery Energy Intelligence Gateway",
        "status": "OPERATIONAL",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
