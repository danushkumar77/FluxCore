from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.domain.value_objects.HealthIndex import HealthIndex
from app.domain.value_objects.RiskScore import RiskScore

class AssetPerformance(BaseModel):
    asset_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    health: HealthIndex
    risk: RiskScore
    rul_days: float
    rul_cycles: Optional[float] = None
    expected_failure_date: Optional[datetime] = None
    anomaly_score: float  # Isolation Forest anomaly score
    is_anomaly: bool
    is_drift: bool = False
    failure_modes: List[Dict[str, Any]] = Field(default_factory=list)  # FMEA outcomes
