import os
import json
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, Dict, Any

class AppSettings(BaseSettings):
    # Environment & Profile
    ENVIRONMENT: str = Field("development", env="FLUXCORE_ENV")
    
    # API Gateway Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_VERSION: str = "v1"
    
    # Security
    JWT_SECRET_KEY: str = Field("fluxcore_enterprise_secret_key_change_me_in_production_12345", env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # DB
    DATABASE_URL: str = Field("sqlite+aiosqlite:///./fluxcore.db", env="DATABASE_URL")
    
    # Redis (For Cache / Queue)
    REDIS_URL: Optional[str] = Field(None, env="REDIS_URL")
    
    # Gemini AI
    GEMINI_API_KEY: Optional[str] = Field(None, env="GEMINI_API_KEY")
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Feature Flags
    ENABLE_AI_REASONING: bool = True
    ENABLE_ML_PREDICTIONS: bool = True
    SIMULATE_LIVE_TELEMETRY: bool = True
    
    # Event Bus & DLQ
    EVENT_BUS_MAX_RETRIES: int = 3
    EVENT_BUS_RETRY_BACKOFF_SEC: float = 1.0
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

class ConfigurationService:
    def __init__(self):
        self._settings = AppSettings()
        self.load_profile()

    def load_profile(self):
        # Dynamically override or load config based on environment profile
        profile = self._settings.ENVIRONMENT.lower()
        profile_file = f"config/{profile}.json"
        if os.path.exists(profile_file):
            try:
                with open(profile_file, "r") as f:
                    profile_data = json.load(f)
                    # Merge profile settings into AppSettings
                    for k, v in profile_data.items():
                        if hasattr(self._settings, k):
                            setattr(self._settings, k, v)
                print(f"Loaded config profile: {profile} from {profile_file}")
            except Exception as e:
                print(f"Failed to load profile file {profile_file}: {e}")

    def reload(self) -> AppSettings:
        """Trigger runtime configuration reload."""
        self._settings = AppSettings()
        self.load_profile()
        return self._settings

    @property
    def settings(self) -> AppSettings:
        return self._settings

# Global instance for Dependency Injection
config_service = ConfigurationService()

def get_settings() -> AppSettings:
    return config_service.settings
