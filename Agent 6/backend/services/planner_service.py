import uuid
from typing import Dict, Any, List
from backend.optimization.optimizer_service import optimizer_service
from backend.domain.models import StrategyInfo

class PlannerService:
    def __init__(self):
        pass

    def generate_plans(
        self,
        demand_kw: float,
        solar_gen_kw: float,
        battery_soc: float,
        battery_capacity_kwh: float,
        buy_price: float,
        sell_price: float
    ) -> List[StrategyInfo]:
        """
        Generates Plans A through E by running the optimizer with custom weight profiles.
        """
        plans = []
        
        # --- Plan A: Renewable First ---
        # Focus on consuming local solar, moderate battery wear
        weights_a = {"operational_cost": 0.5, "battery_degradation": 0.3, "carbon_emissions": 1.0, "grid_stability_penalty": 0.5}
        dispatch_a, cost_a, carbon_a = optimizer_service.optimize_dispatch(
            demand_kw, solar_gen_kw, battery_soc, battery_capacity_kwh, buy_price, sell_price, weights_a
        )
        plans.append(StrategyInfo(
            strategy_id=f"plan_a_{uuid.uuid4().hex[:6]}",
            plan_name="Plan A: Renewable First Strategy",
            expected_cost=round(cost_a, 2),
            expected_profit=round(max(0.0, -cost_a), 2),
            battery_impact=round(abs(dispatch_a) * 0.04, 2),
            carbon_impact=round(carbon_a, 2),
            grid_risk=0.15,
            confidence_score=94.0,
            rollback_plan="Disconnect battery dispatch, fallback to local solar tracking."
        ))

        # --- Plan B: Battery Arbitrage ---
        # Focus heavily on minimizing cost, willing to cycle battery
        weights_b = {"operational_cost": 1.5, "battery_degradation": 0.2, "carbon_emissions": 0.2, "grid_stability_penalty": 0.4}
        dispatch_b, cost_b, carbon_b = optimizer_service.optimize_dispatch(
            demand_kw, solar_gen_kw, battery_soc, battery_capacity_kwh, buy_price, sell_price, weights_b
        )
        plans.append(StrategyInfo(
            strategy_id=f"plan_b_{uuid.uuid4().hex[:6]}",
            plan_name="Plan B: Battery Arbitrage Strategy",
            expected_cost=round(cost_b, 2),
            expected_profit=round(max(0.0, -cost_b), 2),
            battery_impact=round(abs(dispatch_b) * 0.05, 2),
            carbon_impact=round(carbon_b, 2),
            grid_risk=0.25,
            confidence_score=90.0,
            rollback_plan="Suspend trading bids; lock battery charge until price stabilizes."
        ))

        # --- Plan C: Peak Demand Reduction ---
        # Focus heavily on capping high demand spikes to avoid demand charges
        weights_c = {"operational_cost": 0.8, "battery_degradation": 0.4, "carbon_emissions": 0.3, "grid_stability_penalty": 2.0}
        dispatch_c, cost_c, carbon_c = optimizer_service.optimize_dispatch(
            demand_kw, solar_gen_kw, battery_soc, battery_capacity_kwh, buy_price, sell_price, weights_c
        )
        plans.append(StrategyInfo(
            strategy_id=f"plan_c_{uuid.uuid4().hex[:6]}",
            plan_name="Plan C: Peak Demand Reduction Strategy",
            expected_cost=round(cost_c, 2),
            expected_profit=round(max(0.0, -cost_c), 2),
            battery_impact=round(abs(dispatch_c) * 0.04, 2),
            carbon_impact=round(carbon_c, 2),
            grid_risk=0.10,
            confidence_score=95.0,
            rollback_plan="Shed non-critical grid loads; lock battery for backup dispatch."
        ))

        # --- Plan D: Carbon Optimization ---
        # Strictly minimize carbon output, willing to accept higher operational cost
        weights_d = {"operational_cost": 0.2, "battery_degradation": 0.2, "carbon_emissions": 2.5, "grid_stability_penalty": 0.5}
        dispatch_d, cost_d, carbon_d = optimizer_service.optimize_dispatch(
            demand_kw, solar_gen_kw, battery_soc, battery_capacity_kwh, buy_price, sell_price, weights_d
        )
        plans.append(StrategyInfo(
            strategy_id=f"plan_d_{uuid.uuid4().hex[:6]}",
            plan_name="Plan D: Carbon Minimization Strategy",
            expected_cost=round(cost_d, 2),
            expected_profit=round(max(0.0, -cost_d), 2),
            battery_impact=round(abs(dispatch_d) * 0.03, 2),
            carbon_impact=round(carbon_d, 2),
            grid_risk=0.20,
            confidence_score=88.0,
            rollback_plan="Revert to default tariff; cancel carbon offset bidding."
        ))

        # --- Plan E: Emergency Reserve ---
        # Maintain battery fullness (low discharge), focus on reliability
        weights_e = {"operational_cost": 0.1, "battery_degradation": 1.0, "carbon_emissions": 0.1, "grid_stability_penalty": 3.0}
        # Force battery to maintain charge by setting high degradation weight + stability
        dispatch_e, cost_e, carbon_e = optimizer_service.optimize_dispatch(
            demand_kw, solar_gen_kw, battery_soc, battery_capacity_kwh, buy_price, sell_price, weights_e
        )
        plans.append(StrategyInfo(
            strategy_id=f"plan_e_{uuid.uuid4().hex[:6]}",
            plan_name="Plan E: Emergency Economic Reserve Strategy",
            expected_cost=round(cost_e, 2),
            expected_profit=round(max(0.0, -cost_e), 2),
            battery_impact=round(abs(dispatch_e) * 0.01, 2),
            carbon_impact=round(carbon_e, 2),
            grid_risk=0.02,
            confidence_score=99.0,
            rollback_plan="Isolate microgrid; trigger generator backup if grid voltage collapses."
        ))

        return plans

# Global singleton
planner_service = PlannerService()
