from typing import List, Dict, Any
from agents.agent_state import agent_state_manager

class PlanStep:
    def __init__(self, step_id: str, action: str, tool_name: str, params: dict):
        self.step_id = step_id
        self.action = action
        self.tool_name = tool_name
        self.params = params
        self.status = "Pending" # Pending, Executing, Success, Failed

    def to_dict(self) -> dict:
        return {
            "step_id": self.step_id,
            "action": self.action,
            "tool_name": self.tool_name,
            "params": self.params,
            "status": self.status
        }

class Planner:
    """Planning engine for dynamically generating sequential grid operation steps."""
    def generate_plan(self, prediction: float, risk: str, inputs: dict) -> List[PlanStep]:
        plan: List[PlanStep] = []
        battery_soc = inputs.get('battery_soc', 50)
        ren_percentage = inputs.get('renewable_percentage', 30)
        price = inputs.get('electricity_price', 50)

        # Baseline plan steps
        plan.append(PlanStep("step_1", "Ingest Telemetry Scan", "verify_telemetry", {}))

        # Conditional logic based on forecast risks
        if risk in ["High", "Critical"]:
            # Rule 1: check battery reserves
            if battery_soc > 40:
                plan.append(PlanStep(
                    "step_2", 
                    f"Dispatch battery storage (SOC is {battery_soc}%)", 
                    "dispatch_battery", 
                    {"discharge_rate_mw": 500, "soc_limit": 40}
                ))
            else:
                # Rule 2: check renewable penetration
                if ren_percentage < 25:
                    plan.append(PlanStep(
                        "step_2", 
                        "Increase dispatch priority for solar/wind links", 
                        "increase_solar_priority", 
                        {"priority_level": "High"}
                      ))
                
                # Rule 3: market cost evaluation
                if price < 120:
                    plan.append(PlanStep(
                        "step_3",
                        f"Purchase power import (price is ${price}/MWh)",
                        "purchase_power",
                        {"amount_mwh": 1000, "price_cap": 120}
                    ))
                else:
                    plan.append(PlanStep(
                        "step_3",
                        "Activate Demand Response load curtailment",
                        "enable_demand_response",
                        {"reduction_mw": 800}
                    ))
            
            # Critical warning alert
            if risk == "Critical":
                plan.append(PlanStep("step_4", "Notify Grid Operations Director", "notify_operator", {"severity": "Critical"}))
        else:
            # Low / Medium risk loading
            plan.append(PlanStep("step_2", "Maintain standard float charge", "optimize_battery", {"soc_target": 70}))
            plan.append(PlanStep("step_3", "Schedule baseline thermal generation adjustments", "schedule_generator", {"delta_mw": -200}))

        # Sync plan
        agent_state_manager.current_plan = [step.to_dict() for step in plan]
        return plan

planner = Planner()
