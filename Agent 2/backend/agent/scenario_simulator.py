import os
import json
import pandas as pd
import google.generativeai as genai
from backend.ml.feature_engineering import engineer_features

class ScenarioSimulatorEngine:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.has_key = len(self.api_key.strip()) > 0
        if self.has_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")

    def simulate(self, current_weather: dict, solar_model, wind_model, hydro_model, 
                 solar_features, wind_features, hydro_features,
                 adjustments: dict) -> dict:
        """
        Applies modifiers, runs model predictions, and asks Gemini to assess grid impact.
        
        adjustments: {
            "cloud_cover_add": float (e.g. 0.3),
            "wind_speed_mult": float (e.g. 0.8),
            "reservoir_level_mult": float (e.g. 0.75),
            "grid_demand_mult": float (e.g. 1.2)
        }
        """
        # 1. Clone & adjust weather
        sim_weather = current_weather.copy()
        
        sim_weather["cloud_cover"] = max(0.0, min(1.0, sim_weather.get("cloud_cover", 0.2) + adjustments.get("cloud_cover_add", 0.0)))
        sim_weather["wind_speed"] = max(0.0, sim_weather.get("wind_speed", 5.0) * adjustments.get("wind_speed_mult", 1.0))
        sim_weather["reservoir_level"] = max(0.0, min(100.0, sim_weather.get("reservoir_level", 80.0) * adjustments.get("reservoir_level_mult", 1.0)))
        sim_weather["grid_demand"] = max(0.0, sim_weather.get("grid_demand", 15000.0) * adjustments.get("grid_demand_mult", 1.0))
        
        # 2. Run feature engineering
        df = pd.DataFrame([sim_weather])
        # Add basic dummy lags so feature engineering doesn't fail
        for col in ['solar_irradiance', 'wind_speed', 'reservoir_level']:
            df[f'{col}_lag_1h'] = df[col]
            df[f'{col}_lag_2h'] = df[col]
            df[f'{col}_lag_24h'] = df[col]
            df[f'{col}_roll_mean_3h'] = df[col]
            df[f'{col}_roll_std_3h'] = 0.0
            df[f'{col}_roll_mean_6h'] = df[col]
            df[f'{col}_roll_mean_24h'] = df[col]
            
        df_eng = engineer_features(df)
        
        # 3. Model predictions
        solar_pred = 0.0
        if solar_model:
            solar_pred = float(solar_model.predict(df_eng[solar_features])[0])
            solar_pred = max(0.0, solar_pred)
            if df_eng["solar_zenith_angle"].values[0] >= 90.0:
                solar_pred = 0.0
                
        wind_pred = 0.0
        if wind_model:
            wind_pred = float(wind_model.predict(df_eng[wind_features])[0])
            wind_pred = max(0.0, wind_pred)
            
        hydro_pred = 0.0
        if hydro_model:
            hydro_pred = float(hydro_model.predict(df_eng[hydro_features])[0])
            hydro_pred = max(0.0, hydro_pred)
            
        total_renewable = solar_pred + wind_pred + hydro_pred
        coverage = (total_renewable / max(1.0, sim_weather["grid_demand"])) * 100.0
        
        # 4. Get Gemini analysis or fallback
        context = {
            "adjustments": adjustments,
            "simulated_weather": sim_weather,
            "predictions": {
                "solar": solar_pred,
                "wind": wind_pred,
                "hydro": hydro_pred,
                "total": total_renewable,
                "coverage_pct": coverage
            }
        }
        
        if self.has_key:
            try:
                prompt = self._build_prompt(context)
                response = self.model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                res = json.loads(response.text.strip())
                res["predictions"] = context["predictions"]
                res["weather"] = sim_weather
                return res
            except Exception as e:
                print(f"[SCENARIO SIM] Gemini error: {e}. Using fallback.")
                
        return self._generate_simulated_impact(context)

    def _build_prompt(self, context: dict) -> str:
        return f"""
        You are a Senior Smart Grid Stability Analyst. Analyze the following simulated what-if weather and load metrics and return a JSON impact report.
        
        CONTEXT DATA:
        {json.dumps(context, indent=2)}
        
        Generate a detailed JSON report with the following fields:
        {{
            "generation_impact": "Details about how solar, wind, and hydro levels changed compared to baseline.",
            "battery_impact": "Assess battery thermal and SOC safety margins under this load scenario.",
            "stability_impact": "Evaluate voltage, frequency, and grid capacity margins.",
            "emissions_impact": "Estimate the impact on carbon offset values.",
            "risk_assessment": "List active operational risks (e.g. low spinning reserves, grid overload, black-start)."
        }}
        """

    def _generate_simulated_impact(self, context: dict) -> dict:
        pred = context["predictions"]
        weather = context["simulated_weather"]
        
        gen_imp = (
            f"Simulated Solar: {pred['solar']:.0f} kW, Wind: {pred['wind']:.0f} kW, Hydro: {pred['hydro']:.0f} kW. "
            f"Total renewable coverage stands at {pred['coverage_pct']:.1f}% of modified load."
        )
        
        soc = weather.get("battery_soc", 50)
        if pred["coverage_pct"] < 100:
            batt_imp = f"Battery bank will discharge to cover grid deficit. Target SOC drop-off rate is high."
            stab_imp = "Grid capacity margins restricted. Voltage levels require reactive power compensation from hydro."
            emissions_imp = "Emissions will rise. Grid must spin up thermal backup units to balance the deficit."
            risks = "Deficit operations risk. Acknowledge spinning reserve margin drop-off."
        else:
            batt_imp = f"Surplus of {(pred['total'] - weather['grid_demand'])/1000:.1f} MW available to charge battery storage."
            stab_imp = "Grid stability nominal. Voltage levels secure."
            emissions_imp = "Carbon offset is maximized. Net emissions are zero."
            risks = "No critical risks active. System stable."
            
        return {
            "predictions": pred,
            "weather": weather,
            "generation_impact": gen_imp,
            "battery_impact": batt_imp,
            "stability_impact": stab_imp,
            "emissions_impact": emissions_imp,
            "risk_assessment": risks
        }
