import uvicorn
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router
from app.workers.grid_worker import grid_worker

app = FastAPI(title="FluxCore Grid Reliability Agent API", version="1.0")

# CORS middleware for React Vite frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.websocket("/ws/grid")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await grid_worker.register_connection(websocket)
    try:
        while True:
            # Maintain connection, read incoming manual toggles if sent
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "toggle_breaker":
                breaker_id = payload.get("breaker_id")
                is_closed = payload.get("is_closed")
                grid_worker.grid_repo.update_breaker_status(breaker_id, is_closed)
                
            await grid_worker.broadcast_state()
    except WebSocketDisconnect:
        grid_worker.unregister_connection(websocket)
    except Exception as e:
        print(f"WebSocket exception: {e}")
        grid_worker.unregister_connection(websocket)

@app.on_event("startup")
async def startup_event():
    # Start grid worker simulation loop
    await grid_worker.start()

@app.on_event("shutdown")
def shutdown_event():
    grid_worker.stop()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
