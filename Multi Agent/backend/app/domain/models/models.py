from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4

class DomainEntity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Fleet(DomainEntity):
    name: str
    description: Optional[str] = None
    operator_id: str

class Site(DomainEntity):
    fleet_id: UUID
    name: str
    location_lat: float
    location_lon: float
    status: str  # active, warning, critical, maintenance

class Substation(DomainEntity):
    site_id: UUID
    name: str
    capacity_mw: float
    voltage_level_kv: float
    status: str

class Transformer(DomainEntity):
    substation_id: UUID
    name: str
    manufacturer: str
    nominal_power_mva: float
    cooling_type: str
    status: str
    temperature_oil_c: float = 0.0
    temperature_winding_c: float = 0.0

class TransmissionLine(DomainEntity):
    name: str
    source_substation_id: UUID
    target_substation_id: UUID
    voltage_kv: float
    max_capacity_mw: float
    current_flow_mw: float = 0.0
    status: str

class GridAsset(DomainEntity):
    name: str
    asset_type: str  # breaker, capacitor_bank, sensor, etc.
    parent_id: UUID  # can point to Substation or Site
    manufacturer: str
    installation_date: datetime
    status: str

class SolarFarm(DomainEntity):
    site_id: UUID
    name: str
    peak_power_mw: float
    current_generation_mw: float = 0.0
    irradiance_w_m2: float = 0.0
    status: str

class WindFarm(DomainEntity):
    site_id: UUID
    name: str
    peak_power_mw: float
    current_generation_mw: float = 0.0
    wind_speed_m_s: float = 0.0
    status: str

class HydroPlant(DomainEntity):
    site_id: UUID
    name: str
    capacity_mw: float
    current_generation_mw: float = 0.0
    water_flow_m3_s: float = 0.0
    reservoir_level_pct: float = 0.0
    status: str

class BatteryEnergyStorageSystem(DomainEntity):
    site_id: UUID
    name: str
    capacity_mwh: float
    max_charge_power_mw: float
    max_discharge_power_mw: float
    soc_pct: float = 100.0  # State of Charge
    soh_pct: float = 100.0  # State of Health
    temperature_c: float = 25.0
    status: str  # charging, discharging, idle, warning, critical

class Market(DomainEntity):
    name: str
    region: str
    current_price_mwh: float
    currency: str = "USD"
    carbon_intensity_g_kwh: float = 0.0

class Incident(DomainEntity):
    title: str
    description: str
    asset_id: UUID
    asset_type: str
    severity: str  # low, medium, high, critical
    status: str  # open, investigating, resolved
    root_cause: Optional[str] = None
    resolved_at: Optional[datetime] = None

class Forecast(DomainEntity):
    target_id: UUID  # Site, Substation, Battery, etc.
    forecast_type: str  # demand, solar, wind, hydro, price
    horizon_hours: int
    data_points: List[Dict[str, Any]]  # [{"timestamp": datetime, "value": float, "confidence": float}]
    model_version: str

class OptimizationPlan(DomainEntity):
    name: str
    optimizer_agent: str  # agent id/name
    objective_type: str  # cost, carbon, battery_health, load_balance
    actions: List[Dict[str, Any]]  # actions proposed
    confidence: float
    risk_assessment: Dict[str, Any]

class Alert(DomainEntity):
    asset_id: UUID
    source_agent: str
    description: str
    severity: str  # informational, low, medium, high, critical
    status: str  # active, acknowledged, cleared
    suggested_action: Optional[str] = None

class KnowledgeRule(DomainEntity):
    code: str  # IEEE-X, IEC-Y
    category: str  # grid, battery, safety, etc.
    condition: str
    action_then: str
    metadata: Dict[str, Any] = {}

class MemoryRecord(DomainEntity):
    agent_name: str
    record_type: str  # decision, event_log, lesson_learned
    content: str
    metadata: Dict[str, Any] = {}
    tags: List[str] = []

class Decision(DomainEntity):
    agent_name: str
    decision_type: str
    confidence: float
    risk_level: str
    reasoning: str
    action_taken: str
    telemetry_snapshot: Dict[str, Any]
    outcome: Optional[str] = None
    user_override: bool = False
    lessons_learned: Optional[str] = None

class AgentState(DomainEntity):
    agent_name: str
    version: str
    capabilities: List[str]
    current_state: str  # Idle, Monitoring, Analysis, etc.
    health_status: str  # healthy, degraded, dead
    runtime_metadata: Dict[str, Any] = {}
