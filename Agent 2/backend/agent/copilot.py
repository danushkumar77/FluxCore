import os
import json
import google.generativeai as genai

class AICopilotEngine:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.has_key = len(self.api_key.strip()) > 0
        if self.has_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")

    def chat_response(self, message: str, history: list, last_run: dict, rules: dict) -> str:
        """
        Generates an engineering-grade chat response to the operator's message
        using current forecast, memory search, and active alerts context.
        """
        # Build context
        context = {
            "telemetry": last_run.get("weather", {}),
            "forecasts": {
                "solar": last_run.get("solar_generation", 0),
                "wind": last_run.get("wind_generation", 0),
                "hydro": last_run.get("hydro_generation", 0),
                "total": last_run.get("renewable_generation", 0)
            },
            "active_strategy": last_run.get("decision", {}),
            "goals_compatibility": last_run.get("goal_evaluation", {}),
            "warnings": last_run.get("warnings", []),
            "alerts": last_run.get("alerts", []),
            "reflection": last_run.get("reflection", {}),
            "grid_safety_codes": rules
        }
        
        system_prompt = (
            "You are the Renewable AI Copilot at the FluxCore Smart Grid Control Room. "
            "Your job is to assist the Human Operator in analyzing the grid state, explaining AI decisions, "
            "and proposing scenario mitigations. Use precise, professional power systems engineering language. "
            "Refer to the current state data below to provide accurate answers.\n\n"
            f"CURRENT GRID STATE CONTEXT:\n{json.dumps(context, indent=2)}\n\n"
            "Answer the operator's question directly and concisely."
        )
        
        if self.has_key:
            try:
                # Format history for Gemini API: list of dicts with role and parts
                # e.g., [{'role': 'user', 'parts': [...]}]
                gemini_history = []
                for h in history[-10:]: # keep last 10 exchanges
                    gemini_history.append({
                        "role": "user" if h["sender"] == "operator" else "model",
                        "parts": [h["text"]]
                    })
                
                # Setup chat
                chat = self.model.start_chat(history=gemini_history)
                # Send message with system instructions embedded in context
                # Since gemini-1.5-flash standard chat model doesn't always take system instruction parameter
                # in the same way in all python library versions, we prefix it directly in prompt or system instructions
                response = self.model.generate_content(
                    f"{system_prompt}\n\nOperator Message: {message}"
                )
                return response.text.strip()
            except Exception as e:
                print(f"[COPILOT] Gemini chat error: {e}. Falling back to simulation.")

        return self._generate_simulated_copilot_response(message, context)

    def _generate_simulated_copilot_response(self, message: str, context: dict) -> str:
        msg = message.lower()
        sol = context["forecasts"]["solar"]
        wind = context["forecasts"]["wind"]
        hyd = context["forecasts"]["hydro"]
        plan = context["active_strategy"].get("name", "Plan A")
        soc = context["telemetry"].get("battery_soc", 50.0)
        
        if "why" in msg and "generation" in msg or "decrease" in msg or "drop" in msg:
            return (
                f"Generation output was impacted by current weather vectors. "
                f"Solar is currently dispatching {sol:.0f} kW under {context['telemetry'].get('cloud_cover', 0)*100:.1f}% cloud cover, "
                f"while wind turbine output stands at {wind:.0f} kW due to wind speeds of {context['telemetry'].get('wind_speed', 0):.1f} m/s. "
                f"Hydro is contributing {hyd:.0f} kW to maintain spinning reserves."
            )
        elif "strategy" in msg or "plan" in msg or "selected" in msg:
            return (
                f"The AI Decision Engine selected {plan} because it yielded the highest overall "
                f"compatibility score of {context['goals_compatibility'].get('overall_compatibility', 90)}% across active goals. "
                f"This plan optimizes cost and carbon savings while maintaining grid stability constraints."
            )
        elif "weather" in msg or "happen if" in msg:
            return (
                "An increase in cloud coverage will trigger a solar drop, requiring the battery storage "
                f"bank (currently at {soc:.1f}% SOC) or dispatchable hydro peakers to ramp up to prevent frequency degradation."
            )
        elif "carbon" in msg or "emission" in msg:
            return (
                f"To improve carbon offset indices (currently at {context['reflection'].get('carbon_reduction', 'Nominal')}), "
                "we should prioritize Plan A (Solar) or Plan B (Wind) and increase active power limits, "
                "ensuring battery banks are charged during off-peak surplus to displace thermal base units."
            )
        else:
            return (
                f"Understood. The current operating strategy is {plan}. Grid load demand is {context['telemetry'].get('grid_demand', 15000):.0f} kW "
                f"with total renewable coverage at {context['forecasts']['total']:.0f} kW. Let me know if you require a dispatch change."
            )
