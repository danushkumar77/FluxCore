from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any

class Asset(BaseModel):
    id: str
    name: str
    type: str  # "Transformer", "CircuitBreaker", "TransmissionLine", "Renewable", "Battery"
    station: str
    installation_date: str
    status: str = "Healthy"  # "Healthy", "Warning", "Critical"
    health_index: float = 100.0  # 0 to 100
    criticality_score: float = 50.0  # 0 to 100
    risk_score: float = 0.0  # 0 to 100
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    telemetry: Dict[str, Any] = Field(default_factory=dict)
