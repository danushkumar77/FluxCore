from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class StrategyInfo(BaseModel):
    strategy_id: str
    plan_name: str
    expected_cost: float
    expected_profit: float
    battery_impact: float  # Degradation/wear cost ($)
    carbon_impact: float   # CO2 emissions change (kg)
    grid_risk: float       # Reliability score (0 to 1)
    confidence_score: float # Percentage
    rollback_plan: str
    selected: bool = False

class MarketSnapshot(BaseModel):
    timestamp: datetime
    buying_price: float
    selling_price: float
    predicted_price_1h: float
    predicted_price_24h: float
    demand_forecast: float
    renewable_forecast: float
    volatility_score: float

class BatteryState(BaseModel):
    soc: float            # State of Charge (0.0 to 1.0)
    capacity_kwh: float
    max_charge_rate_kw: float
    max_discharge_rate_kw: float
    degradation_pct: float
    temperature_c: float

class GridReliability(BaseModel):
    voltage_stability: float
    frequency_hz: float
    risk_level: str       # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    fault_probability: float

class AssetHealth(BaseModel):
    solar_panels: float   # Health index (0 to 100)
    wind_turbines: float
    battery_bank: float
    inverters: float

class Observation(BaseModel):
    timestamp: datetime
    market: MarketSnapshot
    battery: BatteryState
    grid: GridReliability
    health: AssetHealth
    active_state: str

class TradeOrder(BaseModel):
    trade_type: str       # "BUY", "SELL"
    energy_kwh: float
    price_per_kwh: float
    timestamp: datetime
    estimated_profit: float

class EventContract(BaseModel):
    event_id: str
    event_type: str
    timestamp: datetime
    source_agent: str
    correlation_id: str
    payload: Dict
    schema_version: str
