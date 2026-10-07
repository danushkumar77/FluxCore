from pydantic import BaseModel

class HealthIndex(BaseModel):
    score: float       # 0.0 to 100.0
    status: str        # "Healthy", "Warning", "Critical"
    primary_cause: str # E.g., "Thermal hotspot", "None"
