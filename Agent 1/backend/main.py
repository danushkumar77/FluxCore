from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
from config.settings import settings
from database.models import init_db, AsyncSessionLocal
from api.routes import router
from agents.demand_forecast_agent import DemandForecastAgent
from agents.scheduler import AgentScheduler
from utils.logger import get_logger

logger = get_logger("fluxcore")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    await init_db()
    
    # Initialize and start autonomous agent scheduler
    logger.info("Initializing Agent System Scheduler...")
    scheduler = AgentScheduler(app.state.agent, AsyncSessionLocal)
    scheduler.start()
    app.state.scheduler = scheduler
    
    logger.info("Starting FluxCore Demand Forecast Agent API")
    yield
    
    # Stop scheduler on shutdown
    logger.info("Stopping Agent System Scheduler...")
    app.state.scheduler.stop()
    logger.info("Shutting down FluxCore Demand Forecast Agent API")

app = FastAPI(title="FluxCore Demand Forecast Agent API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.agent = DemandForecastAgent()
app.state.start_time = time.time()

app.include_router(router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

@app.get("/")
async def root():
    return {
        "name": "FluxCore Demand Forecast Agent API",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs"
    }
