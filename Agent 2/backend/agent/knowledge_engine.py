class KnowledgeEngine:
    def __init__(self):
        # Structured guidelines & rules
        self.rules = {
            "solar": {
                "max_temperature_threshold": 45.0, # Celsius, solar cell efficiency degradation threshold
                "optimal_elevation_min": 15.0,     # Degrees, minimum angle for efficient solar generation
                "inverter_overvoltage_threshold": 1.1, # 110% of rated voltage
                "grid_connection_min_irradiance": 50.0 # W/m2
            },
            "wind": {
                "cut_in_speed": 3.0,     # m/s
                "rated_speed": 12.0,     # m/s
                "cut_out_speed": 25.0,    # m/s (storm shutdown)
                "high_wind_curtailment_limit": 20.0, # m/s (reduce blade angle to limit wear)
                "yaw_system_deviation_limit": 15.0 # Degrees before automatic realigning
            },
            "hydro": {
                "min_reservoir_level": 15.0,     # % safety margin for environmental flow and pressure
                "max_reservoir_level": 95.0,     # % flood control threshold (requires spillway opening)
                "min_environmental_flow": 50.0,  # m3/s equivalent dispatch (~10% cap)
                "siltation_risk_level": 25.0     # % low water level warning
            },
            "curtailment": {
                "overgeneration_trigger": 0.95, # 95% of grid capacity
                "negative_price_curtailment": True, # curtail if electricity price goes negative
                "priority_list": ["solar", "wind", "hydro"] # order of curtailment (curtail solar first, hydro last)
            },
            "grid_code": {
                "voltage_tolerance": 0.05, # +/- 5% nominal voltage
                "frequency_tolerance": 0.02, # +/- 2% nominal frequency (49-51 Hz / 59-61 Hz)
                "maximum_ramp_rate": 0.15, # Max 15% generation change per minute
                "power_factor_target": 0.95 # Lagging/Leading
            },
            "dispatch_standards": {
                "base_load_priority": "hydro", # Hydro is highly stable and adjustable
                "intermittent_backup": "battery", # Battery handles solar/wind ramp changes
                "spinning_reserve_ratio": 0.10 # 10% spinning reserve required
            },
            "carbon_guidelines": {
                "grid_average_intensity": 450.0, # g CO2/kWh
                "solar_offset_factor": 450.0,   # g CO2 saved per kWh solar
                "wind_offset_factor": 450.0,    # g CO2 saved per kWh wind
                "hydro_offset_factor": 450.0    # g CO2 saved per kWh hydro
            }
        }

    def get_rules(self, asset_type: str = None):
        """
        Retrieves rules. If asset_type is provided, returns subset.
        """
        if asset_type:
            return self.rules.get(asset_type, {})
        return self.rules

    def check_compliance(self, solar_forecast, wind_forecast, hydro_forecast, reservoir_level, wind_speed):
        """
        Performs grid code and turbine safety checks based on current forecast.
        Returns a list of warnings or alarms.
        """
        warnings = []
        
        # Wind limits
        if wind_speed >= self.rules["wind"]["cut_out_speed"]:
            warnings.append({
                "severity": "CRITICAL",
                "asset": "wind",
                "message": f"Storm cut-out active! Wind speed ({wind_speed} m/s) exceeds safety limit ({self.rules['wind']['cut_out_speed']} m/s). Turbines must feather blades and shut down."
            })
        elif wind_speed >= self.rules["wind"]["high_wind_curtailment_limit"]:
            warnings.append({
                "severity": "WARNING",
                "asset": "wind",
                "message": f"High wind curtailment active. Wind speed ({wind_speed} m/s) requires pitch control to prevent generator overload."
            })
            
        # Hydro limits
        if reservoir_level <= self.rules["hydro"]["min_reservoir_level"]:
            warnings.append({
                "severity": "CRITICAL",
                "asset": "hydro",
                "message": f"Reservoir level at critical low ({reservoir_level}%). Hydro generation must be restricted to environmental minimum flow."
            })
        elif reservoir_level >= self.rules["hydro"]["max_reservoir_level"]:
            warnings.append({
                "severity": "WARNING",
                "asset": "hydro",
                "message": f"Reservoir level high ({reservoir_level}%). Spillway operation likely. Hydro generation should be maximized to drawdown level."
            })
            
        return warnings
