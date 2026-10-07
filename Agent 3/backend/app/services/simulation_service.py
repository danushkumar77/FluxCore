import random
from typing import Dict, Any
from datetime import datetime

class SimulationService:
    async def simulate_scenario(self, scenario: str, container_id: str) -> Dict[str, Any]:
        timestamp = datetime.utcnow().isoformat()
        
        # Scenarios mapping
        # 1. Renewable surplus
        # 2. Renewable shortage
        # 3. Peak demand
        # 4. Battery degradation
        # 5. Cell overheating
        # 6. Grid outage
        # 7. Electricity price spike
        # 8. Emergency reserve activation
        # 9. Equipment failure
        # 10. Extreme weather
        
        response = {
            "scenario": scenario,
            "container_id": container_id,
            "timestamp": timestamp,
            "predicted_response": {},
            "optimized_strategy": "",
            "financial_impact_usd": 0.0,
            "carbon_impact_kg": 0.0,
            "battery_wear_pct": 0.0,
            "engineering_explanation": "",
            "recommended_action": ""
        }
        
        if scenario == "RENEWABLE_SURPLUS":
            response.update({
                "optimized_strategy": "Plan A (Renewable Surplus Storage)",
                "financial_impact_usd": -12.50, # cost of charging
                "carbon_impact_kg": 150.0, # negative CO2 emissions offset
                "battery_wear_pct": 0.0012,
                "predicted_response": {"soc_delta": "+15%", "temperature_c": "28.5C", "charge_power_kw": "350kW"},
                "engineering_explanation": "Surplus solar output exceeds local grid demand. System charges BESS to absorb peak supply and stabilize local voltage.",
                "recommended_action": "Enable automatic solar tracking charging. Maintain standard 0.5C charge rate."
            })
        elif scenario == "RENEWABLE_SHORTAGE":
            response.update({
                "optimized_strategy": "Plan C (Maintain Emergency Reserve)",
                "financial_impact_usd": 0.0,
                "carbon_impact_kg": 0.0,
                "battery_wear_pct": 0.0001,
                "predicted_response": {"soc_delta": "0%", "temperature_c": "22.1C", "active_power_kw": "0kW (Idle)"},
                "engineering_explanation": "Renewable generation drops. BESS switches to high-efficiency idle state to preserve energy reserves.",
                "recommended_action": "Deactivate arbitrage discharges. Hold SOC above 60% for emergency backup."
            })
        elif scenario == "PEAK_DEMAND":
            response.update({
                "optimized_strategy": "Plan B (Peak Demand Shaving)",
                "financial_impact_usd": 185.20, # Revenue earned
                "carbon_impact_kg": 95.5,
                "battery_wear_pct": 0.0025,
                "predicted_response": {"soc_delta": "-25%", "temperature_c": "38.2C", "discharge_power_kw": "400kW"},
                "engineering_explanation": "Local grid demand peaks. BESS discharges at maximum rate to reduce peak demand charges and lower grid transformer load.",
                "recommended_action": "Set active discharge threshold to site load of 600 kW. Initiate peak discharge cycle."
            })
        elif scenario == "BATTERY_DEGRADATION":
            response.update({
                "optimized_strategy": "Plan D (Thermal Health Preservation)",
                "financial_impact_usd": 15.0,
                "carbon_impact_kg": 10.0,
                "battery_wear_pct": 0.00005,
                "predicted_response": {"soc_delta": "0%", "temperature_c": "21.5C", "charge_rate_limit": "0.1C"},
                "engineering_explanation": "Model predicts accelerated degradation rate. Optimization throttles C-rates to double Remaining Useful Life.",
                "recommended_action": "Restrict charge and discharge C-rates to a maximum of 0.25C until cell resistance stabilizes."
            })
        elif scenario == "CELL_OVERHEATING":
            response.update({
                "optimized_strategy": "Plan D (Thermal Health Preservation) + Emergency Fan Trip",
                "financial_impact_usd": -5.0,
                "carbon_impact_kg": 0.0,
                "battery_wear_pct": 0.0005,
                "predicted_response": {"soc_delta": "0%", "temperature_c": "48.5C (cooling active)", "fan_speed": "100%"},
                "engineering_explanation": "Container thermal sensors report cell temperature at 48.5C. Optimization triggers maximum coolant flow and cuts active power.",
                "recommended_action": "Limit current output to 50A. Inspect liquid cooling pump for air locks or coolant level drops."
            })
        elif scenario == "GRID_OUTAGE":
            response.update({
                "optimized_strategy": "Plan C (Emergency Reserve Activation)",
                "financial_impact_usd": 0.0,
                "carbon_impact_kg": 0.0,
                "battery_wear_pct": 0.0015,
                "predicted_response": {"soc_delta": "-10% per hour", "grid_frequency": "0.0Hz (Isolated)", "active_power_kw": "200kW"},
                "engineering_explanation": "Main feeder grid disconnects. BESS automatically initiates islanding mode to supply backup power to local critical circuits.",
                "recommended_action": "Confirm microgrid circuit breaker state. Coordinate microgrid generation sources (e.g. local solar + diesel backup)."
            })
        elif scenario == "ELECTRICITY_PRICE_SPIKE":
            response.update({
                "optimized_strategy": "Plan E (Energy Arbitrage Trading)",
                "financial_impact_usd": 420.50, # High profit
                "carbon_impact_kg": 120.0,
                "battery_wear_pct": 0.0035,
                "predicted_response": {"soc_delta": "-45%", "temperature_c": "41.2C", "discharge_power_kw": "450kW"},
                "engineering_explanation": "Real-time energy price spikes to $320/MWh. Optimization commands maximum BESS discharge to maximize trading profits.",
                "recommended_action": "Discharge until SOC hits 15%. Liquid cooling system should be kept at max power."
            })
        elif scenario == "EMERGENCY_RESERVE_ACTIVATION":
            response.update({
                "optimized_strategy": "Plan C (Emergency Reserve Lock)",
                "financial_impact_usd": 0.0,
                "carbon_impact_kg": 0.0,
                "battery_wear_pct": 0.0,
                "predicted_response": {"soc_delta": "0%", "temperature_c": "20.5C", "target_soc_lock": "90%"},
                "engineering_explanation": "Grid operator requests ancillary spinning reserve capacity. Battery is locked to 90% SOC to guarantee grid protection.",
                "recommended_action": "Lock SOC to 90% minimum threshold. Block all arbitrage and trading requests."
            })
        elif scenario == "EQUIPMENT_FAILURE":
            response.update({
                "optimized_strategy": "System Isolation (Safety Shutdown)",
                "financial_impact_usd": -50.0,
                "carbon_impact_kg": 0.0,
                "battery_wear_pct": 0.0,
                "predicted_response": {"soc_delta": "0%", "temperature_c": "21.0C", "breaker_status": "TRIPPED"},
                "engineering_explanation": "Inverter phase fault or contactor malfunction detected. Local safety loop trips primary BESS breakers to isolate the system.",
                "recommended_action": "Dispatch maintenance technician to check inverter cabinet contactors and IGBT semiconductor fuses."
            })
        elif scenario == "EXTREME_WEATHER":
            response.update({
                "optimized_strategy": "Plan C (Reserve Lock) + Thermal Protection",
                "financial_impact_usd": -10.0,
                "carbon_impact_kg": 0.0,
                "battery_wear_pct": 0.0001,
                "predicted_response": {"soc_delta": "+5%", "temperature_c": "24.5C", "heating_loop": "ACTIVE"},
                "engineering_explanation": "Ambient temperature falls to -10C. BESS activates container internal heating loops to maintain cells above freezing.",
                "recommended_action": "Enable container thermal insulation seals. Maintain standard heating loop setpoint at 15C."
            })
            
        return response
