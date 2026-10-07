import random

class AssetSimulator:
    def __init__(self):
        # Asset degradation states (SOH coefficients)
        self.solar_soh = 99.5
        self.wind_soh = 98.8
        self.hydro_soh = 99.2
        self.battery_soh = 99.7
        
        # Siltation coefficient for Hydro
        self.reservoir_siltation = 12.4 # % of capacity silted

    def run_simulation(self, weather_data: dict, forecasts: dict, active_plan: str) -> dict:
        """
        Simulates physical characteristics, heating, degradation, and state indicators
        for all active assets based on the weather conditions and selected plans.
        """
        temp = weather_data.get("temperature", 20.0)
        irrad = weather_data.get("solar_irradiance", 0.0)
        wind_spd = weather_data.get("wind_speed", 5.0)
        wind_dir = weather_data.get("wind_direction", 180.0)
        reservoir = weather_data.get("reservoir_level", 80.0)
        soc = weather_data.get("battery_soc", 50.0)
        
        solar_gen = forecasts.get("solar_generation", 0.0)
        wind_gen = forecasts.get("wind_generation", 0.0)
        hydro_gen = forecasts.get("hydro_generation", 0.0)
        
        # 1. SOLAR SIMULATION
        # Cell Temperature: typically ambient temp + (irrad * coefficient)
        solar_cell_temp = temp + (irrad * 0.025)
        # Solar degradation updates slowly
        self.solar_soh = max(80.0, self.solar_soh - 0.0001)
        # Efficiency index calculation
        temp_loss = max(0, (solar_cell_temp - 25.0) * 0.004)
        solar_efficiency = max(0.1, 0.22 * (1.0 - temp_loss) * (self.solar_soh / 100.0))

        # 2. WIND SIMULATION
        # Rotor states
        if wind_spd >= 25.0:
            rotor_state = "STORM_PARKED"
        elif wind_spd >= 3.0:
            rotor_state = "SPINNING"
        else:
            rotor_state = "IDLE"
            
        # Turbine degradation spikes during storms
        if wind_spd >= 22.0:
            self.wind_soh = max(70.0, self.wind_soh - 0.005)
        else:
            self.wind_soh = max(70.0, self.wind_soh - 0.0002)
            
        # Yaw alignment deviation (degrees offset from wind direction)
        yaw_dev = random.uniform(-5.0, 5.0) if rotor_state == "SPINNING" else 0.0

        # 3. HYDRO SIMULATION
        # Penstock flow (m3/s) based on generation levels
        penstock_flow = (hydro_gen / 5000.0) * 45.0 # max flow 45 m3/s
        # Hydrological head (pressure indicator) based on reservoir level
        hydraulic_head = 120.0 * (reservoir / 100.0) # max head 120m
        # Turbine efficiency decreases slightly with low reservoir (siltation)
        self.hydro_soh = max(85.0, self.hydro_soh - 0.0001)
        hydro_efficiency = 0.88 * (self.hydro_soh / 100.0)

        # 4. BATTERY SIMULATION
        # SOH decreases with deep cycles (<20% SOC) or high charging
        if soc < 20.0 or soc > 85.0:
            self.battery_soh = max(80.0, self.battery_soh - 0.001)
        else:
            self.battery_soh = max(80.0, self.battery_soh - 0.0001)
            
        # Charging state
        if "Charge Battery" in active_plan:
            battery_state = "CHARGING"
            battery_cell_temp = temp + 8.5 # charging raises battery temp
        elif "Sell Excess" in active_plan or soc > 75.0 and forecasts["total_renewable"] < weather_data["grid_demand"]:
            battery_state = "DISCHARGING"
            battery_cell_temp = temp + 4.0
        else:
            battery_state = "STABLE"
            battery_cell_temp = temp + 1.0

        return {
            "solar": {
                "irradiance": round(irrad, 1),
                "cell_temp": round(solar_cell_temp, 2),
                "efficiency": round(solar_efficiency * 100.0, 2),
                "capacity": 10000.0,
                "soh": round(self.solar_soh, 4)
            },
            "wind": {
                "wind_speed": round(wind_spd, 2),
                "rotor_state": rotor_state,
                "yaw_deviation": round(yaw_dev, 2),
                "capacity": 8000.0,
                "soh": round(self.wind_soh, 4)
            },
            "hydro": {
                "reservoir_level": round(reservoir, 1),
                "penstock_flow": round(penstock_flow, 2),
                "hydraulic_head": round(hydraulic_head, 2),
                "siltation": round(self.reservoir_siltation, 2),
                "capacity": 5000.0,
                "soh": round(self.hydro_soh, 4)
            },
            "battery": {
                "soc": round(soc, 1),
                "soh": round(self.battery_soh, 4),
                "state": battery_state,
                "cell_temp": round(battery_cell_temp, 2),
                "capacity_mwh": 10.0
            }
        }
