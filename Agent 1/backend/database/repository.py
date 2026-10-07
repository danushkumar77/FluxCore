from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from database.models import PredictionRecord
from api.schemas import PredictionResponse
from datetime import datetime
import json

class PredictionRepository:
    async def save_prediction(self, session: AsyncSession, prediction_response: PredictionResponse, input_data: dict) -> PredictionRecord:
        record = PredictionRecord(
            timestamp=datetime.fromisoformat(prediction_response.timestamp) if isinstance(prediction_response.timestamp, str) else prediction_response.timestamp,
            input_data=json.dumps(input_data),
            prediction=prediction_response.prediction,
            next_6h_demand=prediction_response.next_6h_demand,
            next_24h_demand=prediction_response.next_24h_demand,
            peak_demand=prediction_response.peak_demand,
            confidence=prediction_response.confidence,
            risk=prediction_response.risk,
            category=prediction_response.category,
            trend=prediction_response.trend,
            grid_stress_index=prediction_response.grid_stress_index,
            reserve_margin=prediction_response.reserve_margin,
            reasoning=prediction_response.reasoning,
            recommendations=json.dumps(prediction_response.recommendations)
        )
        session.add(record)
        await session.commit()
        await session.refresh(record)
        return record

    async def get_history(self, session: AsyncSession, limit: int = 50, offset: int = 0) -> list[PredictionRecord]:
        result = await session.execute(select(PredictionRecord).order_by(desc(PredictionRecord.timestamp)).limit(limit).offset(offset))
        return list(result.scalars().all())

    async def get_count(self, session: AsyncSession) -> int:
        result = await session.execute(select(func.count(PredictionRecord.id)))
        return result.scalar() or 0

    async def get_dashboard_stats(self, session: AsyncSession) -> dict:
        total = await self.get_count(session)
        if total == 0:
            return {"avg_confidence": 0, "risk_distribution": {}, "recent_predictions": []}
        
        avg_conf_result = await session.execute(select(func.avg(PredictionRecord.confidence)))
        avg_confidence = avg_conf_result.scalar() or 0
        
        risk_result = await session.execute(select(PredictionRecord.risk, func.count(PredictionRecord.id)).group_by(PredictionRecord.risk))
        risk_distribution = {row[0]: row[1] for row in risk_result.all()}
        
        recent = await self.get_history(session, limit=5)
        
        return {
            "avg_confidence": avg_confidence,
            "risk_distribution": risk_distribution,
            "recent_predictions": recent
        }

    async def get_predictions_range(self, session: AsyncSession, start: datetime, end: datetime) -> list[PredictionRecord]:
        result = await session.execute(
            select(PredictionRecord).where(PredictionRecord.timestamp >= start, PredictionRecord.timestamp <= end).order_by(PredictionRecord.timestamp)
        )
        return list(result.scalars().all())
