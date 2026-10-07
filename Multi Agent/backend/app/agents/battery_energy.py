import logging
from typing import List
from app.core.plugin import BaseAgent
from app.domain.contracts.events import BaseEvent

logger = logging.getLogger("FluxCore.BatteryEnergyAgent")

class BatteryEnergyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="BatteryEnergyAgent",
            version="1.0.0",
            capabilities=["battery_optimization", "charge_planning", "discharge_planning", "battery_health_rul"],
            dependencies=[]
        )

    async def on_start(self):
        logger.info("Battery Energy Agent started. Subscribed to telemetry and grid controls.")
        from app.core.event_bus import event_bus
        event_bus.subscribe("telemetry.updated", self.on_event)
        event_bus.subscribe("demand.forecast.updated", self.on_event)
        event_bus.subscribe("orchestrator.command", self.on_event)

    async def on_event(self, event: BaseEvent):
        if event.event_name == "orchestrator.command" and event.payload.get("type") == "state_transition":
            return
        logger.info(f"Battery Energy Agent received event: {event.event_name}")
        self.state_machine.transition_to("Optimization", trigger="optimization_input_received")
        # Run BESS algorithm stub
        self.state_machine.transition_to("Idle", trigger="optimization_complete")

    async def on_stop(self):
        logger.info("Battery Energy Agent shutting down.")
