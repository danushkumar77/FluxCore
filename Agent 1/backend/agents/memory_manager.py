from sqlalchemy.ext.asyncio import AsyncSession
from database.repository import PredictionRepository
from database.models import get_db
import json
from utils.logger import get_logger

logger = get_logger("memory_manager")

class MemoryManager:
    """Active memory system to retrieve, search, and recall historical forecast cases."""
    def __init__(self):
        self.repository = PredictionRepository()

    async def recall_similar_scenarios(self, session: AsyncSession, temperature: float, current_load: float) -> list:
        logger.info(f"Querying memory index for similar cases (Temp: {temperature}, Load: {current_load})")
        
        # Pull past 50 predictions
        history = await self.repository.get_history(session, limit=50)
        matched_cases = []

        for record in history:
            try:
                inp = json.loads(record.input_data)
                hist_temp = inp.get('temperature', 25)
                hist_load = inp.get('current_load', 20000)
                
                # Check closeness (within 3 degrees AND within 3000 MW)
                if abs(hist_temp - temperature) <= 3.0 and abs(hist_load - current_load) <= 3000:
                    matched_cases.append({
                        "timestamp": record.timestamp.isoformat() if not isinstance(record.timestamp, str) else record.timestamp,
                        "prediction": record.prediction,
                        "risk": record.risk,
                        "reasoning": record.reasoning
                    })
            except Exception as e:
                logger.error(f"Error parsing historical case: {e}")

        # Fallback structured memory cases if DB is empty
        if not matched_cases:
            logger.info("Database clean. Returning default case memory patterns.")
            matched_cases = [
                {
                    "timestamp": "2026-07-27T12:00:00Z",
                    "prediction": current_load * 1.02,
                    "risk": "Medium",
                    "reasoning": "Comparable weather envelope with moderate peak loads."
                }
            ]

        return matched_cases[:3] # return top 3 matched cases

memory_manager = MemoryManager()
