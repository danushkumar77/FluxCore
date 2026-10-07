import logging
from typing import List
from app.core.plugin import BaseAgent
from app.domain.contracts.events import BaseEvent
from app.infrastructure.gemini_service import GeminiReasoningEngine

logger = logging.getLogger("FluxCore.CarbonOptimizationAgent")

class CarbonOptimizationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="CarbonOptimizationAgent",
            version="1.0.0",
            capabilities=["carbon_reduction_control", "emissions_tracking", "sustainability_audit"],
            dependencies=[]
        )
        self.gemini_engine = GeminiReasoningEngine() # Uses standard global key settings

    async def on_start(self):
        logger.info("Carbon Optimization Agent started. Subscribed to carbon footprint signals.")
        from app.core.event_bus import event_bus
        event_bus.subscribe("telemetry.updated", self.on_event)

    async def on_event(self, event: BaseEvent):
        logger.info(f"Carbon Optimization Agent received event: {event.event_name}")
        self.state_machine.transition_to("Optimization", trigger="telemetry_received")

    async def on_stop(self):
        logger.info("Carbon Optimization Agent shutting down.")
