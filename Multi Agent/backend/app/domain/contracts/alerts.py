from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4

class AlertModel(BaseModel):
    alert_id: UUID = Field(default_factory=uuid4)
    asset_id: UUID
    source_agent: str
    description: str
    severity: str = "medium"  # critical, high, medium, low, informational
    status: str = "active"  # active, acknowledged, cleared
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    suggested_action: Optional[str] = None
    correlation_id: Optional[UUID] = None
