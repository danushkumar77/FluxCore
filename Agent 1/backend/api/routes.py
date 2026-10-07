from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import get_db
from api.schemas import PredictionRequest, PredictionResponse, BatchPredictionRequest, BatchPredictionResponse, HealthResponse, MetricsResponse, ModelInfoResponse, FeatureImportanceResponse, DashboardSummary
import time

router = APIRouter(prefix="/api/v1")

def get_agent(request: Request):
    return request.app.state.agent

@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest, req: Request, db: AsyncSession = Depends(get_db)):
    agent = get_agent(req)
    try:
        return await agent.predict(request.model_dump(), db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest, req: Request, db: AsyncSession = Depends(get_db)):
    agent = get_agent(req)
    try:
        inputs = [p.model_dump() for p in request.predictions]
        return await agent.predict_batch(inputs, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(req: Request, limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    agent = get_agent(req)
    records = await agent.get_history(db, limit, offset)
    return records

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(req: Request):
    agent = get_agent(req)
    return agent.get_metrics()

@router.get("/health", response_model=HealthResponse)
async def health_check(req: Request):
    agent = get_agent(req)
    uptime = time.time() - req.app.state.start_time
    return HealthResponse(
        status="ok",
        model_loaded=agent.prediction_engine.model_loaded,
        database_connected=True,
        gemini_available=agent.reasoning_engine.gemini_available,
        uptime_seconds=uptime,
        version="1.0.0"
    )

@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info(req: Request):
    agent = get_agent(req)
    return agent.get_model_info()

@router.get("/feature-importance", response_model=FeatureImportanceResponse)
async def get_feature_importance(req: Request):
    agent = get_agent(req)
    return agent.get_feature_importance()

@router.get("/dashboard-summary", response_model=DashboardSummary)
async def get_dashboard_summary(req: Request, db: AsyncSession = Depends(get_db)):
    agent = get_agent(req)
    return await agent.get_dashboard_summary(db)

@router.get("/agent/state")
async def get_agent_state(req: Request):
    from agents.agent_state import agent_state_manager
    return agent_state_manager.get_summary()
