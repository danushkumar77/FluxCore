from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID, uuid4

class MemoryRecordModel(BaseModel):
    record_id: UUID = Field(default_factory=uuid4)
    agent_name: str
    record_type: str  # historical_telemetry, previous_decision, previous_forecast, lesson_learned, incident_history, optimization_history
    content: str
    embedding_vector: Optional[List[float]] = None  # placeholder for similarity search
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
