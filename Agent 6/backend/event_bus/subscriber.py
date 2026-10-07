from typing import Dict, Any
from backend.event_bus.contracts.events import EventContract
from backend.event_bus.publisher import subscribe

# Simulated caches of other agents' data
agent_data_cache: Dict[str, Any] = {
    "demand_forecast_kw": 420.0,
    "demand_confidence": 92.0,
    "solar_forecast_kw": 280.0,
    "wind_forecast_kw": 120.0,
    "battery_soc": 0.50,
    "battery_capacity_kwh": 600.0,
    "battery_health_pct": 98.2,
    "grid_reliability": "LOW",
    "grid_voltage_stability": 1.0,
    "solar_health": 95.0,
    "wind_health": 92.0,
    "battery_health": 96.0
}

def handle_demand_forecast(event: EventContract):
    agent_data_cache["demand_forecast_kw"] = event.payload.get("demand_forecast_kw", 420.0)
    agent_data_cache["demand_confidence"] = event.payload.get("confidence", 90.0)

def handle_renewable_forecast(event: EventContract):
    agent_data_cache["solar_forecast_kw"] = event.payload.get("solar_forecast_kw", 280.0)
    agent_data_cache["wind_forecast_kw"] = event.payload.get("wind_forecast_kw", 120.0)

def handle_battery_capacity(event: EventContract):
    agent_data_cache["battery_soc"] = event.payload.get("soc", 0.50)
    agent_data_cache["battery_capacity_kwh"] = event.payload.get("capacity_kwh", 600.0)
    agent_data_cache["battery_health_pct"] = event.payload.get("health_pct", 98.2)

def handle_grid_reliability(event: EventContract):
    agent_data_cache["grid_reliability"] = event.payload.get("risk_level", "LOW")
    agent_data_cache["grid_voltage_stability"] = event.payload.get("voltage_stability", 1.0)

def handle_asset_health(event: EventContract):
    agent_data_cache["solar_health"] = event.payload.get("solar_health", 95.0)
    agent_data_cache["wind_health"] = event.payload.get("wind_health", 92.0)
    agent_data_cache["battery_health"] = event.payload.get("battery_health", 96.0)

def setup_agent_subscriptions():
    """
    Registers handles for all external smart grid agents.
    """
    subscribe("demand.forecast.updated", handle_demand_forecast)
    subscribe("renewable.generation.predicted", handle_renewable_forecast)
    subscribe("battery.capacity.updated", handle_battery_capacity)
    subscribe("grid.reliability.updated", handle_grid_reliability)
    subscribe("asset.health.updated", handle_asset_health)
    print("[EventBus] Subscriptions established for other smart grid agent topics.")
