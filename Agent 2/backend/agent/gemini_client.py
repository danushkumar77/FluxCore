import os
import json
import numpy as np
import google.generativeai as genai
from datetime import datetime

class GeminiClient:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.has_key = len(self.api_key.strip()) > 0
        if self.has_key:
            genai.configure(api_key=self.api_key)
            # Use gemini-1.5-flash or gemini-2.0-flash
            self.model = genai.GenerativeModel("gemini-1.5-flash")
            print("[GEMINI CLIENT] API configured successfully.")
        else:
            print("[GEMINI CLIENT] API key not found. Using local rule-based fallback generator.")

    def generate_agent_reasoning(self, weather: dict, forecasts: dict, memory_matches: list, rules: dict, plan_analysis: dict) -> dict:
        """
        Coordinates with Gemini (or fallback engine) to compile engineering explanations,
        select/refine the optimal strategy, and provide operational recommendations.
        """
        if self.has_key:
            try:
                prompt = self._build_prompt(weather, forecasts, memory_matches, rules, plan_analysis)
                response = self.model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                res_text = response.text.strip()
                result = json.loads(res_text)
                # Verify schema
                required_keys = ["solar_explanation", "wind_explanation", "hydro_explanation", "weather_influence", 
                                 "seasonal_influence", "renewable_trends", "reasoning", "confidence", "carbon_reduction", 
                                 "risk", "recommendations"]
                # If some keys are missing, fill them with defaults
                for k in required_keys:
                    if k not in result:
                        result[k] = "Nominal operating levels."
                return result
            except Exception as e:
                print(f"[GEMINI CLIENT] Error during API generation: {e}. Falling back to simulation.")
                
        return self._generate_simulated_reasoning(weather, forecasts, memory_matches, rules, plan_analysis)

    def _build_prompt(self, weather: dict, forecasts: dict, memory_matches: list, rules: dict, plan_analysis: dict) -> str:
        # Construct detailed context
        context = {
            "current_weather": weather,
            "predictions": forecasts,
            "historical_similar_records": memory_matches[:2],
            "grid_rules_and_safety": rules,
            "evaluated_plans": plan_analysis["plans"],
            "tentative_optimal_plan": plan_analysis["optimal_strategy"]
        }
        
        return f"""
        You are an Elite Power Systems Engineer, Renewable Energy Architect, and AI Operator at the FluxCore Smart Grid Control Room.
        Your task is to analyze the following grid state telemetry and forecast models, reason about the results, and return a structured JSON response containing engineering explanations and final dispatch recommendations.
        
        INPUT DATA (JSON Context):
        {json.dumps(context, indent=2)}
        
        Instructions:
        1. Formulate concise, expert-grade engineering explanations (2-3 sentences each) for the solar, wind, and hydro assets. Avoid layperson terms; use industry-standard terminology (e.g. active power curtailment, reactive compensation, solar zenith, cloud attenuation, air density, turbine pitch control, penstock pressure, hydraulic head).
        2. Analyze seasonal and weather impacts on current levels.
        3. Audit the decision plan scoring (Plan A-F) and either confirm the tentative optimal plan or adjust it. Explain exactly WHY this plan is chosen in "reasoning".
        4. Recommend 3-5 concrete dispatch control actions (e.g., 'Increase solar dispatch to 8500 kW', 'Store 1200 kW in Battery Storage to mitigate line overvoltage', 'Initiate Plan D').
        5. Assess overall curtailment risk and estimated grid impact.
        6. Return your evaluation strictly in the following JSON format. Do not add any markdown formatting outside of the JSON block itself.
        
        REQUIRED JSON SCHEMA:
        {{
            "solar_explanation": "Engineering description of why solar power is at this level.",
            "wind_explanation": "Engineering description of why wind power is at this level.",
            "hydro_explanation": "Engineering description of why hydro power is at this level.",
            "weather_influence": "Detailed analysis of current temperature, pressure, cloud cover, and winds.",
            "seasonal_influence": "Seasonal impact analysis.",
            "renewable_trends": "Projection of renewable output over the next several hours.",
            "reasoning": "A final synthesis of why the selected plan was chosen over the other 5 alternatives.",
            "confidence": 92.5,  // float representing percentage confidence [0, 100]
            "carbon_reduction": "High", // String: 'Low', 'Medium', or 'High'
            "risk": "Low", // String: 'Low', 'Medium', or 'High'
            "recommendations": [
                "Control action 1",
                "Control action 2",
                "Control action 3"
            ]
        }}
        """

    def _generate_simulated_reasoning(self, weather: dict, forecasts: dict, memory_matches: list, rules: dict, plan_analysis: dict) -> dict:
        """
        Fallback simulation generator providing rich engineering language.
        """
        sol_f = forecasts.get("solar_generation", 0.0)
        wind_f = forecasts.get("wind_generation", 0.0)
        hyd_f = forecasts.get("hydro_generation", 0.0)
        
        opt_strat = plan_analysis["optimal_strategy"]
        plan_name = opt_strat["name"]
        
        # Solar Explanation
        if sol_f > 7000:
            sol_exp = f"Solar output is operating at peak capacity ({sol_f:.1f} kW) due to high solar elevation and a low zenith angle, coupled with minimal cloud attenuation."
        elif sol_f > 3000:
            sol_exp = f"Solar output is moderate ({sol_f:.1f} kW). Cloud cover ({weather.get('cloud_cover', 0.2)*100:.1f}%) is inducing active scattering, while cell temperature losses are nominal."
        else:
            sol_exp = f"Solar output is minimal or zero ({sol_f:.1f} kW) due to night phase or heavy clouds. Irradiance is below the grid connection threshold."
            
        # Wind Explanation
        if wind_f > 6000:
            wind_exp = f"Wind generation is surging near rated limits ({wind_f:.1f} kW) driven by wind velocities ({weather.get('wind_speed', 5.0):.1f} m/s) aligning with the turbine power curve's peak coefficient."
        elif wind_f > 2000:
            wind_exp = f"Wind output is stable ({wind_f:.1f} kW). Wind velocity is within the standard operating envelope; turbine yaw alignments are locked."
        else:
            wind_exp = f"Wind output is curtailed ({wind_f:.1f} kW). Wind speed is near the cut-in limit of 3 m/s, or shut-down limit of 25 m/s."
            
        # Hydro Explanation
        hyd_exp = f"Hydro dispatch is running at {hyd_f:.1f} kW. Penstock water flows are calibrated based on a reservoir level of {weather.get('reservoir_level', 80.0):.1f}% to meet grid load curves."
        
        # Weather influence
        weather_inf = f"High solar irradiance ({weather.get('solar_irradiance', 500.0)} W/m2) and steady wind vectors ({weather.get('wind_speed', 5.0):.1f} m/s at {weather.get('wind_direction', 180.0)} deg) stabilize renewable inputs. Humidity ({weather.get('humidity', 50.0)}%) is within normal ranges."
        
        # Seasonal influence
        season_map = {1: "Winter", 2: "Spring", 3: "Summer", 4: "Autumn"}
        season_name = season_map.get(weather.get("season", 3), "Summer")
        seasonal_inf = f"Operating in {season_name} profile. Solar daylight hours are extended, while hydro inputs are regulated based on seasonal catchment rates."
        
        # Trends
        trends = f"Expect solar output to decline as solar zenith angle widens toward sunset. Wind speed is projected to rise slightly during evening thermal shifts."
        
        # Confidence
        confidence = 94.5 if not memory_matches else float(np.clip(100.0 - memory_matches[0]["distance"] * 10, 80.0, 99.0))
        
        carbon = "High" if (sol_f + wind_f + hyd_f) > 8000 else "Medium"
        risk = "Low" if weather.get("weather_severity_index", 0.5) < 1.0 else "Medium"
        
        recs = [
            f"Transition grid dispatch strategy to {plan_name}.",
            f"Increase renewable dispatch capacity limits to match forecast outputs.",
            "Initiate active voltage tracking on sub-transmission transformers."
        ]
        if weather.get("battery_soc", 50.0) < 40.0:
            recs.append("Divert surplus generation to charge battery storage to preserve SOC safety bounds.")
            
        return {
            "solar_explanation": sol_exp,
            "wind_explanation": wind_exp,
            "hydro_explanation": hyd_exp,
            "weather_influence": weather_inf,
            "seasonal_influence": seasonal_inf,
            "renewable_trends": trends,
            "reasoning": opt_strat["reasoning"],
            "confidence": round(confidence, 1),
            "carbon_reduction": carbon,
            "risk": risk,
            "recommendations": recs
        }

    def generate_embedding(self, text: str) -> list:
        """
        Generates text embedding vector using models/text-embedding-004.
        """
        if self.has_key:
            try:
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text
                )
                return result.get("embedding", [])
            except Exception as e:
                print(f"[GEMINI CLIENT] Error generating embedding: {e}")
        return []

