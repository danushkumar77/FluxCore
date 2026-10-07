import uuid
import logging
from typing import Dict, Any, List
from datetime import datetime
from backend.app.domain.entities import BatteryExecution, BatteryDecision
from backend.app.domain.interfaces import DecisionRepository
from backend.app.core.event_bus import EventBus, EventContract, event_bus_instance

logger = logging.getLogger("FluxCore.ExecutionService")

class ExecutionService:
    def __init__(self, decision_repo: DecisionRepository, event_bus: EventBus = event_bus_instance):
        self.decision_repo = decision_repo
        self.event_bus = event_bus

    async def execute_plan(self, decision: BatteryDecision, container_id: str, power_kw: float, correlation_id: str) -> BatteryExecution:
        plan_id = decision.selected_plan
        action_type = "IDLE"
        log_msg = f"Executing general plan: {plan_id}"
        
        if plan_id == "PLAN-A":
            action_type = "CHARGE"
            log_msg = await self.store_surplus_energy(container_id, power_kw)
        elif plan_id == "PLAN-B":
            action_type = "DISCHARGE"
            log_msg = await self.discharge_battery(container_id, power_kw)
            await self.enable_peak_shaving(container_id)
        elif plan_id == "PLAN-C":
            action_type = "CHARGE"  # charging up backup
            log_msg = await self.reserve_backup_power(container_id, 90.0)
        elif plan_id == "PLAN-D":
            action_type = "CHARGE"  # throttled charge
            log_msg = await self.reduce_charge_rate(container_id, power_kw)
        elif plan_id == "PLAN-E":
            if "CHARGE" in decision.explanation:
                action_type = "CHARGE"
                log_msg = await self.charge_battery(container_id, power_kw)
            elif "DISCHARGE" in decision.explanation:
                action_type = "DISCHARGE"
                log_msg = await self.discharge_battery(container_id, power_kw)
                
        execution = BatteryExecution(
            execution_id=f"EXE-{str(uuid.uuid4())[:8]}",
            decision_id=decision.decision_id,
            container_id=container_id,
            timestamp=datetime.utcnow(),
            action_type=action_type,
            duration_min=15.0,  # BESS cycles typically run in 15 minute dispatches
            power_kw=power_kw,
            response_code=200,
            log_message=log_msg
        )
        
        await self.decision_repo.save_execution(execution)
        
        # Publish Event
        event = EventContract(
            event_type="battery.execution.completed",
            correlation_id=correlation_id,
            payload=execution.dict()
        )
        await self.event_bus.publish(event)
        
        return execution

    # BESS Autonomous Tools
    async def charge_battery(self, container_id: str, power_kw: float) -> str:
        msg = f"[TOOL EXECUTION] charging_battery: container {container_id} initiated at charge power {power_kw:.1f} kW."
        logger.info(msg)
        return msg

    async def discharge_battery(self, container_id: str, power_kw: float) -> str:
        msg = f"[TOOL EXECUTION] discharging_battery: container {container_id} initiated at discharge power {power_kw:.1f} kW."
        logger.info(msg)
        return msg

    async def store_surplus_energy(self, container_id: str, power_kw: float) -> str:
        msg = f"[TOOL EXECUTION] store_surplus_energy: container {container_id} storing renewable surplus of {power_kw:.1f} kW."
        logger.info(msg)
        return msg

    async def reduce_charge_rate(self, container_id: str, power_kw: float) -> str:
        msg = f"[TOOL EXECUTION] reduce_charge_rate: container {container_id} throttled to protective charge rate {power_kw:.1f} kW."
        logger.info(msg)
        return msg

    async def increase_charge_rate(self, container_id: str, power_kw: float) -> str:
        msg = f"[TOOL EXECUTION] increase_charge_rate: container {container_id} ramped up charge rate to {power_kw:.1f} kW."
        logger.info(msg)
        return msg

    async def enable_peak_shaving(self, container_id: str) -> str:
        msg = f"[TOOL EXECUTION] enable_peak_shaving: peak shaving algorithm enabled for BESS asset {container_id}."
        logger.info(msg)
        return msg

    async def reserve_backup_power(self, container_id: str, soc_threshold: float) -> str:
        msg = f"[TOOL EXECUTION] reserve_backup_power: holding battery reserve target capacity to {soc_threshold}%."
        logger.info(msg)
        return msg

    async def notify_grid_operator(self, message: str) -> str:
        msg = f"[TOOL EXECUTION] notify_grid_operator: Dispatch signal alert transmitted. Payload: '{message}'."
        logger.info(msg)
        return msg
