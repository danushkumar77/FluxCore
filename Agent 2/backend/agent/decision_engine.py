import json
import numpy as np
from backend.agent.knowledge_engine import KnowledgeEngine

class DecisionEngine:
    def __init__(self, knowledge_engine: KnowledgeEngine):
        self.knowledge = knowledge_engine

    def evaluate_plans(self, weather_data: dict, forecasts: dict) -> dict:
        """
        Evaluates Plans A to F based on current weather, forecast generation, battery SoC,
        and electricity prices.
        
        weather_data fields:
            solar_irradiance, cloud_cover, wind_speed, temperature, battery_soc,
            grid_demand, electricity_price, reservoir_level, rainfall
        forecasts fields:
            solar_generation, wind_generation, hydro_generation
        """
        battery_soc = weather_data.get("battery_soc", 50.0)
        grid_demand = weather_data.get("grid_demand", 15000.0)
        price = weather_data.get("electricity_price", 40.0)
        reservoir_level = weather_data.get("reservoir_level", 80.0)
        wind_speed = weather_data.get("wind_speed", 5.0)
        
        solar_gen = forecasts.get("solar_generation", 0.0)
        wind_gen = forecasts.get("wind_generation", 0.0)
        hydro_gen = forecasts.get("hydro_generation", 0.0)
        total_gen = solar_gen + wind_gen + hydro_gen
        
        surplus = total_gen - grid_demand
        
        # Base Evaluation Pillars
        # 1. Cost (High score = low net operational cost, high revenue)
        # 2. Carbon (High score = high carbon offset, low emissions)
        # 3. Grid Stability (High score = low ramp fluctuations, high reliability)
        # 4. Battery Health (High score = low depth of discharge, safe temperature charging)
        # 5. Renewable Availability (High score = efficient use of resources, zero curtailment)

        plans = {}
        
        # PLAN A: Prioritize Solar (Maximize solar output, curtail others if needed)
        plan_a_avail = 95.0 if solar_gen > 1000 else 50.0
        plan_a_carbon = 95.0 if solar_gen > 2000 else 60.0
        plan_a_stability = 75.0 - (10.0 if weather_data.get("cloud_cover", 0.2) > 0.5 else 0.0)
        plan_a_battery = 85.0
        plan_a_cost = 80.0 + (price / 10.0) if solar_gen > 1000 else 60.0
        
        plans["Plan A (Prioritize Solar)"] = {
            "scores": {
                "Cost": round(plan_a_cost, 1),
                "Carbon": round(plan_a_carbon, 1),
                "Stability": round(plan_a_stability, 1),
                "Battery": round(plan_a_battery, 1),
                "Availability": round(plan_a_avail, 1)
            },
            "recommendations": ["Increase solar dispatch to maximum limits", "Adjust solar inverter reactive power to support local voltage"],
            "description": "Prioritizes clean solar energy, maximizing immediate solar dispatch and reducing thermal generation base loads."
        }
        
        # PLAN B: Prioritize Wind (Maximize wind turbine dispatch)
        plan_b_avail = 95.0 if wind_gen > 1000 else 50.0
        plan_b_carbon = 95.0 if wind_gen > 2000 else 60.0
        plan_b_stability = 70.0 if wind_speed > 15 else 80.0 # wind variability drops stability in high winds
        plan_b_battery = 85.0
        plan_b_cost = 82.0 + (price / 12.0) if wind_gen > 1000 else 60.0
        
        plans["Plan B (Prioritize Wind)"] = {
            "scores": {
                "Cost": round(plan_b_cost, 1),
                "Carbon": round(plan_b_carbon, 1),
                "Stability": round(plan_b_stability, 1),
                "Battery": round(plan_b_battery, 1),
                "Availability": round(plan_b_avail, 1)
            },
            "recommendations": ["Maximize wind turbine dispatch", "Enable active blade pitch control to handle wind gusts"],
            "description": "Prioritizes aerodynamic wind generation, capitalizing on high wind speeds to displace grid base generation."
        }

        # PLAN C: Prioritize Hydro (Use Hydro as peaker / base stabilizer)
        plan_c_avail = 90.0
        plan_c_carbon = 90.0
        plan_c_stability = 98.0 # Hydro is highly stable and provides black start/spinning reserves
        plan_c_battery = 85.0
        # If reservoir is low, cost of running hydro is high (preserve water)
        plan_c_cost = 85.0 if reservoir_level > 50 else 40.0
        
        plans["Plan C (Prioritize Hydro)"] = {
            "scores": {
                "Cost": round(plan_c_cost, 1),
                "Carbon": round(plan_c_carbon, 1),
                "Stability": round(plan_c_stability, 1),
                "Battery": round(plan_c_battery, 1),
                "Availability": round(plan_c_avail, 1)
            },
            "recommendations": ["Increase hydro dispatch to match load fluctuations", "Regulate water flow to support grid frequency"],
            "description": "Prioritizes dispatchable hydro power, using hydro turbines to stabilize load ramps and secure grid frequency."
        }

        # PLAN D: Charge Battery (Divert renewable power to battery storage)
        # Highly valuable when we have surplus or prices are low.
        is_charging_optimal = surplus > 0 or price < 30
        plan_d_avail = 95.0 if surplus > 0 else 60.0
        plan_d_carbon = 90.0 if surplus > 0 else 50.0
        plan_d_stability = 90.0 # absorbing surplus protects the grid from overvoltage
        # Avoid charging if battery SoC is already high
        plan_d_battery = np.clip(100.0 - (battery_soc - 50.0) * 1.5, 20.0, 95.0)
        plan_d_cost = 90.0 if is_charging_optimal else 40.0
        
        plans["Plan D (Charge Battery)"] = {
            "scores": {
                "Cost": round(plan_d_cost, 1),
                "Carbon": round(plan_d_carbon, 1),
                "Stability": round(plan_d_stability, 1),
                "Battery": round(plan_d_battery, 1),
                "Availability": round(plan_d_avail, 1)
            },
            "recommendations": ["Charge battery bank using excess generation", "Set battery charge rate to optimal C-rate to limit heating"],
            "description": "Directs surplus renewable power or low-cost grid power into chemical storage to support future demand peaks."
        }

        # PLAN E: Store Surplus Energy (thermal/mechanical storage)
        plan_e_avail = 95.0 if surplus > 0 else 40.0
        plan_e_carbon = 85.0 if surplus > 0 else 50.0
        plan_e_stability = 92.0
        plan_e_battery = 95.0 # does not stress the main battery
        plan_e_cost = 85.0 if surplus > 500 else 50.0
        
        plans["Plan E (Store Surplus Energy)"] = {
            "scores": {
                "Cost": round(plan_e_cost, 1),
                "Carbon": round(plan_e_carbon, 1),
                "Stability": round(plan_e_stability, 1),
                "Battery": round(plan_e_battery, 1),
                "Availability": round(plan_e_avail, 1)
            },
            "recommendations": ["Direct surplus energy to thermal storage", "Enable mechanical pump hydro backup systems if available"],
            "description": "Diverts excess generation into alternative storage assets (e.g., pumped-hydro or thermal storage vaults) to prevent curtailment."
        }

        # PLAN F: Sell Excess Power (Export electricity to external grids)
        # Highly valuable when prices are high and generation is high.
        is_selling_optimal = surplus > 0 and price > 60
        plan_f_avail = 80.0
        plan_f_carbon = 90.0
        plan_f_stability = 75.0 if surplus > 3000 else 85.0 # high power transfer on lines reduces security margins
        plan_f_battery = 85.0
        plan_f_cost = 95.0 if is_selling_optimal else 50.0
        
        plans["Plan F (Sell Excess Power)"] = {
            "scores": {
                "Cost": round(plan_f_cost, 1),
                "Carbon": round(plan_f_carbon, 1),
                "Stability": round(plan_f_stability, 1),
                "Battery": round(plan_f_battery, 1),
                "Availability": round(plan_f_avail, 1)
            },
            "recommendations": ["Initiate intertie wholesale power sales", "Submit dispatch bid schedule to external transmission operators"],
            "description": "Exports surplus renewable power to adjacent interconnect grids, capturing financial arbitrage opportunities."
        }
        
        # Calculate overall score for each plan
        # Weights: Cost (0.25), Carbon (0.25), Stability (0.25), Battery (0.10), Availability (0.15)
        best_score = -1
        optimal_plan = ""
        
        for name, details in plans.items():
            scores = details["scores"]
            overall = (
                scores["Cost"] * 0.25 +
                scores["Carbon"] * 0.25 +
                scores["Stability"] * 0.25 +
                scores["Battery"] * 0.10 +
                scores["Availability"] * 0.15
            )
            details["overall_score"] = round(overall, 1)
            
            if overall > best_score:
                best_score = overall
                optimal_plan = name
                
        # Build explanation of why selected
        optimal_details = plans[optimal_plan]
        why = ""
        if optimal_plan == "Plan A (Prioritize Solar)":
            why = "Abundant solar irradiance guarantees maximum zero-carbon energy output with low operational cost and nominal grid risk."
        elif optimal_plan == "Plan B (Prioritize Wind)":
            why = "Strong wind currents are available to cover load demands at high operational efficiency and excellent financial return."
        elif optimal_plan == "Plan C (Prioritize Hydro)":
            why = "Intermittent resources are insufficient or grid stability limits require the use of dispatchable hydro generation to secure line frequency."
        elif optimal_plan == "Plan D (Charge Battery)":
            why = "Surplus renewable energy is available while grid prices are low, making chemical storage the optimal strategy to maximize future revenue."
        elif optimal_plan == "Plan E (Store Surplus Energy)":
            why = "Substantial surplus energy threatens grid overvoltage. Diverting energy to thermal and mechanical storage protects transmission equipment."
        else:
            why = "Market prices are extremely favorable with local generation exceeding grid demand. Exporting power yields high net financial gains."

        return {
            "plans": plans,
            "optimal_strategy": {
                "name": optimal_plan,
                "overall_score": best_score,
                "scores": optimal_details["scores"],
                "recommendations": optimal_details["recommendations"],
                "reasoning": why
            }
        }
