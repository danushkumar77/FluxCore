import time
from datetime import datetime
from backend.agent.memory_manager import MemoryManager

class SimulatedTools:
    def __init__(self, memory_manager: MemoryManager):
        self.memory = memory_manager

    def execute_tool(self, name: str, params: dict) -> str:
        """
        Executes a simulated tool by name and parameters, logs the execution.
        """
        print(f"Executing simulated tool: {name} with parameters: {params}")
        status = "SUCCESS"
        output = ""
        
        try:
            if name == "increase_solar_dispatch":
                amount = params.get("amount_mw", 0)
                output = f"Dispatched additional {amount:.2f} MW of solar energy to the grid. Inverter phase angles stabilized."
            elif name == "increase_wind_dispatch":
                amount = params.get("amount_mw", 0)
                output = f"Dispatched additional {amount:.2f} MW of wind generation. Active power ramp rate set to +5% per min."
            elif name == "increase_hydro_dispatch":
                amount = params.get("amount_mw", 0)
                output = f"Opened penstock valves. Dispatched additional {amount:.2f} MW of hydro. Flow rate stabilized."
            elif name == "charge_battery":
                power = params.get("power_mw", 0)
                duration = params.get("duration_hours", 1)
                output = f"Initiated battery charging at {power:.2f} MW for {duration:.2f} hours. Cell thermal limits within bounds."
            elif name == "store_surplus_energy":
                power = params.get("power_mw", 0)
                output = f"Diverted {power:.2f} MW of surplus renewable energy to thermal/mechanical storage units."
            elif name == "sell_excess_power":
                power = params.get("power_mw", 0)
                price = params.get("price_per_mwh", 0)
                revenue = power * price
                output = f"Executed wholesale energy export transaction: Sold {power:.2f} MW at ${price:.2f}/MWh. Net hourly yield: ${revenue:.2f}."
            elif name == "reduce_curtailment":
                amount = params.get("amount_mw", 0)
                output = f"Recaptured {amount:.2f} MW of generation by adjusting dispatch targets and relaxing line loading limits."
            elif name == "notify_grid_operator":
                msg = params.get("message", "Status nominal")
                output = f"Dispatched automated alert to grid dispatch operator center: '{msg}'"
            else:
                status = "FAILED"
                output = f"Unknown tool: {name}"
        except Exception as e:
            status = "ERROR"
            output = f"Exception occurred: {str(e)}"
            
        # Log to memory database
        self.memory.store_tool_log(name, params, status, output)
        return output

    def increase_solar_dispatch(self, amount_mw: float):
        return self.execute_tool("increase_solar_dispatch", {"amount_mw": amount_mw})

    def increase_wind_dispatch(self, amount_mw: float):
        return self.execute_tool("increase_wind_dispatch", {"amount_mw": amount_mw})

    def increase_hydro_dispatch(self, amount_mw: float):
        return self.execute_tool("increase_hydro_dispatch", {"amount_mw": amount_mw})

    def charge_battery(self, power_mw: float, duration_hours: float = 1.0):
        return self.execute_tool("charge_battery", {"power_mw": power_mw, "duration_hours": duration_hours})

    def store_surplus_energy(self, power_mw: float):
        return self.execute_tool("store_surplus_energy", {"power_mw": power_mw})

    def sell_excess_power(self, power_mw: float, price_per_mwh: float):
        return self.execute_tool("sell_excess_power", {"power_mw": power_mw, "price_per_mwh": price_per_mwh})

    def reduce_curtailment(self, amount_mw: float):
        return self.execute_tool("reduce_curtailment", {"amount_mw": amount_mw})

    def notify_grid_operator(self, message: str):
        return self.execute_tool("notify_grid_operator", {"message": message})
