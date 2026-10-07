import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from app.domain.entities.Asset import Asset

class ReliabilityService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.client_initialized = False
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.client_initialized = True
                print("Gemini API Reasoning Engine initialized successfully.")
            except Exception as e:
                print(f"Failed to configure Gemini API client: {e}. Fallback enabled.")
        else:
            print("GEMINI_API_KEY env variable not set. Gemini Reasoning Engine in deterministic fallback mode.")

    def analyze_asset_health(
        self, 
        asset: Asset, 
        predictions: Dict[str, Any], 
        triggered_rules: List[Dict[str, Any]], 
        similar_incidents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        
        # Prepare context payload
        context = {
            "asset_id": asset.id,
            "asset_name": asset.name,
            "asset_type": asset.type,
            "station": asset.station,
            "installation_date": asset.installation_date,
            "current_telemetry": asset.telemetry,
            "ml_predictions": predictions,
            "triggered_rules": triggered_rules,
            "similar_historical_incidents": similar_incidents
        }

        # If API is configured, call Gemini
        if self.client_initialized:
            try:
                prompt = self._build_gemini_prompt(context)
                # Using standard general flash model
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                
                # Parse JSON
                result = json.loads(response.text)
                return result
            except Exception as e:
                print(f"Gemini API invocation failed: {e}. Running fallback reasoning...")
                return self._generate_fallback_reasoning(context)
        else:
            return self._generate_fallback_reasoning(context)

    def _build_gemini_prompt(self, context: Dict[str, Any]) -> str:
        return f"""
You are a Senior Predictive Maintenance Engineer and Grid Asset Reliability Architect.
Evaluate the current health state and reliability outlook of the following smart grid asset.

ASSET CONTEXT:
- Asset: {context['asset_name']} ({context['asset_id']})
- Type: {context['asset_type']}
- Substation/Location: {context['station']}
- Age: Installed on {context['installation_date']}

CURRENT TELEMETRY DATA:
{json.dumps(context['current_telemetry'], indent=2)}

MACHINE LEARNING PREDICTIONS:
- Failure Probability: {context['ml_predictions'].get('failure_probability', 0.0)*100:.1f}%
- Remaining Useful Life (RUL): {context['ml_predictions'].get('rul_days', 180):.1f} days
- Anomaly Classification: {context['ml_predictions'].get('anomaly_mode', 'None')}

ENGINEERING LIMIT RULES TRIGGERED:
{json.dumps(context['triggered_rules'], indent=2)}

SIMILAR HISTORICAL FAILURES FROM INCIDENT MEMORY:
{json.dumps(context['similar_historical_incidents'], indent=2)}

DIAGNOSTIC TASK:
Perform a Failure Mode and Effects Analysis (FMEA) reasoning cycle. Detail the physical degradation mechanism of the asset (e.g. thermal insulation breakdown, SF6 density loss, gear wear friction). Reference specific standards like IEEE C57.104 for oil temp/DGA if applicable. Determine the optimal corrective plan (Plan A to E).

OUTPUT FORMAT:
You must respond with ONLY a valid JSON object. Do not include markdown wraps or backticks outside of the JSON text. The JSON object must contain exactly the following keys:
- "engineering_explanation": "Detailed professional explanation of the physical telemetry anomaly and degradation mechanism.",
- "failure_reasoning": "Scientific reasoning for why/when failure will occur if left unmitigated.",
- "recommended_plan": "Plan A" (Immediate), "Plan B" (Monitor), "Plan C" (Reduce Load), "Plan D" (Outage), or "Plan E" (Replace),
- "recommended_action": "Specific engineering mitigation task, e.g. Schedule oil vacuum dehydration.",
- "priority": "Low", "Medium", "High", or "Critical",
- "confidence_score": 0.0 to 1.0 (float reflecting your assessment confidence)
"""

    def _generate_fallback_reasoning(self, context: Dict[str, Any]) -> Dict[str, Any]:
        asset_type = context["asset_type"]
        telemetry = context["current_telemetry"]
        triggered = context["triggered_rules"]
        ml = context["ml_predictions"]
        
        # Default responses
        explanation = "All telemetry sensors are within nominal tolerances. Core operations are stable."
        reasoning = "No active degradation profile detected. Normal mechanical/electrical wear observed."
        rec_plan = "Plan B"
        rec_action = "Continue continuous sensor telemetry monitoring."
        priority = "Low"
        confidence = 0.95

        # Heuristics based on asset types and warning triggers
        if triggered:
            # Something is breached
            rule_id = triggered[0].get("id", "")
            action = triggered[0].get("action", "Inspect asset")
            sev = triggered[0].get("severity", "Warning")
            
            priority = "Critical" if sev == "Critical" else "High"
            rec_action = action
            
            if asset_type == "Transformer":
                explanation = "Winding temperatures and oil degradation indicators show active thermal stress. Triggered by dissolved gas or temp rise."
                if "c2h2" in str(telemetry).lower() or "dga" in rule_id.lower():
                    explanation = "IEEE C57.104 limits breached. Dissolved Acetylene (C2H2) detected in transformer oil, indicating electrical arcing discharges inside the tank."
                    reasoning = "High energy arcing will degrade the transformer's paper insulation, risking dielectric breakdown and catastrophic winding fault."
                    rec_plan = "Plan A"
                    confidence = 0.92
                else:
                    reasoning = "Prolonged core loading exceeds thermal limits, risking aging of winding cellulose paper."
                    rec_plan = "Plan C"
                    confidence = 0.88
            elif asset_type == "CircuitBreaker":
                explanation = "Circuit breaker mechanical speed or dielectric insulation gas displays warnings."
                if float(telemetry.get("sf6_pressure", 6.0)) < 5.5:
                    explanation = "SF6 gas pressure dropped below nominal safety margins (IEEE guidelines), indicating seal leakage."
                    reasoning = "Dielectric arc quenching capability is reduced. Operating under low SF6 pressure risk busbar flashover."
                    rec_plan = "Plan A"
                    confidence = 0.94
                else:
                    reasoning = "Contact erosion from cumulative switching operations slow down breaker trip timing."
                    rec_plan = "Plan D"
                    confidence = 0.85
            elif asset_type == "Battery":
                explanation = "Battery system demonstrates significant thermal stress and SOH degradation."
                if float(telemetry.get("cell_temp", 25.0)) > 45.0:
                    explanation = "Thermal monitoring flags battery cell overheating. Imbalance between cells is exceeding 80mV."
                    reasoning = "High cell temperature triggers positive feedback, accelerating cell degradation and risking thermal runway."
                    rec_plan = "Plan C"
                    confidence = 0.90
            elif asset_type == "TransmissionLine":
                explanation = "Transmission conductor sag or tension limits breached under high load conditions."
                reasoning = "High load current causes thermal expansion of the aluminum conductor, increasing sag and risking ground faults."
                rec_plan = "Plan C"
                confidence = 0.82
            elif asset_type == "Renewable":
                explanation = "Renewable generation asset flags mechanical vibration or inverter efficiency drop."
                reasoning = "Gearbox bearing fatigue is causing structural resonance. Operating at high speeds risks shaft lockup."
                rec_plan = "Plan D"
                confidence = 0.88
        
        # Adjust plan based on ML recommendations if available
        if ml.get("failure_probability", 0.0) > 0.8:
            rec_plan = "Plan A"
            priority = "Critical"
        elif ml.get("failure_probability", 0.0) > 0.5:
            if rec_plan == "Plan B":
                rec_plan = "Plan C"
            priority = "High"

        return {
            "engineering_explanation": explanation,
            "failure_reasoning": reasoning,
            "recommended_plan": rec_plan,
            "recommended_action": rec_action,
            "priority": priority,
            "confidence_score": float(confidence)
        }
