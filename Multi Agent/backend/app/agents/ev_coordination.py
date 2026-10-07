import logging
from typing import List
from app.core.plugin import BaseAgent
from app.domain.contracts.events import BaseEvent
from app.infrastructure.gemini_service import GeminiReasoningEngine

logger = logging.getLogger("FluxCore.EVCoordinationAgent")

class EVCoordinationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="EVCoordinationAgent",
            version="1.0.0",
            capabilities=["ev_charging_optimization", "load_forecasting", "v2g_scheduling"],
            dependencies=[]
        )
        self.gemini_engine = GeminiReasoningEngine(api_key_env_var="EV_COORDINATION_AGENT_GEMINI_API_KEY")

    async def on_start(self):
        logger.info("EV Coordination Agent started. Subscribed to grid load and charging queues.")
        from app.core.event_bus import event_bus
        event_bus.subscribe("telemetry.updated", self.on_event)
        event_bus.subscribe("ev.charge.requested", self.on_event)

    async def on_event(self, event: BaseEvent):
        logger.info(f"EV Coordination Agent received event: {event.event_name}")
        self.state_machine.transition_to("Optimization", trigger="charge_request_received")
        
        # Run schedule optimization
        # self.state_machine.transition_to("Idle", trigger="optimization_complete")

    async def on_stop(self):
        logger.info("EV Coordination Agent shutting down.")
