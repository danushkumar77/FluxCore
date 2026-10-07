from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class TelemetryFrame(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    substation_id: str
    voltage_pu: float
    current_pu: float
    frequency_hz: float
    power_factor: float
    thd_percent: float
    active_power_mw: float
    reactive_power_mvar: float
    harmonic_spectrum: Dict[str, float] = Field(default_factory=dict) # Harmonic order to magnitude

class AssetHealthMetrics(BaseModel):
    asset_id: str
    health_score: float                # 0-100%
    risk_score: float                  # 0-100%
    outage_probability: float          # 0-1
    remaining_operational_hours: float
    criticality_rank: int

class SafetyMargin(BaseModel):
    parameter: str
    current_value: float
    limit_value: float
    margin_percent: float
    is_safe: bool
