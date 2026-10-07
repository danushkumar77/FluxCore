from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID, uuid4

class ForecastPoint(BaseModel):
    timestamp: datetime
    value: float
    confidence_lower: float
    confidence_upper: float

class BaseForecast(BaseModel):
    forecast_id: UUID = Field(default_factory=uuid4)
    target_id: UUID
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    horizon_hours: int
    model_version: str
    confidence_score: float  # Global model confidence
    data_points: List[ForecastPoint]

class DemandForecast(BaseForecast):
    forecast_type: str = "demand"

class SolarForecast(BaseForecast):
    forecast_type: str = "solar"

class WindForecast(BaseForecast):
    forecast_type: str = "wind"

class HydroForecast(BaseForecast):
    forecast_type: str = "hydro"

class BatteryForecast(BaseForecast):
    forecast_type: str = "battery"

class PriceForecast(BaseForecast):
    forecast_type: str = "price"

class DecisionModel(BaseModel):
    decision_id: UUID = Field(default_factory=uuid4)
    agent_name: str
    decision_type: str  # load_shedding, battery_charge, reactive_power_compensation, etc.
    confidence: float  # 0.0 to 1.0
    risk_level: str  # Low, Medium, High, Critical
    reasoning_summary: str
    alternative_options: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_action: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    justification_trace: List[str] = Field(default_factory=list)
