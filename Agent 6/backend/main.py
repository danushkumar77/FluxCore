import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router as api_router
from backend.agent.lifecycle_manager import lifecycle_manager

app = FastAPI(
    title="FluxCore Agent 6 Backend",
    description="Economic Intelligence & Cost Optimization Agent Service",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup & Shutdown hooks
@app.on_event("startup")
async def startup_event():
    lifecycle_manager.on_startup()

@app.on_event("shutdown")
async def shutdown_event():
    lifecycle_manager.on_shutdown()

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "agent": "FluxCore Agent 6: Economic Optimizer",
        "timestamp": uvicorn.__name__
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8082, reload=True)
