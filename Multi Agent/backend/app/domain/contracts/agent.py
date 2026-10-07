from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID, uuid4

class AgentStateModel(BaseModel):
    agent_name: str
    version: str = "1.0.0"
    capabilities: List[str] = Field(default_factory=list)
    current_state: str = "Idle"  # Idle, Monitoring, Analysis, Prediction, Reasoning, Planning, Optimization, Execution, Reflection, Learning, Recovery, Error
    health_status: str = "healthy"  # healthy, degraded, error
    last_active: datetime = Field(default_factory=datetime.utcnow)
    runtime_metadata: Dict[str, Any] = Field(default_factory=dict)

class StateTransitionModel(BaseModel):
    transition_id: UUID = Field(default_factory=uuid4)
    agent_name: str
    from_state: str
    to_state: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    trigger: str
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)
