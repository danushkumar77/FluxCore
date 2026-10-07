from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any

class TelemetryReading(BaseModel):
    asset_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metrics: Dict[str, Any]
