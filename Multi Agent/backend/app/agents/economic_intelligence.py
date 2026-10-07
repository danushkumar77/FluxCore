import logging
from typing import List
from app.core.plugin import BaseAgent
from app.domain.contracts.events import BaseEvent

logger = logging.getLogger("FluxCore.EconomicIntelligenceAgent")

class EconomicIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="EconomicIntelligenceAgent",
            version="1.0.0",
            capabilities=["cost_optimization", "market_analysis", "energy_trading", "carbon_optimization"],
            dependencies=[]
        )

    async def on_start(self):
        logger.info("Economic Intelligence Agent started. Subscribed to market and price tickers.")
        from app.core.event_bus import event_bus
        event_bus.subscribe("telemetry.updated", self.on_event)
        event_bus.subscribe("demand.forecast.updated", self.on_event)

    async def on_event(self, event: BaseEvent):
        logger.info(f"Economic Intelligence Agent received event: {event.event_name}")
        self.state_machine.transition_to("Optimization", trigger="market_data_received")
        # Run optimization step stub
        self.state_machine.transition_to("Idle", trigger="optimization_complete")

    async def on_stop(self):
        logger.info("Economic Intelligence Agent shutting down.")
