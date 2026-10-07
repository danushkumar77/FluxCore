import time
from typing import Dict, Any, List
from app.domain.aggregates.grid_aggregates import RestorationPlan, RestorationStep, GridTopology
from app.domain.interfaces.repository_interfaces import GridRepositoryInterface

class GridRestorationService:
    def __init__(self, grid_repo: GridRepositoryInterface, event_publisher=None):
        self.grid_repo = grid_repo
        self.event_publisher = event_publisher
        self.logs: List[Dict[str, Any]] = []

    def execute_step(self, step: RestorationStep, topology: GridTopology) -> Dict[str, Any]:
        """
        Executes a specific restoration tool.
        """
        action = step.action
        target_id = step.target_equipment_id
        timestamp = time.time()
        success = True
        message = ""

        # Tool execution matching
        if action == "open_breaker":
            self.grid_repo.update_breaker_status(target_id, is_closed=False)
            message = f"Breaker {target_id} successfully opened. Section isolated."
        elif action == "close_breaker":
            self.grid_repo.update_breaker_status(target_id, is_closed=True)
            message = f"Breaker {target_id} closed. Network path energized."
        elif action == "perform_load_transfer":
            # Set target transformer cooling active or adjust simulated load capacity
            self.grid_repo.update_transformer_telemetry(target_id, {"cooling_active": True})
            message = f"Load transfer successfully performed to asset {target_id}. Cooling activated."
        elif action == "shed_noncritical_load":
            message = f"feeder load shed request executed for segment {target_id}. Load reduced."
        elif action == "request_battery_support":
            # Simulate notifying Agent 3 (Battery storage)
            if self.event_publisher:
                self.event_publisher.publish("agent.battery.support", {
                    "request": "DISCHARGE", "power_mw": 15.0, "duration_minutes": 60
                })
            message = f"Cooperative multi-agent request sent: battery discharge of 15MW activated."
        elif action == "request_renewable_support":
            # Simulate notifying Agent 2 (Renewables)
            if self.event_publisher:
                self.event_publisher.publish("agent.renewable.curtail", {
                    "request": "CURTAIL", "factor_percent": 10.0
                })
            message = f"Cooperative multi-agent request sent: renewable generation output curtailed by 10%."
        elif action == "start_black_start_sequence":
            message = "Black start emergency generator sequence initiated successfully."
        elif action == "restore_customer_supply":
            message = "Feeder loops closed. Customer supply successfully restored."
        elif action == "notify_operator":
            message = f"Operator notified of critical grid action on {target_id}."
        else:
            success = False
            message = f"Unknown tool action: {action}."

        execution_log = {
            "timestamp": timestamp,
            "action": action,
            "target": target_id,
            "operator_mode": "AUTONOMOUS",
            "confidence": 0.95,
            "success": success,
            "message": message,
            "rollback_command": step.rollback_command
        }
        
        self.logs.append(execution_log)
        
        # Mark step as completed
        step.executed = True
        import datetime
        step.execution_timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        
        return execution_log

    def execute_plan(self, plan: RestorationPlan, topology: GridTopology) -> List[Dict[str, Any]]:
        results = []
        for step in plan.steps:
            res = self.execute_step(step, topology)
            results.append(res)
            time.sleep(0.1) # Simulate hardware switching response delay
        plan.status = "EXECUTED"
        return results

    def rollback_plan(self, plan: RestorationPlan, topology: GridTopology) -> List[Dict[str, Any]]:
        results = []
        # Rollback in reverse order
        for step in reversed(plan.steps):
            if step.executed and step.rollback_command:
                parts = step.rollback_command.split(":")
                action = parts[0]
                target_id = parts[1] if len(parts) > 1 else step.target_equipment_id

                rollback_step = RestorationStep(
                    step_number=99,
                    action=action,
                    target_equipment_id=target_id,
                    description=f"Rollback execution step for {step.action}"
                )
                res = self.execute_step(rollback_step, topology)
                results.append(res)
        plan.status = "FAILED" # Plan failed, reverted
        return results
