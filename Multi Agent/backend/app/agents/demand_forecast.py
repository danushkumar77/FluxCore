import logging
from typing import List
from app.core.plugin import BaseAgent
from app.domain.contracts.events import BaseEvent

logger = logging.getLogger("FluxCore.DemandForecastAgent")

class DemandForecastAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="DemandForecastAgent",
            version="1.0.0",
            capabilities=["demand_forecasting", "load_analysis", "peak_prediction"],
            dependencies=[]
        )

    async def on_start(self):
        logger.info("Demand Forecast Agent started. Registering to telemetry updates.")
        # Subscribe to raw telemetry updates
        from app.core.event_bus import event_bus
        event_bus.subscribe("telemetry.updated", self.on_event)

    async def on_event(self, event: BaseEvent):
        logger.info(f"Demand Forecast Agent received event: {event.event_name}")
        self.state_machine.transition_to("Analysis", trigger="telemetry_received")
        
        # Analyze load profiles and publish demand.forecast.updated event
        # (Business logic to be implemented later)
        
        self.state_machine.transition_to("Idle", trigger="analysis_complete")

    async def on_stop(self):
        logger.info("Demand Forecast Agent shutting down.")
