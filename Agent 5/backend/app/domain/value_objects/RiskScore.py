from pydantic import BaseModel

class RiskScore(BaseModel):
    probability: float  # 0.0 to 1.0 (from ML Model 1)
    impact: float       # 0.0 to 1.0 (replacement cost / grid importance)
    criticality: float  # 0.0 to 1.0
    risk_index: float   # 0.0 to 100.0
    priority: str       # "Low", "Medium", "High", "Critical"
