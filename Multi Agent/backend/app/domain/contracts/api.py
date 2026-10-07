from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, Any, Dict
from datetime import datetime
from uuid import UUID, uuid4

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    status: str  # "success" or "error"
    message: str
    data: Optional[T] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: UUID = Field(default_factory=uuid4)
    execution_time_ms: float = 0.0

class ForecastRequest(BaseModel):
    target_id: UUID
    forecast_type: str  # demand, solar, wind, price
    horizon_hours: int = 24
    model_version: Optional[str] = None

class SimulationRequest(BaseModel):
    scenario_type: str  # grid_failure, transformer_failure, battery_offline, etc.
    target_id: UUID
    duration_minutes: int = 60
    severity: str = "medium"  # low, medium, high

class OptimizationRequest(BaseModel):
    site_id: UUID
    objective: str  # cost, carbon, health, hybrid
    parameters: Dict[str, Any] = Field(default_factory=dict)

class KnowledgeQuery(BaseModel):
    category: str
    query_text: str
    max_results: int = 5

class MemoryQuery(BaseModel):
    agent_name: Optional[str] = None
    query_text: str
    record_type: Optional[str] = None
    tags: Optional[list[str]] = None
    limit: int = 10

class HealthRequest(BaseModel):
    agent_name: Optional[str] = None

class ConfigurationRequest(BaseModel):
    profile: str
    keys: Optional[list[str]] = None
