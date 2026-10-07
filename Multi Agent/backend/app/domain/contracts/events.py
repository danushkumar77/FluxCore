from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID, uuid4

class BaseEvent(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    event_name: str
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: UUID = Field(default_factory=uuid4)
    trace_id: UUID = Field(default_factory=uuid4)
    producer: str
    priority: int = 3  # 1 (Highest) to 5 (Lowest)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    payload: Dict[str, Any]

class DemandForecastUpdatedEvent(BaseEvent):
    event_name: str = "demand.forecast.updated"

class RenewableForecastUpdatedEvent(BaseEvent):
    event_name: str = "renewable.forecast.updated"

class BatteryStrategySelectedEvent(BaseEvent):
    event_name: str = "battery.strategy.selected"

class GridFaultDetectedEvent(BaseEvent):
    event_name: str = "grid.fault.detected"

class MaintenanceRequiredEvent(BaseEvent):
    event_name: str = "maintenance.required"

class EconomicPlanUpdatedEvent(BaseEvent):
    event_name: str = "economic.plan.updated"

class OptimizationCompletedEvent(BaseEvent):
    event_name: str = "optimization.completed"

class TelemetryUpdatedEvent(BaseEvent):
    event_name: str = "telemetry.updated"

class OrchestratorCommandEvent(BaseEvent):
    event_name: str = "orchestrator.command"
