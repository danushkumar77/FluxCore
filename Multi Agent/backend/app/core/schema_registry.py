from typing import Dict, Type
from pydantic import BaseModel
from app.domain.contracts.events import (
    BaseEvent,
    DemandForecastUpdatedEvent,
    RenewableForecastUpdatedEvent,
    BatteryStrategySelectedEvent,
    GridFaultDetectedEvent,
    MaintenanceRequiredEvent,
    EconomicPlanUpdatedEvent,
    OptimizationCompletedEvent,
    TelemetryUpdatedEvent,
    OrchestratorCommandEvent
)

class EventSchemaRegistry:
    def __init__(self):
        self._schemas: Dict[str, Type[BaseModel]] = {}
        self.register_default_schemas()

    def register_schema(self, event_name: str, model_cls: Type[BaseModel]):
        self._schemas[event_name] = model_cls

    def register_default_schemas(self):
        self.register_schema("demand.forecast.updated", DemandForecastUpdatedEvent)
        self.register_schema("renewable.forecast.updated", RenewableForecastUpdatedEvent)
        self.register_schema("battery.strategy.selected", BatteryStrategySelectedEvent)
        self.register_schema("grid.fault.detected", GridFaultDetectedEvent)
        self.register_schema("maintenance.required", MaintenanceRequiredEvent)
        self.register_schema("economic.plan.updated", EconomicPlanUpdatedEvent)
        self.register_schema("optimization.completed", OptimizationCompletedEvent)
        self.register_schema("telemetry.updated", TelemetryUpdatedEvent)
        self.register_schema("orchestrator.command", OrchestratorCommandEvent)

    def validate(self, event_name: str, payload: dict) -> bool:
        """Validate payload dictionary against the registered event model class."""
        if event_name not in self._schemas:
            raise ValueError(f"Unregistered event type: {event_name}")
        
        try:
            # Reconstruct the model to trigger validation
            model_cls = self._schemas[event_name]
            model_cls.model_validate(payload)
            return True
        except Exception as e:
            print(f"Validation failed for event '{event_name}': {e}")
            raise e

    def get_model_cls(self, event_name: str) -> Type[BaseModel]:
        if event_name not in self._schemas:
            raise ValueError(f"Unregistered event type: {event_name}")
        return self._schemas[event_name]

# Global instance for DI
schema_registry = EventSchemaRegistry()
