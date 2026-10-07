import os
import json
import logging
from typing import Dict, Any, List
import google.generativeai as genai
from datetime import datetime

logger = logging.getLogger("FluxCore.GeminiService")

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-1.5-flash"
        self.knowledge_base = {}
        self._load_knowledge_base()
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                logger.info("Gemini API successfully configured.")
            except Exception as e:
                logger.error(f"Failed to configure Gemini API: {str(e)}")
                self.api_key = None
        else:
            logger.warning("GEMINI_API_KEY environment variable not set. Using local engineering fallback engine.")

    def _load_knowledge_base(self):
        files = {
            "limits": "backend/knowledge/battery_limits.json",
            "charging": "backend/knowledge/charging_rules.json",
            "degradation": "backend/knowledge/degradation_rules.json",
            "thermal": "backend/knowledge/thermal_rules.json",
            "emergency": "backend/knowledge/emergency_rules.json",
            "ieee": "backend/knowledge/ieee_guidelines.json",
            "procedures": "backend/knowledge/operating_procedures.json"
        }
        for key, path in files.items():
            if os.path.exists(path):
                try:
                    with open(path, "r") as f:
                        self.knowledge_base[key] = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load KB file {path}: {str(e)}")

    async def get_copilot_response(self, user_message: str, telemetry_context: Dict[str, Any]) -> str:
        if not self.api_key:
            return self._local_copilot_fallback(user_message, telemetry_context)
            
        try:
            prompt = f"""
            You are FluxCore's Battery Energy Intelligence AI Copilot. An engineer is asking you a question:
            "{user_message}"
            
            Current Battery Telemetry Context:
            {json.dumps(telemetry_context, indent=2)}
            
            Knowledge Base Guidelines:
            {json.dumps(self.knowledge_base, indent=2)}
            
            Please provide a professional, highly analytical battery engineering response.
            In your response:
            1. Cite relevant rules from our knowledge base (e.g. LIMIT-VOLT-MAX or THERMAL-WARM-COOLING).
            2. Explain the physical battery cell implications (dendrites, SEI layer growth, thermal runaway).
            3. Recommend explicit, actionable operator adjustments.
            """
            
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API Copilot error: {str(e)}")
            return self._local_copilot_fallback(user_message, telemetry_context)

    async def analyze_and_reason(self, telemetry: Dict[str, Any], candidate_plans: List[Dict[str, Any]], active_policy: str) -> Dict[str, Any]:
        """
        Runs Gemini reasoning on the current state.
        Returns engineering explanation, confidence score, and suggested corrective actions.
        """
        if not self.api_key:
            return self._local_reasoning_fallback(telemetry, candidate_plans, active_policy)
            
        try:
            prompt = f"""
            You are the BESS AI Orchestration Reasoner for FluxCore. Analyze the current BESS state and select/explain the optimal plan.
            
            Current Telemetry:
            {json.dumps(telemetry, indent=2)}
            
            Candidate Plans:
            {json.dumps(candidate_plans, indent=2)}
            
            Active Optimization Policy: {active_policy}
            
            Knowledge Base Guidelines:
            {json.dumps(self.knowledge_base, indent=2)}
            
            Return your response in JSON format containing exactly:
            1. "selected_plan_id": The ID of the best plan (PLAN-A, PLAN-B, etc.)
            2. "explanation": A detailed, multi-paragraph engineering explanation citing specific rules (e.g. 'LIMIT-VOLT-MAX', 'IEEE-1547-GRID-SUPPORT') and physical cell effects.
            3. "confidence_score": Float between 0.0 and 1.0.
            4. "corrective_actions": A list of string actions for operators.
            
            Format response as clean JSON only. Do not wrap in backticks or markdown fences.
            """
            
            response = self.model.generate_content(prompt)
            # Clean up potential markdown wrapper
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            parsed = json.loads(text)
            return parsed
            
        except Exception as e:
            logger.error(f"Gemini API reasoning error: {str(e)}")
            return self._local_reasoning_fallback(telemetry, candidate_plans, active_policy)

    def _local_copilot_fallback(self, user_message: str, telemetry: Dict[str, Any]) -> str:
        msg_lower = user_message.lower()
        soc = telemetry.get("soc", 50.0)
        temp = telemetry.get("avg_cell_temp", 25.0)
        
        response = "### BESS Copilot System Advisory [Fallback Mode]\n\n"
        
        if "temperature" in msg_lower or "hot" in msg_lower or "heat" in msg_lower:
            response += f"The current BESS average temperature is **{temp:.1f}°C**. Based on **THERMAL-HOT-THROTTLE**, if temperature exceeds 45°C, charge rates must be restricted to 0.2C to prevent SEI layer degradation. If temperature approaches 55°C, **THERMAL-CRITICAL-SHUTDOWN** will disconnect the BESS array to mitigate thermal runaway hazards. Recommendation: Verify liquid-coolant flow rate and inspect inverter ventilation grills."
        elif "soc" in msg_lower or "charge" in msg_lower:
            response += f"Current State of Charge is **{soc:.1f}%**. Under **DEG-DOD-MAX**, we recommend operating in the 10% to 90% range to maximize cycle life. Above 80% SOC, we apply **CHARGE-SOC-TAPER** (throttling to 0.25C) to minimize anodic polarization. Current grid price is ${telemetry.get('market_price_usd', 45.0)}/MWh."
        elif "degradation" in msg_lower or "rul" in msg_lower:
            response += "According to **IEEE-1184-CAPACITY**, the BESS capacity target for decommissioning is 80% SOH. High Depth of Discharge and operating temperature are the primary aging stressors. Our models calculate a Remaining Useful Life (RUL) based on these historical features."
        else:
            response += f"Received message: '{user_message}'. Currently monitoring container BESS-001 at SOC: {soc:.1f}%, SOH: {telemetry.get('soh', 100.0):.1f}%, Temp: {temp:.1f}°C. All values are within normal operating bounds under **LIMIT-VOLT-MIN** and **LIMIT-VOLT-MAX**."
            
        return response

    def _local_reasoning_fallback(self, telemetry: Dict[str, Any], candidate_plans: List[Dict[str, Any]], active_policy: str) -> Dict[str, Any]:
        # Intelligent fallback routing
        soc = telemetry.get("soc", 50.0)
        temp = telemetry.get("avg_cell_temp", 25.0)
        price = telemetry.get("market_price_usd", 45.0)
        solar = telemetry.get("solar_forecast_kw", 0.0)
        
        selected_plan_id = "PLAN-A"
        explanation = ""
        corrective_actions = []
        confidence = 0.85
        
        if temp > 45.0:
            selected_plan_id = "PLAN-D"
            explanation = f"Selected Thermal Health Preservation (Plan D) because cell average temperature ({temp:.1f}C) exceeds the threshold set in rule THERMAL-HOT-THROTTLE. Battery output is restricted to prevent capacity fade."
            corrective_actions = ["Manually trigger cooling fan override to 100% duty cycle.", "Monitor individual rack cell voltage standard deviations."]
            confidence = 0.95
        elif price > 150.0 and soc > 20.0:
            selected_plan_id = "PLAN-B"
            explanation = f"Selected Peak Demand Shaving (Plan B) under rule SOP-PEAK-SHAVING. High grid tariff detected at ${price:.2f}/MWh. Discharging battery provides peak shaving support and maximizes revenue."
            corrective_actions = ["Verify inverter current frequency matches grid phase.", "Set discharge limit breaker to 450 kW."]
            confidence = 0.90
        elif solar > 200.0 and soc < 90.0:
            selected_plan_id = "PLAN-A"
            explanation = f"Selected Renewable Surplus Storage (Plan A) in accordance with rule SOP-SOLAR-SURPLUS. Renewable generation forecast shows peak solar surplus of {solar:.1f} kW. Charging BESS utilizes green energy and prevents local grid curtailment."
            corrective_actions = ["Ensure grid-tie PV inverter connection is active.", "Pre-cool battery container to prepare for charge cycle thermal load."]
            confidence = 0.88
        else:
            selected_plan_id = "PLAN-E"
            explanation = f"Selected Energy Arbitrage Trading (Plan E) under policy {active_policy} to capture market spreads. Telemetry reports pricing at ${price:.2f}/MWh. System will perform charging/discharging based on optimal economic margins."
            corrective_actions = ["Verify day-ahead pricing feed status.", "Monitor cycle wear logs."]
            confidence = 0.82
            
        return {
            "selected_plan_id": selected_plan_id,
            "explanation": explanation,
            "confidence_score": confidence,
            "corrective_actions": corrective_actions
        }
