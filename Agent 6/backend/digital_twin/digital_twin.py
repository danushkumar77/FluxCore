import math
import random
from datetime import datetime
from typing import Dict, Any

class GridDigitalTwin:
    def __init__(self):
        # Initial status
        self.battery_capacity_kwh = 600.0
        self.battery_soc = 0.52
        self.battery_temp_c = 28.5
        self.battery_cycle_count = 120.0
        self.battery_soh = 98.4
        
        self.transformer_temp_c = 65.2
        self.grid_frequency_hz = 60.01
        self.grid_voltage_pu = 1.01
        
        self.solar_installed_kw = 800.0
        self.wind_installed_kw = 400.0
        
        self.sim_hour = 8.0 # Starts at 8:00 AM
        
    def step_simulation(self, battery_dispatch_kw: float) -> Dict[str, Any]:
        """
        Updates the physical state of the grid by one time step (simulated hour).
        battery_dispatch_kw: positive is discharging, negative is charging.
        """
        # Increment hour (0 to 23 cycle)
        self.sim_hour = (self.sim_hour + 0.1) % 24.0
        
        # 1. Solar Generation (diurnal curve)
        # Peak solar around hour 13
        solar_rad = max(0.0, math.sin((self.sim_hour - 6) * math.pi / 12)) if 6 <= self.sim_hour <= 18 else 0.0
        solar_gen = self.solar_installed_kw * solar_rad * random.uniform(0.85, 1.0)
        
        # 2. Wind Generation (random fluctuations)
        wind_gen = self.wind_installed_kw * random.uniform(0.2, 0.7)
        
        # 3. Base load demand (double peak curve: morning and evening peaks)
        # Peak 1 around hour 9, Peak 2 around hour 19
        load_factor = 0.3 + 0.4 * math.exp(-((self.sim_hour - 9)**2)/16) + 0.5 * math.exp(-((self.sim_hour - 19)**2)/16)
        load_demand = 850.0 * load_factor * random.uniform(0.9, 1.1)
        
        # 4. Apply battery dispatch
        # Update State of Charge (SoC)
        efficiency = 0.92
        if battery_dispatch_kw < 0: # Charging
            energy_change = abs(battery_dispatch_kw) * efficiency * 0.1 # 0.1h step
            self.battery_soc = min(0.95, self.battery_soc + (energy_change / self.battery_capacity_kwh))
            self.battery_temp_c = min(45.0, self.battery_temp_c + 0.05 * abs(battery_dispatch_kw))
        elif battery_dispatch_kw > 0: # Discharging
            energy_change = (battery_dispatch_kw / efficiency) * 0.1 # 0.1h step
            self.battery_soc = max(0.15, self.battery_soc - (energy_change / self.battery_capacity_kwh))
            self.battery_temp_c = min(45.0, self.battery_temp_c + 0.08 * battery_dispatch_kw)
        else: # Idle
            self.battery_temp_c = max(25.0, self.battery_temp_c - 0.2)
            
        # Increment health metrics slightly
        if abs(battery_dispatch_kw) > 5.0:
            # 1 cycle is full capacity processed
            cycles_added = (abs(battery_dispatch_kw) * 0.1) / (self.battery_capacity_kwh * 2.0)
            self.battery_cycle_count += cycles_added
            self.battery_soh = max(70.0, self.battery_soh - cycles_added * 0.005)
            
        # 5. Grid imports and balances
        net_load = load_demand - solar_gen - wind_gen - battery_dispatch_kw
        
        # 6. Physical grid response (frequency, voltage, temperature)
        frequency_drift = (net_load / 3000.0) * 0.08
        self.grid_frequency_hz = round(60.0 - frequency_drift + random.uniform(-0.01, 0.01), 3)
        
        voltage_drift = (net_load / 3000.0) * 0.03
        self.grid_voltage_pu = round(1.0 - voltage_drift + random.uniform(-0.005, 0.005), 3)
        
        self.transformer_temp_c = round(50.0 + (abs(net_load) / 1000.0) * 12.0 + random.uniform(-0.5, 0.5), 1)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "sim_hour": round(self.sim_hour, 2),
            "solar_gen_kw": round(solar_gen, 1),
            "wind_gen_kw": round(wind_gen, 1),
            "load_demand_kw": round(load_demand, 1),
            "net_grid_load_kw": round(net_load, 1),
            "battery": {
                "soc": round(self.battery_soc, 3),
                "capacity_kwh": self.battery_capacity_kwh,
                "soh_pct": round(self.battery_soh, 2),
                "cycle_count": round(self.battery_cycle_count, 3),
                "temperature_c": round(self.battery_temp_c, 1),
                "active_power_kw": round(battery_dispatch_kw, 1)
            },
            "grid_diagnostics": {
                "frequency_hz": self.grid_frequency_hz,
                "voltage_pu": self.grid_voltage_pu,
                "transformer_temp_c": self.transformer_temp_c
            }
        }

# Global singleton
digital_twin = GridDigitalTwin()
