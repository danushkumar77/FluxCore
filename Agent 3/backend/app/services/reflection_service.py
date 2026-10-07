import uuid
import random
import logging
from typing import Dict, Any
from datetime import datetime
from backend.app.domain.entities import BatteryDecision, BatteryTelemetry
from backend.app.domain.interfaces import MemoryRepository
from backend.app.core.event_bus import EventBus, EventContract, event_bus_instance

logger = logging.getLogger("FluxCore.ReflectionService")

class ReflectionService:
    def __init__(self, memory_repo: MemoryRepository, event_bus: EventBus = event_bus_instance):
        self.memory_repo = memory_repo
        self.event_bus = event_bus

    async def reflect(self, decision: BatteryDecision, telemetry: BatteryTelemetry, correlation_id: str) -> Dict[str, Any]:
        # Calculate mock actual parameters vs predictions to generate a forecast error
        # In a real system, we look at the telemetry 15 minutes later and calculate pricing/grid cost offsets
        pred_cost = decision.expected_cost or 0.0
        pred_rev = decision.expected_revenue or 0.0
        
        # Simulate variation
        deviation_pct = random.uniform(-0.15, 0.10)
        actual_cost = pred_cost * (1 + deviation_pct)
        actual_rev = pred_rev * (1 + deviation_pct)
        
        error = (actual_rev - actual_cost) - (pred_rev - pred_cost)
        
        lesson_text = ""
        if decision.selected_plan == "PLAN-A":
            if error < 0:
                lesson_text = f"Solar output dropped faster than forecast by {abs(deviation_pct)*100:.1f}%. Charging costs rose slightly. Future solar charging should buffer load drop forecasts."
            else:
                lesson_text = "Solar capture successful. Solar surplus was fully utilized, matching expected grid offsets."
        elif decision.selected_plan == "PLAN-B":
            if error < 0:
                lesson_text = "Peak discharge finished. Grid frequency drops caused minor billing efficiency loss. Plan was correct, but frequency filters need adjustment."
            else:
                lesson_text = "Discharged during high grid peak. High price capture validated. BESS did not overheat."
        elif decision.selected_plan == "PLAN-C":
            lesson_text = "Reserve backup maintained. System frequency remained nominal, grid support ready."
        elif decision.selected_plan == "PLAN-D":
            lesson_text = f"Thermal throttle success. Average cell temperatures cooled down by {1.5 + random.uniform(0, 1):.1f}C. SOH was preserved at cost of charging speed."
        else:
            lesson_text = f"Arbitrage strategy completed. Captured grid pricing spreads at ${telemetry.market_price_usd:.2f}/MWh."
            
        lesson = {
            "lesson_id": f"LES-{str(uuid.uuid4())[:8]}",
            "container_id": decision.container_id,
            "timestamp": datetime.utcnow().isoformat(),
            "condition_type": f"PLAN_REFLECT_{decision.selected_plan}",
            "decision_made": f"{decision.selected_plan} ({decision.explanation[:60]}...)",
            "outcome": f"Profit impact: ${actual_rev - actual_cost:.2f} (Prediction: ${pred_rev - pred_cost:.2f})",
            "expected_vs_actual_error": float(error),
            "lesson_learned": lesson_text
        }
        
        await self.memory_repo.save_lesson(lesson)
        
        # Publish reflection completed event
        event = EventContract(
            event_type="battery.reflection.completed",
            correlation_id=correlation_id,
            payload=lesson
        )
        await self.event_bus.publish(event)
        
        return lesson
