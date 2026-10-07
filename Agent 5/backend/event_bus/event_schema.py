import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Dict, Any

class GridEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # e.g., "asset.telemetry.updated", "asset.failure.predicted"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    source_agent: str = "agent_5"
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payload: Dict[str, Any]
    schema_version: str = "1.0"
