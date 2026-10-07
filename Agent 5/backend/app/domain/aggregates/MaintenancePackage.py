from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class MaintenancePackage(BaseModel):
    package_id: str
    asset_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    selected_plan: str                 # "Plan A" (Immediate), "Plan B" (Monitor), "Plan C" (Reduce Load), "Plan D" (Outage), "Plan E" (Replace)
    reasoning: str
    recommended_date: datetime
    estimated_downtime_hours: float
    estimated_cost: float
    required_technicians: List[str] = Field(default_factory=list)
    required_tools: List[str] = Field(default_factory=list)
    safety_checklist: List[str] = Field(default_factory=list)
    approved: bool = False
    approved_by: Optional[str] = None
    status: str = "Pending"            # "Pending", "Approved", "InProgress", "Completed", "Rejected"
    execution_log: List[str] = Field(default_factory=list)
