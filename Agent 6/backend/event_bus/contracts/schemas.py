from typing import Dict, Any

class EventSchemas:
    """
    Validation structures for FluxCore multi-agent events.
    """
    
    @staticmethod
    def validate_payload(event_type: str, payload: Dict[str, Any]) -> bool:
        required_keys = {
            "demand.forecast.updated": ["demand_forecast_kw", "confidence"],
            "renewable.generation.predicted": ["solar_forecast_kw", "wind_forecast_kw"],
            "battery.capacity.updated": ["soc", "capacity_kwh", "health_pct"],
            "grid.reliability.updated": ["risk_level", "voltage_stability"],
            "asset.health.updated": ["battery_health", "solar_health"],
            "economic.strategy.generated": ["strategy_id", "plan_name", "expected_savings"],
            "energy.cost.optimized": ["dispatch_kw", "savings_usd"],
            "trade.executed": ["trade_type", "energy_kwh", "profit_usd"]
        }
        
        # Check keys if defined
        if event_type in required_keys:
            for key in required_keys[event_type]:
                if key not in payload:
                    print(f"[Event Schema Error] Missing key '{key}' in payload for event '{event_type}'")
                    return False
        return True
