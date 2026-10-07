import asyncio
import time
from datetime import datetime
from typing import Dict, Any
from agents.agent_state import agent_state_manager
from utils.logger import get_logger

logger = get_logger("tool_executor")

class ToolExecutor:
    """Simulates abstract grid device control tool calls."""
    async def execute_tool(self, name: str, params: dict) -> dict:
        start_time = time.time()
        logger.info(f"Initiating tool call: '{name}' with params: {params}")

        # Simulate device network latency
        await asyncio.sleep(0.5)

        success = True
        reason = "Command acknowledged by RTU controller."
        
        # Specific mock logic
        if name == "dispatch_battery":
            rate = params.get("discharge_rate_mw", 500)
            reason = f"Battery bank discharging at rate of {rate} MW. Grid injection stable."
        elif name == "enable_demand_response":
            red = params.get("reduction_mw", 800)
            reason = f"Demand response relay active. Shedding {red} MW load."
        elif name == "purchase_power":
            amt = params.get("amount_mwh", 1000)
            reason = f"Cleared import transaction of {amt} MWh on spot market."
        elif name == "notify_operator":
            severity = params.get("severity", "Normal")
            reason = f"Grid Operator HUD alert pushed. Severity: {severity}."
        elif name == "increase_solar_priority":
            reason = "Solar connection inverter controls set to high dispatch priority."
        elif name == "schedule_generator":
            delta = params.get("delta_mw", 0)
            reason = f"Adjusting steam generator load profile: {delta} MW."

        duration = time.time() - start_time
        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "name": name,
            "params": params,
            "success": success,
            "duration_sec": round(duration, 3),
            "log": reason
        }

        # Save tool log
        agent_state_manager.tool_logs.append(result)
        return result

tool_executor = ToolExecutor()
