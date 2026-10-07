import uuid
from typing import List, Dict, Any, Tuple
from datetime import datetime
from backend.app.domain.entities import BatteryOptimization
from backend.app.domain.interfaces import StrategyRepository
from backend.app.core.event_bus import EventBus, EventContract, event_bus_instance

class OptimizerService:
    def __init__(self, strategy_repo: StrategyRepository, event_bus: EventBus = event_bus_instance):
        self.strategy_repo = strategy_repo
        self.event_bus = event_bus
        
        # Define weights mapping for the different optimization policies
        self.policies = {
            "MIN_COST": {"cost": 0.50, "lifetime": 0.10, "renewables": 0.10, "carbon": 0.10, "grid": 0.10, "confidence": 0.10},
            "MAX_LIFETIME": {"cost": 0.05, "lifetime": 0.60, "renewables": 0.05, "carbon": 0.05, "grid": 0.15, "confidence": 0.10},
            "MAX_RENEWABLES": {"cost": 0.10, "lifetime": 0.10, "renewables": 0.50, "carbon": 0.20, "grid": 0.05, "confidence": 0.05},
            "PEAK_SHAVING": {"cost": 0.25, "lifetime": 0.15, "renewables": 0.05, "carbon": 0.10, "grid": 0.35, "confidence": 0.10},
            "CARBON_REDUCTION": {"cost": 0.05, "lifetime": 0.05, "renewables": 0.30, "carbon": 0.50, "grid": 0.05, "confidence": 0.05},
            "EMERGENCY_RESILIENCE": {"cost": 0.05, "lifetime": 0.15, "renewables": 0.05, "carbon": 0.05, "grid": 0.55, "confidence": 0.15},
            "ENERGY_TRADING": {"cost": 0.60, "lifetime": 0.05, "renewables": 0.05, "carbon": 0.05, "grid": 0.10, "confidence": 0.15},
            "GRID_STABILITY": {"cost": 0.10, "lifetime": 0.15, "renewables": 0.05, "carbon": 0.05, "grid": 0.50, "confidence": 0.15}
        }

    async def optimize(self, strategies: List[Dict[str, Any]], policy_name: str, decision_id: str, correlation_id: str) -> Tuple[Dict[str, Any], BatteryOptimization]:
        if policy_name not in self.policies:
            policy_name = "MIN_COST"
            
        weights = self.policies[policy_name]
        scored_plans = []
        
        for plan in strategies:
            # Normalize metrics between 0 and 1
            # Cost factor: revenue - cost (maximize). Let's map it: higher revenue + lower cost = higher score
            net_profit = plan["expected_revenue"] - plan["expected_cost"]
            cost_score = min(1.0, max(0.0, (net_profit + 50.0) / 200.0))  # normalized scale
            
            # Lifetime score: 1.0 - normalized degradation
            lifetime_score = min(1.0, max(0.0, 1.0 - (plan["battery_degradation"] * 200.0)))
            
            renewables_score = plan["renewable_utilization"] / 100.0
            carbon_score = min(1.0, plan["carbon_reduction"] / 200.0) if plan["carbon_reduction"] > 0 else 0.0
            grid_score = plan["expected_grid_impact"]
            confidence_score = plan["confidence_score"]
            
            # Calculate overall weighted score
            total_score = (
                weights["cost"] * cost_score +
                weights["lifetime"] * lifetime_score +
                weights["renewables"] * renewables_score +
                weights["carbon"] * carbon_score +
                weights["grid"] * grid_score +
                weights["confidence"] * confidence_score
            )
            
            scored_plans.append((plan, total_score, {
                "cost": cost_score,
                "lifetime": lifetime_score,
                "renewables": renewables_score,
                "carbon": carbon_score,
                "grid": grid_score,
                "confidence": confidence_score
            }))
            
        # Select best plan
        scored_plans.sort(key=lambda x: x[1], reverse=True)
        best_plan, best_score, component_scores = scored_plans[0]
        
        # Log and save BESS optimization scores
        opt_record = BatteryOptimization(
            optimization_id=f"OPT-{str(uuid.uuid4())[:8]}",
            decision_id=decision_id,
            timestamp=datetime.utcnow(),
            policy=policy_name,
            weights=weights,
            calculated_scores={p["plan_id"]: float(score) for p, score, _ in scored_plans}
        )
        await self.strategy_repo.save_optimization(opt_record)
        
        # Publish Event
        event = EventContract(
            event_type="battery.optimization.completed",
            correlation_id=correlation_id,
            payload={
                "selected_plan_id": best_plan["plan_id"],
                "policy": policy_name,
                "score": float(best_score),
                "optimization_id": opt_record.optimization_id
            }
        )
        await self.event_bus.publish(event)
        
        return best_plan, opt_record

    def get_policies(self) -> List[str]:
        return list(self.policies.keys())
