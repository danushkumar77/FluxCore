from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from datetime import datetime
from backend.database.session import Base

class MarketPrice(Base):
    __tablename__ = "market_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    market_type = Column(String(50))  # "real_time" or "day_ahead"
    buying_price = Column(Float)      # $/kWh
    selling_price = Column(Float)     # $/kWh
    forecasted_price = Column(Float)  # $/kWh
    actual_price = Column(Float)      # $/kWh
    demand_kw = Column(Float)
    renewable_gen_kw = Column(Float)
    weather_desc = Column(String(100))

class OptimizationHistory(Base):
    __tablename__ = "optimization_history"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    action_taken = Column(String(100))  # "BUY", "SELL", "CHARGE", "DISCHARGE", "IDLE"
    demand_kw = Column(Float)
    solar_gen_kw = Column(Float)
    battery_soc = Column(Float)
    grid_price = Column(Float)
    total_cost = Column(Float)
    savings = Column(Float)
    status = Column(String(50))  # "SUCCESS", "FAILED"
    confidence = Column(Float)

class TradingTransaction(Base):
    __tablename__ = "trading_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    trade_type = Column(String(50))  # "BUY", "SELL", "ARBITRAGE"
    energy_kwh = Column(Float)
    price_per_kwh = Column(Float)
    total_value = Column(Float)
    profit = Column(Float)
    status = Column(String(50))  # "EXECUTED", "PENDING", "FAILED"
    risk_score = Column(Float)
    opportunity_score = Column(Float)

class CarbonRecord(Base):
    __tablename__ = "carbon_records"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    renewable_percentage = Column(Float)
    co2_avoided_kg = Column(Float)
    carbon_cost = Column(Float)
    green_score = Column(Float)

class AgentMemory(Base):
    __tablename__ = "agent_memory"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    state = Column(String(50))
    situation_json = Column(Text)  # JSON representation of state variables
    decision_action = Column(String(100))
    savings = Column(Float)
    outcome = Column(Text)  # "SUCCESSFUL", "FAILED", etc.
    tags = Column(String(100))

class StrategyResult(Base):
    __tablename__ = "strategy_results"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    plan_name = Column(String(100))  # "Plan A", "Plan B", etc.
    expected_cost = Column(Float)
    expected_profit = Column(Float)
    battery_impact = Column(Float)
    carbon_impact = Column(Float)
    grid_risk = Column(Float)
    confidence_score = Column(Float)
    selected = Column(Boolean, default=False)
    rollback_plan = Column(Text)

class ModelMetric(Base):
    __tablename__ = "model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    model_name = Column(String(100))  # e.g., "price_forecast_hour_ahead"
    mae = Column(Float)
    rmse = Column(Float)
    mape = Column(Float)
    r2 = Column(Float)
    features_importance = Column(Text)  # JSON of feature importances
    status = Column(String(50))  # "ACTIVE", "DRIFTED", "RETRAINING"
