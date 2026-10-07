class GoalManagementEngine:
    def __init__(self):
        # Operational goals details
        self.goals = {
            "maximize_renewable_utilization": {
                "name": "Maximize Renewable Utilization",
                "description": "Drive net load coverage using renewable sources and decrease reliance on external fossil power.",
                "weight": 0.25
            },
            "reduce_carbon_emissions": {
                "name": "Reduce Carbon Emissions",
                "description": "Displace grid thermal output to maximize net hourly carbon offset savings.",
                "weight": 0.25
            },
            "maintain_grid_stability": {
                "name": "Maintain Grid Stability",
                "description": "Optimize reactive power support and respect maximum line transmission ramp rates.",
                "weight": 0.20
            },
            "protect_battery_health": {
                "name": "Protect Battery Health",
                "description": "Prevent high C-rate cycling and maintain state of charge (SOC) within the 20-80% safety zone.",
                "weight": 0.15
            },
            "minimize_renewable_curtailment": {
                "name": "Minimize Renewable Curtailment",
                "description": "Avoid wasting clean energy by routing excess power to batteries, mechanical storage, or intertie sales.",
                "weight": 0.15
            }
        }

    def evaluate_decision(self, plan_name: str, plan_scores: dict, grid_state: dict) -> dict:
        """
        Audits a selected plan against the active operational goals.
        Returns a compliance breakdown (scores out of 100) and an overall compatibility index.
        """
        soc = grid_state.get("battery_soc", 50.0)
        soh = grid_state.get("battery_soh", 98.0)
        demand = grid_state.get("grid_demand", 15000.0)
        surplus = grid_state.get("surplus", 0.0)
        
        evaluations = {}
        
        # 1. Maximize Renewable Utilization
        # High solar/wind/hydro scores translate to high utilization
        util_score = (plan_scores.get("Availability", 80) + plan_scores.get("Carbon", 80)) / 2.0
        evaluations["maximize_renewable_utilization"] = {
            "score": round(util_score, 1),
            "status": "COMPLIANT" if util_score >= 75 else "MARGINAL"
        }
        
        # 2. Reduce Carbon Emissions
        # Proportional to plan carbon score
        carbon_score = plan_scores.get("Carbon", 85)
        evaluations["reduce_carbon_emissions"] = {
            "score": round(carbon_score, 1),
            "status": "COMPLIANT" if carbon_score >= 80 else "MARGINAL"
        }
        
        # 3. Maintain Grid Stability
        # Plan stability score, penalize if demand is extremely high or battery is low
        stab_base = plan_scores.get("Stability", 85)
        if demand > 18000:
            stab_base -= 10
        if soc < 20:
            stab_base -= 5
        stab_score = max(10, min(100, stab_base))
        evaluations["maintain_grid_stability"] = {
            "score": round(stab_score, 1),
            "status": "COMPLIANT" if stab_score >= 70 else "CRITICAL"
        }
        
        # 4. Protect Battery Health
        # High score if battery is preserved. If we charge battery when SOC is high (>90) or discharge when SOC is low (<15), penalize.
        batt_base = plan_scores.get("Battery", 80)
        if plan_name == "Plan D (Charge Battery)":
            if soc > 85:
                batt_base -= 25 # high state of charge stress
            if soh < 80:
                batt_base -= 15 # degraded cell stress
        elif plan_name == "Plan C (Prioritize Hydro)" or plan_name == "Plan E (Store Surplus Energy)":
            batt_base += 10 # Preserves battery by utilizing alternative resources
            
        batt_score = max(10, min(100, batt_base))
        evaluations["protect_battery_health"] = {
            "score": round(batt_score, 1),
            "status": "COMPLIANT" if batt_score >= 75 else "WARNING"
        }
        
        # 5. Minimize Renewable Curtailment
        # If we have surplus and select Plan E or Plan D (Storage) or Plan F (Sell), we minimize curtailment.
        curt_base = 60.0
        if surplus > 0:
            if "Charge Battery" in plan_name or "Store" in plan_name or "Sell" in plan_name:
                curt_base = 95.0
            else:
                curt_base = 40.0 # wasting clean surplus!
        else:
            curt_base = plan_scores.get("Availability", 80)
            
        curt_score = max(10, min(100, curt_base))
        evaluations["minimize_renewable_curtailment"] = {
            "score": round(curt_score, 1),
            "status": "COMPLIANT" if curt_score >= 70 else "WARNING"
        }
        
        # Calculate weighted compatibility index
        net_compat = sum([evals["score"] * self.goals[g_key]["weight"] for g_key, evals in evaluations.items()])
        
        return {
            "overall_compatibility": round(net_compat, 1),
            "evaluations": evaluations
        }
