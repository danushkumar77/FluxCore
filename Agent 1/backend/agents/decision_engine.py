from typing import Dict, Any, List

class DecisionEngine:
    """Evaluates and compares different grid stabilization options (cost, reliability, carbon, battery)."""
    def evaluate_strategies(self, prediction_mw: float, current_load_mw: float, inputs: dict) -> dict:
        battery_soc = inputs.get('battery_soc', 50.0)
        price_mwh = inputs.get('electricity_price', 50.0)
        renewable_pct = inputs.get('renewable_percentage', 30.0)

        # Strategy A: Battery Discharge
        score_a_cost = 85 if battery_soc > 50 else 30
        score_a_reliability = 90 if battery_soc > 40 else 40
        score_a_carbon = 95 # zero direct emissions
        score_a_health = 75 if battery_soc > 30 else 30
        avg_a = (score_a_cost + score_a_reliability + score_a_carbon + score_a_health) / 4

        # Strategy B: Market Purchase
        score_b_cost = 80 if price_mwh < 60 else 40
        score_b_reliability = 85
        score_b_carbon = 40 if renewable_pct < 40 else 70
        score_b_health = 100 # no battery wear
        avg_b = (score_b_cost + score_b_reliability + score_b_carbon + score_b_health) / 4

        # Strategy C: Demand Response
        score_c_cost = 90 # very cheap
        score_c_reliability = 70 # customer compliance variance
        score_c_carbon = 100 # reduces load
        score_c_health = 100
        avg_c = (score_c_cost + score_c_reliability + score_c_carbon + score_c_health) / 4

        strategies = [
            {
                "name": "Option A: Battery Storage Dispatch",
                "cost": score_a_cost,
                "reliability": score_a_reliability,
                "carbon": score_a_carbon,
                "health": score_a_health,
                "overall": round(avg_a, 1),
                "reason": f"Discharge 500 MW from Megapack (SOC {battery_soc}%)."
            },
            {
                "name": "Option B: Spot Market Purchase",
                "cost": score_b_cost,
                "reliability": score_b_reliability,
                "carbon": score_b_carbon,
                "health": score_b_health,
                "overall": round(avg_b, 1),
                "reason": f"Import power from adjacent grid at spot price of ${price_mwh}/MWh."
            },
            {
                "name": "Option C: Demand Response Curtailment",
                "cost": score_c_cost,
                "reliability": score_c_reliability,
                "carbon": score_c_carbon,
                "health": score_c_health,
                "overall": round(avg_c, 1),
                "reason": "Request commercial HVAC limits via digital DR triggers."
            }
        ]

        # Sort by overall score
        strategies.sort(key=lambda x: x["overall"], reverse=True)
        best = strategies[0]

        return {
            "strategies": strategies,
            "chosen_strategy": best["name"],
            "confidence_score": best["overall"],
            "explanation": f"Optimal decision selected: {best['name']} ({best['overall']}% rating). {best['reason']}"
        }

decision_engine = DecisionEngine()
