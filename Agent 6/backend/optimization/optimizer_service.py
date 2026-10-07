import numpy as np
from typing import Dict, Any, Tuple
from backend.knowledge.knowledge_base import knowledge_base

class OptimizerService:
    def __init__(self):
        pass

    def optimize_dispatch(
        self,
        demand_kw: float,
        solar_gen_kw: float,
        battery_soc: float,
        battery_capacity_kwh: float,
        buy_price: float,
        sell_price: float,
        weights: Dict[str, float] = None
    ) -> Tuple[float, float, float]:
        """
        Solves multi-objective optimization for battery dispatch.
        Returns:
            optimal_battery_power_kw: negative for charge, positive for discharge, 0 for idle.
            expected_cost: Net monetary cost of operation ($).
            carbon_kg: Predicted carbon output (kg).
        """
        # Load constraints
        constraints = knowledge_base.optimization_constraints
        bat_con = constraints.get("battery_constraints", {})
        grid_con = constraints.get("grid_constraints", {})
        default_weights = constraints.get("optimization_weights", {})
        
        active_weights = weights or default_weights
        
        min_soc = bat_con.get("min_soc", 0.15)
        max_soc = bat_con.get("max_soc", 0.95)
        deg_factor = bat_con.get("degradation_cost_factor_per_cycle_kwh", 0.04)
        eff_charge = bat_con.get("efficiency_charge", 0.92)
        eff_discharge = bat_con.get("efficiency_discharge", 0.92)
        
        max_charge = 150.0      # Max battery charge rate kW
        max_discharge = 150.0   # Max battery discharge rate kW
        
        max_grid_import = grid_con.get("max_import_limit_kw", 2500.0)
        max_grid_export = grid_con.get("max_export_limit_kw", 1500.0)
        carbon_intensity = knowledge_base.carbon_rules.get("grid_carbon_intensity_kg_co2_per_kwh", 0.385)
        
        # Grid search over possible battery dispatch power settings
        # negative means charging, positive means discharging
        dispatch_choices = np.linspace(-max_charge, max_discharge, 61) # 5kW increments
        
        best_score = float("inf")
        optimal_dispatch = 0.0
        best_cost = 0.0
        best_carbon = 0.0
        
        for power in dispatch_choices:
            # Check physical battery state constraints
            new_soc = battery_soc
            if power < 0: # charging
                # energy entering battery in 1 hour (since hourly resolution)
                energy_added = abs(power) * eff_charge
                new_soc = battery_soc + (energy_added / battery_capacity_kwh)
                if new_soc > max_soc:
                    continue # Exceeds capacity
            elif power > 0: # discharging
                energy_removed = power / eff_discharge
                new_soc = battery_soc - (energy_removed / battery_capacity_kwh)
                if new_soc < min_soc:
                    continue # Too depleted
                    
            # Check Grid stability limits
            # Grid Import = Demand - Solar + Battery Charge (or - Battery Discharge)
            # power is positive for discharge (helper to demand), negative for charge (acts as load)
            net_load = demand_kw - solar_gen_kw - power
            
            # Constraints checking
            if net_load > max_grid_import:
                continue # Exceeds transformer import capacity
            if net_load < -max_grid_export:
                continue # Exceeds export limit
                
            # Objective 1: Operational Cost
            if net_load >= 0:
                cost = net_load * buy_price
            else:
                cost = net_load * sell_price # negative cost (revenue)
                
            # Objective 2: Battery Degradation
            degradation = abs(power) * deg_factor
            
            # Objective 3: Carbon Impact
            if net_load >= 0:
                carbon = net_load * carbon_intensity
            else:
                carbon = 0.0 # Selling energy doesn't count as carbon emitter (renewable surplus)
                
            # Objective 4: Grid Stability Penalty
            stability_penalty = 0.0
            if net_load > max_grid_import * 0.8:
                stability_penalty = (net_load - max_grid_import * 0.8) * 1.5
                
            # Compute weighted objective score
            score = (
                active_weights.get("operational_cost", 1.0) * cost +
                active_weights.get("battery_degradation", 0.6) * degradation +
                active_weights.get("carbon_emissions", 0.4) * carbon +
                active_weights.get("grid_stability_penalty", 0.8) * stability_penalty
            )
            
            if score < best_score:
                best_score = score
                optimal_dispatch = power
                best_cost = cost
                best_carbon = carbon
                
        return float(optimal_dispatch), float(best_cost), float(best_carbon)

# Global singleton
optimizer_service = OptimizerService()
