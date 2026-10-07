from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class BatteryCell(BaseModel):
    cell_id: str
    voltage: float = 3.2  # V
    temperature: float = 25.0  # C
    internal_resistance: float = 2.0  # mOhm
    max_temp: float = 55.0
    max_voltage: float = 4.25

class BatteryModule(BaseModel):
    module_id: str
    cells: List[BatteryCell] = []
    
    @property
    def avg_voltage(self) -> float:
        return sum(c.voltage for c in self.cells) / len(self.cells) if self.cells else 3.2
        
    @property
    def avg_temp(self) -> float:
        return sum(c.temperature for c in self.cells) / len(self.cells) if self.cells else 25.0

class BatteryRack(BaseModel):
    rack_id: str
    modules: List[BatteryModule] = []
    
    @property
    def avg_voltage(self) -> float:
        return sum(m.avg_voltage for m in self.modules) / len(self.modules) if self.modules else 3.2
        
    @property
    def avg_temp(self) -> float:
        return sum(m.avg_temp for m in self.modules) / len(self.modules) if self.modules else 25.0

class BatteryContainer(BaseModel):
    container_id: str
    name: str
    status: str = "IDLE"  # IDLE, CHARGING, DISCHARGING, FAULT
    capacity_mwh: float = 2.0
    active_power_kw: float = 0.0
    soc: float = 50.0  # %
    soh: float = 100.0  # %
    racks: List[BatteryRack] = []
    inverter_efficiency: float = 0.96

class Site(BaseModel):
    site_id: str
    name: str
    location: str
    containers: List[BatteryContainer] = []
    
    @property
    def total_capacity_mwh(self) -> float:
        return sum(c.capacity_mwh for c in self.containers)

class Fleet(BaseModel):
    fleet_id: str
    name: str
    sites: List[Site] = []

class BatteryTelemetry(BaseModel):
    telemetry_id: Optional[str] = None
    container_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    soc: float
    soh: float
    avg_cell_voltage: float
    avg_cell_temp: float
    charge_cycles: int
    current_draw_a: float
    frequency_hz: float = 60.0
    grid_voltage_v: float = 480.0
    ambient_temp: float = 25.0
    solar_forecast_kw: float = 0.0
    demand_forecast_kw: float = 0.0
    market_price_usd: float = 45.0

class BatteryHealth(BaseModel):
    health_id: Optional[str] = None
    container_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    soh_pct: float
    capacity_loss_pct: float
    rul_cycles: int
    degradation_rate_pct_cycle: float
    resistance_mohm: float
    risk_score: float

class BatteryStrategy(BaseModel):
    strategy_id: str
    name: str
    policy_type: str
    description: str
    parameters: Dict[str, Any] = {}

class BatteryDecision(BaseModel):
    decision_id: str
    container_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    selected_plan: str
    expected_cost: float
    expected_revenue: float
    degradation_estimate: float
    renewable_utilization: float
    carbon_reduction: float
    grid_impact: float
    explanation: str
    confidence: float
    rollback_conditions: str
    status: str = "PENDING"  # PENDING, EXECUTING, SUCCESS, FAILED
    correlation_id: str

class BatteryAlert(BaseModel):
    alert_id: str
    container_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: str  # INFO, WARNING, CRITICAL
    source: str
    message: str
    active: bool = True

class BatteryExecution(BaseModel):
    execution_id: str
    decision_id: str
    container_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action_type: str  # CHARGE, DISCHARGE, IDLE
    duration_min: float
    power_kw: float
    response_code: int
    log_message: str

class BatteryForecast(BaseModel):
    forecast_id: Optional[str] = None
    container_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    period_hours: float
    demand_kw: float
    solar_kw: float
    price_usd_mwh: float

class BatteryOptimization(BaseModel):
    optimization_id: str
    decision_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    policy: str
    weights: Dict[str, float]
    calculated_scores: Dict[str, float]
