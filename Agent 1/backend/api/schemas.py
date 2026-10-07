from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class PredictionRequest(BaseModel):
    hour: int = Field(ge=0, le=23)
    minute: int = Field(default=0, ge=0, le=59)
    day: int = Field(ge=1, le=31)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020, le=2030)
    weekday: int = Field(ge=0, le=6)
    is_weekend: bool = False
    is_holiday: bool = False
    season: str = Field(default='summer')

    temperature: float = Field(ge=-50, le=60)
    humidity: float = Field(ge=0, le=100)
    wind_speed: float = Field(ge=0, le=200)
    rainfall: float = Field(default=0, ge=0, le=500)
    solar_irradiance: float = Field(ge=0, le=1200)
    atmospheric_pressure: float = Field(default=1013.25, ge=900, le=1100)

    current_load: float = Field(ge=0, le=100000)
    previous_hour_load: float = Field(ge=0, le=100000)
    previous_day_load: float = Field(ge=0, le=100000)
    grid_frequency: float = Field(default=50.0, ge=45, le=55)
    voltage: float = Field(default=230, ge=0, le=500)
    power_factor: float = Field(default=0.95, ge=0, le=1)

    solar_generation: float = Field(ge=0, le=50000)
    wind_generation: float = Field(ge=0, le=50000)
    hydro_generation: float = Field(ge=0, le=50000)
    renewable_percentage: float = Field(ge=0, le=100)

    battery_soc: float = Field(default=50, ge=0, le=100)
    available_storage: float = Field(default=500, ge=0, le=50000)

    electricity_price: float = Field(default=50, ge=0, le=10000)
    demand_response_event: bool = False

class PredictionResponse(BaseModel):
    agent: str = 'DemandForecastAgent'
    timestamp: str
    prediction: float
    next_6h_demand: float
    next_24h_demand: float
    peak_demand: float
    confidence: float
    risk: str
    category: str
    trend: str
    grid_stress_index: float
    reserve_margin: float
    reasoning: str
    recommendations: List[str]
    prediction_interval: Dict[str, float]
    feature_importance: Dict[str, float]
    validation_warnings: List[str]

class BatchPredictionRequest(BaseModel):
    predictions: List[PredictionRequest]

class BatchPredictionResponse(BaseModel):
    agent: str = 'DemandForecastAgent'
    timestamp: str
    results: List[PredictionResponse]
    count: int

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    database_connected: bool
    gemini_available: bool
    uptime_seconds: float
    version: str = '1.0.0'

class MetricsResponse(BaseModel):
    mae: float
    rmse: float
    mape: float
    r2_score: float
    cv_scores: List[float]
    training_date: str
    samples_count: int

class ModelInfoResponse(BaseModel):
    model_type: str
    version: str
    training_date: str
    features_count: int
    feature_names: List[str]
    hyperparameters: dict
    performance: MetricsResponse

class DashboardSummary(BaseModel):
    current_load: float
    average_load_24h: float
    peak_load_24h: float
    min_load_24h: float
    total_predictions: int
    avg_confidence: float
    risk_distribution: Dict[str, int]
    recent_predictions: List[PredictionResponse]
    hourly_forecast: List[dict]
    weekly_trend: List[dict]

class FeatureImportanceResponse(BaseModel):
    features: List[dict]
