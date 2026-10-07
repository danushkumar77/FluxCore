from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID, uuid4

class BaseCommand(BaseModel):
    command_id: UUID = Field(default_factory=uuid4)
    correlation_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str
    target_agent: str
    priority: int = 3  # 1 (Highest) to 5 (Lowest)
    version: str = "1.0.0"

class StartAgentCommand(BaseCommand):
    payload: Dict[str, Any] = Field(default_factory=dict)

class StopAgentCommand(BaseCommand):
    payload: Dict[str, Any] = Field(default_factory=dict)

class RestartAgentCommand(BaseCommand):
    payload: Dict[str, Any] = Field(default_factory=dict)

class ExecuteOptimizationCommand(BaseCommand):
    payload: Dict[str, Any]  # e.g., {"site_id": "...", "objective": "cost"}

class TriggerSimulationCommand(BaseCommand):
    payload: Dict[str, Any]  # e.g., {"scenario": "grid_failure", "asset_id": "..."}
