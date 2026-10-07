import logging
from typing import List
from app.core.plugin import BaseAgent
from app.domain.contracts.events import BaseEvent
from app.infrastructure.gemini_service import GeminiReasoningEngine

logger = logging.getLogger("FluxCore.CybersecurityAgent")

class CybersecurityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="CybersecurityAgent",
            version="1.0.0",
            capabilities=["network_monitoring", "intrusion_detection", "threat_detection", "security_audit"],
            dependencies=[]
        )
        self.gemini_engine = GeminiReasoningEngine(api_key_env_var="CYBERSECURITY_AGENT_GEMINI_API_KEY")

    async def on_start(self):
        logger.info("Cybersecurity Agent started. Subscribed to network and telemetry packets.")
        from app.core.event_bus import event_bus
        event_bus.subscribe("telemetry.updated", self.on_event)
        event_bus.subscribe("orchestrator.command", self.on_event)

    async def on_event(self, event: BaseEvent):
        if event.event_name == "orchestrator.command" and event.payload.get("type") == "state_transition":
            return
        logger.info(f"Cybersecurity Agent received event: {event.event_name}")
        self.state_machine.transition_to("Analysis", trigger="packet_received")
        
        # Analyze and detect anomalies
        # If telemetry power or voltage is abnormal, trigger security threat
        # self.state_machine.transition_to("Idle", trigger="analysis_complete")

    async def on_stop(self):
        logger.info("Cybersecurity Agent shutting down.")
