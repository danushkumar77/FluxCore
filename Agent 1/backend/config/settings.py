from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    GEMINI_API_KEY: Optional[str] = None
    DATABASE_URL: str = "sqlite+aiosqlite:///./fluxcore.db"
    MODEL_PATH: str = "models/demand_model.joblib"
    SCALER_PATH: str = "models/scaler.joblib"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:5173"
    GRID_CAPACITY: float = 50000.0
    
    FEATURE_COLUMNS: List[str] = [
        'hour', 'minute', 'month', 'year', 'weekday', 'is_weekend', 'is_holiday', 'season',
        'temperature', 'humidity', 'wind_speed', 'rainfall', 'solar_irradiance', 'atmospheric_pressure',
        'current_load', 'previous_hour_load', 'previous_day_load',
        'grid_frequency', 'voltage', 'power_factor',
        'solar_generation', 'wind_generation', 'hydro_generation', 'renewable_percentage',
        'battery_soc', 'available_storage',
        'electricity_price', 'demand_response_event',
        'load_change_1h', 'load_change_24h', 'demand_growth_rate',
        'temperature_index', 'temp_squared',
        'renewable_ratio', 'net_load', 'battery_utilization',
        'peak_hour', 'off_peak',
        'hour_sin', 'hour_cos', 'month_sin', 'month_cos',
        'day_of_week_sin', 'day_of_week_cos',
        'price_load_ratio'
    ]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
