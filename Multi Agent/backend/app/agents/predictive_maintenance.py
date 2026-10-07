import logging
from typing import List
from app.core.plugin import BaseAgent
from app.domain.contracts.events import BaseEvent
from app.infrastructure.gemini_service import GeminiReasoningEngine

logger = logging.getLogger("FluxCore.PredictiveMaintenanceAgent")

class PredictiveMaintenanceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="PredictiveMaintenanceAgent",
            version="1.0.0",
            capabilities=["asset_monitoring", "failure_prediction", "maintenance_planning", "health_assessment"],
            dependencies=[]
        )
        self.gemini_engine = GeminiReasoningEngine(api_key_env_var="MAINTENANCE_AGENT_GEMINI_API_KEY")

    async def on_start(self):
        logger.info("Predictive Maintenance Agent started. Subscribed to asset health metrics.")
        from app.core.event_bus import event_bus
        event_bus.subscribe("telemetry.updated", self.on_event)

    async def on_event(self, event: BaseEvent):
        logger.info(f"Predictive Maintenance Agent received event: {event.event_name}")
        self.state_machine.transition_to("Analysis", trigger="telemetry_received")
        
        # Run remaining useful life forecast
        # self.state_machine.transition_to("Idle", trigger="analysis_complete")

    async def on_stop(self):
        logger.info("Predictive Maintenance Agent shutting down.")
