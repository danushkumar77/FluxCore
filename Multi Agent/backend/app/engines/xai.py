from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID, uuid4

class RiskAssessment(BaseModel):
    hazard: str
    probability: str  # Low, Medium, High
    impact: str  # Low, Medium, High, Critical
    description: str

class AlternativeDecision(BaseModel):
    action: Dict[str, Any]
    reason_rejected: str
    predicted_outcome: str

class ExplainableDecisionOutput(BaseModel):
    decision_id: UUID = Field(default_factory=uuid4)
    agent_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    engineering_explanation: str
    influencing_factors: Dict[str, float]  # parameter name: weight / significance
    risk_assessment: RiskAssessment
    alternatives: List[AlternativeDecision] = Field(default_factory=list)
    recommended_corrective_actions: List[str] = Field(default_factory=list)
    decision_trace: List[str] = Field(default_factory=list)
    justification: str

class ExplainableAIEngine:
    @staticmethod
    def construct_explanation(
        agent_name: str,
        confidence: float,
        explanation: str,
        factors: Dict[str, float],
        hazard: str,
        prob: str,
        imp: str,
        risk_desc: str,
        recommended_actions: List[str],
        trace: List[str],
        justification: str,
        alternatives: List[Dict[str, Any]] = None
    ) -> ExplainableDecisionOutput:
        """Helper to build a strongly validated explainable decision output."""
        risk = RiskAssessment(
            hazard=hazard,
            probability=prob,
            impact=imp,
            description=risk_desc
        )
        
        alt_list = []
        if alternatives:
            for alt in alternatives:
                alt_list.append(AlternativeDecision(
                    action=alt.get("action", {}),
                    reason_rejected=alt.get("reason_rejected", "Sub-optimal metrics compared to active selection"),
                    predicted_outcome=alt.get("predicted_outcome", "Stable operation but higher cost/risk")
                ))

        return ExplainableDecisionOutput(
            agent_name=agent_name,
            confidence_score=confidence,
            engineering_explanation=explanation,
            influencing_factors=factors,
            risk_assessment=risk,
            alternatives=alt_list,
            recommended_corrective_actions=recommended_actions,
            decision_trace=trace,
            justification=justification
        )
