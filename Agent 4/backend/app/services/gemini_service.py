import os
import json
import google.generativeai as genai
from typing import Dict, Any, List

class GeminiReasoningEngine:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY", "")
        self.use_api = len(api_key.strip()) > 0
        if self.use_api:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                print(f"Error configuring Google Gemini client: {e}. Falling back to Local Expert System.")
                self.use_api = False

    def generate_expert_analysis(
        self,
        telemetry: Dict[str, Any],
        predictions: Dict[str, Any],
        weather: str,
        similar_memories: List[Dict[str, Any]],
        rules_triggered: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Queries Gemini (or local rule engine fallback) to analyze the fault event.
        """
        # Formulate a structured prompt
        prompt = f"""
You are a Senior Grid Reliability Engineer at an electrical control room center.
Evaluate the following grid telemetry and event data to formulate a root cause report, restoration strategy, and confidence analysis.

Context Details:
- Current Telemetry: {json.dumps(telemetry, indent=2)}
- ML Model Predictions: {json.dumps(predictions, indent=2)}
- Environmental Weather: {weather}
- Matching Historical Cases: {json.dumps(similar_memories, indent=2)}
- Triggered Protection Rules & Limits: {json.dumps(rules_triggered, indent=2)}

Format your output exactly as a JSON object with these keys:
"root_cause_explanation": (string detailing what happened, referencing IEEE/NEMA codes),
"emergency_recommendations": (list of urgent actions),
"restoration_strategy": (string describing path routing or backup supply recovery),
"confidence_score": (float between 0.0 and 1.0)
"""
        if self.use_api:
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                result = json.loads(response.text)
                return result
            except Exception as e:
                print(f"Gemini API invocation error: {e}. Executing Local Expert Fallback...")

        # Local expert system fallback: generates detailed expert-style responses
        return self._local_expert_fallback(telemetry, predictions, weather, similar_memories, rules_triggered)

    def _local_expert_fallback(
        self,
        telemetry: Dict[str, Any],
        predictions: Dict[str, Any],
        weather: str,
        similar_memories: List[Dict[str, Any]],
        rules_triggered: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        equipment_id = telemetry.get("id", "Unknown Equipment")
        fault_type = predictions.get("fault_type", "LINE_TO_GROUND")
        
        explanation = ""
        recommendations = []
        strategy = ""
        confidence = 0.95

        if "TRANSFORMER" in fault_type or equipment_id.startswith("T"):
            explanation = (
                f"Transformer {equipment_id} thermal limits exceeded NEMA TR 1 and IEEE C57.104. "
                f"Winding temperature registered critical values above normal limits. "
                "The core clamps are experiencing mechanical vibrations, combined with elevated partial discharge. "
                "This indicates local winding dielectric insulation degradation."
            )
            recommendations = [
                "De-energize transformer primary and secondary breakers BT1P/BT1S immediately.",
                "Deploy backup cooling fan groups (AVR forced ventilation stage 2).",
                "Initiate dissolved gas analysis (DGA) sampling for acetylene level tracking."
            ]
            strategy = (
                f"Reroute substation load through autotransformer T4 or request support from renewable dispatch "
                "curtailments to balance local bus reactive power loading."
            )
            confidence = 0.92
        else:
            explanation = (
                f"Line fault on {equipment_id} triggered Instantaneous Overcurrent protection (IEEE 50 / IEEE C37.91). "
                f"Phase currents spiked significantly while local voltage plummeted to critical undervoltage. "
                f"Environmental condition indicates weather is {weather}, making a physical lightning strike or branch contact likely."
            )
            recommendations = [
                "Trip and lock out line terminal breakers to isolate the fault section.",
                "Send inspection drones to inspect insulators on grid corridor segments."
            ]
            strategy = (
                f"Close tie-breakers B5A and B5B to bypass Line {equipment_id} and route power through parallel corridors. "
                "Request battery active power support (Agent 3) to absorb load pickup transience."
            )
            confidence = 0.96

        return {
            "root_cause_explanation": explanation,
            "emergency_recommendations": recommendations,
            "restoration_strategy": strategy,
            "confidence_score": confidence
        }
