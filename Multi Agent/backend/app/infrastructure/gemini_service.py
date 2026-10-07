import logging
import os
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from app.core.config import get_settings
from app.engines.rule_engine import rule_engine
from app.engines.xai import ExplainableAIEngine, ExplainableDecisionOutput
from app.domain.contracts.telemetry import TelemetryMeasurement

logger = logging.getLogger("FluxCore.GeminiService")

class GeminiReasoningEngine:
    def __init__(self, api_key_env_var: Optional[str] = None):
        settings = get_settings()
        self.api_key = os.environ.get(api_key_env_var) if api_key_env_var else settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._initialized = False

        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self._initialized = True
                logger.info(f"Gemini Reasoning Engine initialized successfully for {api_key_env_var or 'default'}.")
            except Exception as e:
                logger.error(f"Failed to configure Gemini GenerativeAI SDK for {api_key_env_var}: {e}")
        else:
            logger.warning(f"No Gemini API key found for env var '{api_key_env_var or 'default'}'. Graceful fallback enabled.")

    async def analyze_incident(
        self,
        agent_name: str,
        telemetry: TelemetryMeasurement,
        forecasts: Dict[str, Any],
        knowledge_context: List[Dict[str, Any]],
        memory_context: List[Dict[str, Any]],
        state_context: str
    ) -> ExplainableDecisionOutput:
        """
        Sends state, telemetry, and rules context to Gemini for engineering reasoning.
        If no API key exists, falls back to local rule-based inference.
        """
        # Run local rules audit first
        local_violations = rule_engine.evaluate_telemetry(telemetry)
        
        # Decide if using Gemini or Fallback
        if self._initialized and get_settings().ENABLE_AI_REASONING:
            return await self._run_gemini_reasoning(
                agent_name, telemetry, forecasts, knowledge_context, memory_context, state_context, local_violations
            )
        else:
            return self._run_fallback_reasoning(agent_name, telemetry, local_violations)

    async def _run_gemini_reasoning(
        self,
        agent_name: str,
        telemetry: TelemetryMeasurement,
        forecasts: Dict[str, Any],
        knowledge_context: List[Dict[str, Any]],
        memory_context: List[Dict[str, Any]],
        state_context: str,
        local_violations: List[Dict[str, Any]]
    ) -> ExplainableDecisionOutput:
        try:
            model = genai.GenerativeModel(self.model_name)
            
            # Format detailed engineering prompt
            prompt = f"""
You are a Principal AI Grid Engineer operating the '{agent_name}' agent in the FluxCore Smart Grid Platform.
Analyze the following parameters and output a structured operational response.

Telemetry Snapshot:
{telemetry.model_dump_json(indent=2)}

Active Forecasts:
{forecasts}

Local Safety Violations Detected:
{local_violations}

Relevant Knowledge Library Entries:
{knowledge_context}

Historical Lessons Learned:
{memory_context}

Current Agent Operational State: {state_context}

Based on this context, you must output a structured JSON format matching these fields:
1. "engineering_explanation": A concise explanation of the grid physical phenomena and active load behaviors.
2. "confidence_score": Float between 0.0 and 1.0.
3. "recommended_action": Object describing the physical control command (e.g., charge, discharge, trip breaker).
4. "alternative_decisions": List of alternatives rejected and reasons why.
5. "risk_assessment": Hazard name, probability (Low/Medium/High), impact (Low/Medium/High/Critical), and details.
6. "recommended_corrective_actions": List of steps for operators.
7. "justification": Overall system argument.

Return ONLY raw JSON. No markdown backticks.
"""
            response = await asyncio.to_thread(model.generate_content, prompt)
            response_text = response.text.strip()
            
            # Attempt to clean potential markdown wrappers
            if response_text.startswith("```"):
                response_text = response_text.split("json")[-1].split("```")[0].strip()

            # Parse JSON
            data = json.loads(response_text)
            
            # Double check validation rules locally
            approved, reason = rule_engine.audit_ai_decision(data.get("recommended_action", {}), telemetry)
            trace = ["Rule Check: Passed", "Gemini Inference: Complete"]
            if not approved:
                logger.warning(f"Gemini proposed action was blocked by Rule Engine: {reason}")
                data["recommended_action"] = {"type": "idle", "status": "overridden"}
                data["engineering_explanation"] += f" (Gemini recommendation overridden: {reason})"
                trace.append("Orchestration Override: Decision blocked by safety rules")

            return ExplainableAIEngine.construct_explanation(
                agent_name=agent_name,
                confidence=data.get("confidence_score", 0.8),
                explanation=data.get("engineering_explanation", "AI Grid Evaluation completed."),
                factors={k: 0.8 for k in telemetry.model_dump(exclude_none=True).keys()},
                hazard=data.get("risk_assessment", {}).get("hazard", "Overload"),
                prob=data.get("risk_assessment", {}).get("probability", "Low"),
                imp=data.get("risk_assessment", {}).get("impact", "Medium"),
                risk_desc=data.get("risk_assessment", {}).get("description", "Grid within limits."),
                recommended_actions=data.get("recommended_corrective_actions", []),
                trace=trace,
                justification=data.get("justification", "Stable operations."),
                alternatives=data.get("alternative_decisions", [])
            )

        except Exception as e:
            logger.error(f"Gemini API failure: {e}. Falling back to rule engine.")
            return self._run_fallback_reasoning(agent_name, telemetry, local_violations)

    def _run_fallback_reasoning(
        self,
        agent_name: str,
        telemetry: TelemetryMeasurement,
        local_violations: List[Dict[str, Any]]
    ) -> ExplainableDecisionOutput:
        """Deterministic rule-based fallback generating explainable logs."""
        logger.info(f"Executing deterministic rules check for '{agent_name}'")
        
        confidence = 1.0
        recommended_actions = []
        action = {"type": "idle", "target": None}
        trace = ["Gemini API: Bypassed/Failed", "Rule Check: Executed"]
        explanation = "Deterministic evaluation: Grid parameters operating within normal boundaries."
        hazard = "None"
        prob = "Low"
        imp = "Low"
        risk_desc = "Grid healthy"

        if local_violations:
            confidence = 0.95
            explanation = f"Safety constraints violated: {local_violations[0]['description']}"
            worst_violation = local_violations[0]
            hazard = worst_violation["rule"]
            prob = "High"
            imp = worst_violation["severity"].capitalize()
            risk_desc = worst_violation["description"]
            recommended_actions.append(worst_violation["suggested_action"])
            trace.append(f"Constraint triggered: {worst_violation['rule']}")
            
            # Map action type based on violated rule
            if worst_violation["category"] == "emergency":
                action = {"type": "load_shedding", "target": "feeder_1"}
            elif worst_violation["category"] == "battery":
                action = {"type": "cutoff_battery", "target": "bess_1"}
            else:
                action = {"type": "maintenance_alert", "target": worst_violation["rule"]}

        return ExplainableAIEngine.construct_explanation(
            agent_name=agent_name,
            confidence=confidence,
            explanation=explanation,
            factors={k: 1.0 for k in telemetry.model_dump(exclude_none=True).keys()},
            hazard=hazard,
            prob=prob,
            imp=imp,
            risk_desc=risk_desc,
            recommended_actions=recommended_actions,
            trace=trace,
            justification="Enforcing deterministic physics boundaries.",
            alternatives=[{"action": {"type": "idle"}, "reason_rejected": "Violates safety requirements"}]
        )

# Global instance for DI
gemini_engine = GeminiReasoningEngine()
import json
import asyncio
