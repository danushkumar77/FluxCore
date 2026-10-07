import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.domain.entities.Asset import Asset
from app.domain.aggregates.MaintenancePackage import MaintenancePackage
from app.domain.value_objects.HealthIndex import HealthIndex

class PlanningService:
    def __init__(self, standards_path="backend/knowledge/maintenance_standards.json"):
        self.standards_path = standards_path
        self.standards = {}
        self._load_standards()

    def _load_standards(self):
        if os.path.exists(self.standards_path):
            try:
                with open(self.standards_path, 'r') as f:
                    self.standards = json.load(f)
            except Exception as e:
                print(f"Error loading maintenance standards: {e}")
                self._load_fallback()
        else:
            self._load_fallback()

    def _load_fallback(self):
        self.standards = {
            "safety_protocols": [
                "Verify electrical isolation of the target unit.",
                "Verify grounding lines are securely connected.",
                "Confirm presence of required safety PPE."
            ],
            "required_tools": {
                "Oil Filtration": ["Mobile dehydration trailer", "Oil chemical test kit"],
                "Breaker Refurbish": ["Micro-ohmmeter", "SF6 recovery cart"],
                "Blade Repair": ["Blade inspection drone", "Climbing harness"],
                "Battery Overhaul": ["High voltage insulated toolset", "Thermal imaging camera"]
            },
            "costs": {
                "Oil Filtration": 4500.0,
                "Breaker Refurbish": 7800.0,
                "Blade Repair": 14000.0,
                "Battery Overhaul": 18500.0,
                "Line Sag Tensioning": 6200.0
            }
        }

    def generate_plans_matrix(self, asset: Asset, failure_prob: float, health_score: float) -> List[Dict[str, Any]]:
        # Define costs and downtimes for different options
        # We compute for Plan A, B, C, D, E
        plans = []
        
        # Determine base parameters
        asset_type = asset.type
        criticality = float(asset.criticality_score)
        
        # Standard cost values
        base_cost = 5000.0
        if asset_type == "Transformer":
            base_cost = self.standards.get("costs", {}).get("Oil Filtration", 4500.0)
        elif asset_type == "CircuitBreaker":
            base_cost = self.standards.get("costs", {}).get("Breaker Refurbish", 7800.0)
        elif asset_type == "Renewable":
            base_cost = self.standards.get("costs", {}).get("Blade Repair", 14000.0)
        elif asset_type == "Battery":
            base_cost = self.standards.get("costs", {}).get("Battery Overhaul", 18500.0)
        elif asset_type == "TransmissionLine":
            base_cost = self.standards.get("costs", {}).get("Line Sag Tensioning", 6200.0)

        # Plan A: Immediate maintenance
        plan_a_cost = base_cost * 1.5  # Emergency premium
        plan_a_downtime = 6.0
        # Optimization score = Risk Reduction / (Cost + Downtime)
        # Risk reduction is high, but cost is high.
        risk_reduction_a = failure_prob * 100.0
        score_a = risk_reduction_a * 100.0 / (plan_a_cost + plan_a_downtime * 500) # Downtime cost weight = 500/hr
        
        plans.append({
            "name": "Plan A",
            "title": "Immediate Emergency Maintenance",
            "cost": float(plan_a_cost),
            "downtime_hours": plan_a_downtime,
            "safety_rating": 95.0,
            "reliability_gain": 90.0,
            "grid_stability_impact": -20.0, # Negative impact due to immediate outage
            "optimization_score": float(score_a),
            "action": f"Shutdown asset {asset.id} immediately and dispatch response team."
        })

        # Plan B: Continue operation with active monitoring
        plan_b_cost = 200.0
        plan_b_downtime = 0.0
        risk_reduction_b = 0.0 # No repair done
        score_b = 100.0 - (failure_prob * 100.0) # High score only if failure probability is low
        
        plans.append({
            "name": "Plan B",
            "title": "Continuous Sensor Monitoring",
            "cost": float(plan_b_cost),
            "downtime_hours": plan_b_downtime,
            "safety_rating": 40.0 - (failure_prob * 30.0), # Dropping if unsafe
            "reliability_gain": 0.0,
            "grid_stability_impact": 0.0,
            "optimization_score": float(score_b),
            "action": f"Maintain current operations. Increase WebSocket telemetry polling rate."
        })

        # Plan C: Reduce equipment load
        plan_c_cost = 500.0 # Operational loss cost
        plan_c_downtime = 0.0
        risk_reduction_c = failure_prob * 40.0 # Reduces stress, buying time
        score_c = (risk_reduction_c * 100.0) / (plan_c_cost + 100.0)
        
        plans.append({
            "name": "Plan C",
            "title": "Derated Load Operation",
            "cost": float(plan_c_cost),
            "downtime_hours": plan_c_downtime,
            "safety_rating": 80.0,
            "reliability_gain": 20.0,
            "grid_stability_impact": -35.0, # High negative grid impact due to reduced capacity
            "optimization_score": float(score_c),
            "action": f"Instruct grid dispatcher to limit load capacity on {asset.id} by 40%."
        })

        # Plan D: Schedule planned outage
        plan_d_cost = base_cost
        plan_d_downtime = 4.0
        risk_reduction_d = failure_prob * 90.0
        score_d = (risk_reduction_d * 100.0) / (plan_d_cost + plan_d_downtime * 200) # Planned downtime cost is cheaper
        
        plans.append({
            "name": "Plan D",
            "title": "Scheduled Outage Maintenance",
            "cost": float(plan_d_cost),
            "downtime_hours": plan_d_downtime,
            "safety_rating": 98.0,
            "reliability_gain": 85.0,
            "grid_stability_impact": -10.0, # Planned outage is controlled
            "optimization_score": float(score_d),
            "action": f"Schedule planned isolation and inspection within the next 7 days."
        })

        # Plan E: Replace equipment component
        plan_e_cost = base_cost * 4.0  # Replacement cost
        plan_e_downtime = 12.0
        risk_reduction_e = failure_prob * 98.0
        score_e = (risk_reduction_e * 100.0) / (plan_e_cost + plan_e_downtime * 300)
        
        plans.append({
            "name": "Plan E",
            "title": "Asset Component Replacement",
            "cost": float(plan_e_cost),
            "downtime_hours": plan_e_downtime,
            "safety_rating": 99.0,
            "reliability_gain": 98.0,
            "grid_stability_impact": -15.0,
            "optimization_score": float(score_e),
            "action": f"Order replacement component and schedule full decommissioning overhaul."
        })

        return plans

    def select_optimal_plan(self, plans: List[Dict[str, Any]], status: str) -> Dict[str, Any]:
        # If status is Critical, we force Plan A or Plan C
        if status == "Critical":
            critical_plans = [p for p in plans if p["name"] in ["Plan A", "Plan C", "Plan E"]]
            critical_plans.sort(key=lambda x: x["optimization_score"], reverse=True)
            return critical_plans[0]
            
        # Otherwise sort by optimization score
        sorted_plans = sorted(plans, key=lambda x: x["optimization_score"], reverse=True)
        return sorted_plans[0]

    def create_maintenance_package(self, asset: Asset, plan: Dict[str, Any]) -> MaintenancePackage:
        asset_type = asset.type
        plan_name = plan["name"]
        
        # Select tools and technicians based on standards
        techs = ["Lead Reliability Engineer"]
        tools = ["Standard Diagnostics Kit"]
        
        if asset_type == "Transformer":
            techs = ["HV Transformer Specialist", "Electrical Apprentice"]
            tools = self.standards.get("required_tools", {}).get("Oil Filtration", ["Dehydration kit"])
        elif asset_type == "CircuitBreaker":
            techs = ["Circuit Breaker Specialist", "SF6 Gas technician"]
            tools = self.standards.get("required_tools", {}).get("Breaker Refurbish", ["Micro-ohmmeter"])
        elif asset_type == "Renewable":
            techs = ["Wind Turbine Tech Team"] if getattr(asset, "subtype", "Wind") == "Wind" else ["Solar Inverter Technician"]
            tools = self.standards.get("required_tools", {}).get("Blade Repair", ["Drone controller"])
        elif asset_type == "Battery":
            techs = ["Battery Cell Operations Engineer"]
            tools = self.standards.get("required_tools", {}).get("Battery Overhaul", ["Thermal cameras"])

        # Determine safety checklist
        checklist = list(self.standards.get("safety_protocols", []))
        if asset_type == "Battery":
            checklist.append("Confirm battery charge loop is electrically isolated.")
        elif asset_type == "CircuitBreaker":
            checklist.append("Verify SF6 recovery cylinders are vacuum certified.")

        # Set recommended date based on plan severity
        rec_date = datetime.utcnow()
        if plan_name == "Plan B":
            rec_date += timedelta(days=30)
        elif plan_name == "Plan C":
            rec_date += timedelta(days=2)
        elif plan_name == "Plan D":
            rec_date += timedelta(days=7)
        elif plan_name == "Plan E":
            rec_date += timedelta(days=15)
        else:  # Plan A (Immediate)
            rec_date += timedelta(hours=2)

        return MaintenancePackage(
            package_id=f"MP-{datetime.now().strftime('%m%d%H%M')}",
            asset_id=asset.id,
            selected_plan=plan_name,
            reasoning=plan["action"],
            recommended_date=rec_date,
            estimated_downtime_hours=plan["downtime_hours"],
            estimated_cost=plan["cost"],
            required_technicians=techs,
            required_tools=tools,
            safety_checklist=checklist,
            approved=False,
            status="Pending"
        )
