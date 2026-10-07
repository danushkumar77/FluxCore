from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from app.domain.entities.grid_assets import Substation, TransmissionLine, Breaker, Relay, Transformer
from app.domain.value_objects.telemetry import TelemetryFrame, AssetHealthMetrics, SafetyMargin

class GridTopology(BaseModel):
    substations: Dict[str, Substation] = Field(default_factory=dict)
    transmission_lines: Dict[str, TransmissionLine] = Field(default_factory=dict)
    breakers: Dict[str, Breaker] = Field(default_factory=dict)
    relays: Dict[str, Relay] = Field(default_factory=dict)
    transformers: Dict[str, Transformer] = Field(default_factory=dict)

    def is_line_isolated(self, line_id: str) -> bool:
        # A line is isolated if both of its terminal breakers are open
        line = self.transmission_lines.get(line_id)
        if not line:
            return True
        breakers_associated = [
            b for b in self.breakers.values() if b.associated_line_id == line_id
        ]
        if not breakers_associated:
            return False
        return all(not b.is_closed for b in breakers_associated)

    def get_adjacent_lines(self, substation_id: str) -> List[TransmissionLine]:
        return [
            line for line in self.transmission_lines.values()
            if line.from_substation == substation_id or line.to_substation == substation_id
        ]

class RestorationStep(BaseModel):
    step_number: int
    action: str
    target_equipment_id: str
    description: str
    safety_check_passed: bool = False
    executed: bool = False
    execution_timestamp: Optional[str] = None
    rollback_command: Optional[str] = None

class RestorationPlan(BaseModel):
    plan_id: str
    name: str                          # Plan A, Plan B, Plan C, etc.
    description: str
    steps: List[RestorationStep] = Field(default_factory=list)
    safety_score: float = 0.0          # 0-100
    stability_impact_score: float = 0.0 # 0-100
    speed_score: float = 0.0           # 0-100
    customer_impact_score: float = 0.0 # 0-100
    cost_score: float = 0.0            # 0-100
    total_score: float = 0.0
    status: str = "PENDING"            # PENDING, APPROVED, REJECTED, EXECUTED, FAILED

class IncidentReport(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    fault_detected: bool = False
    fault_type: Optional[str] = None
    severity: str = "INFO"             # INFO, WARNING, CRITICAL
    fault_location: Optional[str] = None
    distance_km: Optional[float] = None
    affected_equipment: List[str] = Field(default_factory=list)
    telemetry_snapshot: Optional[Dict[str, Any]] = None
    root_cause_explanation: Optional[str] = None
    ieee_rules_referenced: List[str] = Field(default_factory=list)
    outage_probability: float = 0.0
    remaining_operational_time: Optional[str] = None
    proposed_plans: List[RestorationPlan] = Field(default_factory=list)
    selected_plan_id: Optional[str] = None
    current_state: str = "Idle"        # Current state machine state
    operator_override: bool = False
    operator_approved: bool = False
    status: str = "ACTIVE"             # ACTIVE, RESOLVING, RESOLVED, RECOVERY_FAILED
