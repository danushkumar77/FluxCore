import uuid
from typing import List, Dict, Any
from datetime import datetime
from backend.app.domain.entities import BatteryTelemetry, BatteryDecision

class PlannerService:
    async def generate_strategies(self, telemetry: BatteryTelemetry, correlation_id: str) -> List[Dict[str, Any]]:
        # Read parameters from current telemetry
        soc = telemetry.soc
        temp = telemetry.avg_cell_temp
        solar = telemetry.solar_forecast_kw
        demand = telemetry.demand_forecast_kw
        price = telemetry.market_price_usd  # $/MWh
        
        # Calculate dynamic parameters based on grid and battery states
        plan_a = self._generate_plan_a(soc, solar, price, temp)
        plan_b = self._generate_plan_b(soc, demand, price, temp)
        plan_c = self._generate_plan_c(soc, price, temp)
        plan_d = self._generate_plan_d(soc, temp)
        plan_e = self._generate_plan_e(soc, price, temp)
        
        return [plan_a, plan_b, plan_c, plan_d, plan_e]

    def _generate_plan_a(self, soc: float, solar: float, price: float, temp: float) -> Dict[str, Any]:
        # Plan A: Charge BESS from renewable surplus
        solar_factor = min(1.0, solar / 500.0) if solar > 0 else 0.0
        charge_power = min(400.0, (100.0 - soc) * 5.0) * (0.3 + 0.7 * solar_factor)
        
        cost = (charge_power / 1000.0) * (price * 0.9)  # slightly cheaper solar tariff
        revenue = 0.0
        degradation = 0.002 * (charge_power / 400.0)
        
        # Adjust confidence based on solar surplus presence
        confidence = 0.90 if solar > 100.0 else 0.40
        if temp > 45.0:
            confidence *= 0.5
            
        return {
            "plan_id": "PLAN-A",
            "name": "Renewable Surplus Storage",
            "action": "CHARGE",
            "power_kw": float(charge_power),
            "expected_cost": float(cost),
            "expected_revenue": float(revenue),
            "battery_degradation": float(degradation),
            "renewable_utilization": float(85.0 + 15.0 * solar_factor if solar > 0 else 0.0),
            "carbon_reduction": float(0.42 * charge_power if solar > 0 else 0.0),  # kg CO2 offset
            "expected_grid_impact": 0.85,  # mitigates local solar overvoltage
            "confidence_score": float(confidence),
            "engineering_explanation": f"Charging BESS at {charge_power:.1f} kW using clean solar generator energy. Captures surplus solar forecast ({solar:.1f} kW) and mitigates PV curtailment.",
            "rollback_conditions": "Cancel if cell temperature exceeds 45C or grid frequency drops below 59.8Hz."
        }

    def _generate_plan_b(self, soc: float, demand: float, price: float, temp: float) -> Dict[str, Any]:
        # Plan B: Discharge during peak demand
        discharge_power = min(400.0, (soc - 10.0) * 5.0) if soc > 10.0 else 0.0
        
        cost = 0.0
        revenue = (discharge_power / 1000.0) * price
        degradation = 0.003 * (discharge_power / 400.0)
        
        # High confidence when price is high and battery has SOC
        confidence = 0.85 if price > 100.0 and soc > 30.0 else 0.30
        if temp > 45.0:
            confidence *= 0.4
            
        return {
            "plan_id": "PLAN-B",
            "name": "Peak Demand Shaving",
            "action": "DISCHARGE",
            "power_kw": float(discharge_power),
            "expected_cost": float(cost),
            "expected_revenue": float(revenue),
            "battery_degradation": float(degradation),
            "renewable_utilization": 0.0,
            "carbon_reduction": float(0.28 * discharge_power),  # kg CO2 offset by displacing peaker plants
            "expected_grid_impact": 0.90,  # reduces transformer stress
            "confidence_score": float(confidence),
            "engineering_explanation": f"Discharging BESS at {discharge_power:.1f} kW during high electricity tariff (${price:.2f}/MWh) to support peak local load demand.",
            "rollback_conditions": "Rollback if SOC drops below 10% or cell temperature climbs above 48C."
        }

    def _generate_plan_c(self, soc: float, price: float, temp: float) -> Dict[str, Any]:
        # Plan C: Maintain emergency reserve
        charge_power = 0.0
        if soc < 90.0:
            charge_power = min(150.0, (90.0 - soc) * 4.0)
            
        cost = (charge_power / 1000.0) * price
        degradation = 0.0005
        
        confidence = 0.95
        
        return {
            "plan_id": "PLAN-C",
            "name": "Emergency Reserve Lock",
            "action": "CHARGE" if charge_power > 0 else "IDLE",
            "power_kw": float(charge_power),
            "expected_cost": float(cost),
            "expected_revenue": 0.0,
            "battery_degradation": float(degradation),
            "renewable_utilization": 10.0,
            "carbon_reduction": 0.0,
            "expected_grid_impact": 0.95,  # high reliability index
            "confidence_score": float(confidence),
            "engineering_explanation": f"Locking battery capacity to 90% SOC reserve. Ensuring emergency backup is available for potential grid disturbances or critical outages.",
            "rollback_conditions": "Force discharge only if authorized by network operator during catastrophic grid failure."
        }

    def _generate_plan_d(self, soc: float, temp: float) -> Dict[str, Any]:
        # Plan D: Reduce charging rate to protect battery health
        charge_power = min(50.0, (95.0 - soc) * 1.0) if soc < 95.0 else 0.0
        
        cost = 0.0
        degradation = 0.0001
        
        confidence = 0.90 if temp > 40.0 else 0.50
        
        return {
            "plan_id": "PLAN-D",
            "name": "Thermal Health Preservation",
            "action": "CHARGE" if charge_power > 0 else "IDLE",
            "power_kw": float(charge_power),
            "expected_cost": float(cost),
            "expected_revenue": 0.0,
            "battery_degradation": float(degradation),
            "renewable_utilization": 20.0,
            "carbon_reduction": 0.0,
            "expected_grid_impact": 0.20,  # neutral load profile
            "confidence_score": float(confidence),
            "engineering_explanation": f"Restricting maximum power transfer to {charge_power:.1f} kW (0.05C) due to thermal warning conditions ({temp:.1f}C) to preserve battery SOH.",
            "rollback_conditions": "Resume standard charging strategy once module temperature falls below 35C."
        }

    def _generate_plan_e(self, soc: float, price: float, temp: float) -> Dict[str, Any]:
        # Plan E: Electricity Market Arbitrage Trading
        action = "IDLE"
        power = 0.0
        cost = 0.0
        revenue = 0.0
        
        if price < 30.0 and soc < 90.0:
            action = "CHARGE"
            power = min(400.0, (90.0 - soc) * 5.0)
            cost = (power / 1000.0) * price
        elif price > 150.0 and soc > 20.0:
            action = "DISCHARGE"
            power = min(400.0, (soc - 20.0) * 5.0)
            revenue = (power / 1000.0) * price
            
        degradation = 0.004 * (power / 400.0) if power > 0 else 0.0002
        confidence = 0.80 if abs(price - 90) > 60 else 0.40
        if temp > 45.0:
            confidence *= 0.3
            
        return {
            "plan_id": "PLAN-E",
            "name": "Energy Arbitrage Trading",
            "action": action,
            "power_kw": float(power),
            "expected_cost": float(cost),
            "expected_revenue": float(revenue),
            "battery_degradation": float(degradation),
            "renewable_utilization": 30.0 if action == "CHARGE" else 0.0,
            "carbon_reduction": float(0.12 * power) if action == "DISCHARGE" else 0.0,
            "expected_grid_impact": 0.50,
            "confidence_score": float(confidence),
            "engineering_explanation": f"Participating in grid energy arbitrage trading. Decision: {action} BESS with {power:.1f} kW because market electricity tariff is ${price:.2f}/MWh.",
            "rollback_conditions": "Abort trading if market price volatility settles or battery degradation exceeds wear budget."
        }
