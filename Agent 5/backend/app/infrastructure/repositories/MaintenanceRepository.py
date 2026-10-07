import os
import json
from datetime import datetime
from typing import List, Dict, Optional
from app.domain.interfaces.IMaintenanceRepository import IMaintenanceRepository
from app.domain.aggregates.MaintenancePackage import MaintenancePackage

class MaintenanceRepository(IMaintenanceRepository):
    def __init__(self, filepath="backend/app/infrastructure/database/maintenance.json"):
        self.filepath = filepath
        self.packages: Dict[str, MaintenancePackage] = {}
        self._load()

    def _load(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    data = json.load(f)
                    for pkg_id, item in data.items():
                        # Parse datetime
                        if isinstance(item.get("recommended_date"), str):
                            item["recommended_date"] = datetime.fromisoformat(item["recommended_date"])
                        if isinstance(item.get("timestamp"), str):
                            item["timestamp"] = datetime.fromisoformat(item["timestamp"])
                        self.packages[pkg_id] = MaintenancePackage(**item)
            except Exception as e:
                print(f"Error loading maintenance packages: {e}")
                self._load_mocks()
        else:
            self._load_mocks()
            self.save_all()

    def _load_mocks(self):
        mocks = [
            {
                "package_id": "MP-901",
                "asset_id": "B-601",
                "selected_plan": "Plan C",
                "reasoning": "Battery display warning cell thermal runaway hazard. Load reduced by 40% and cooling activated to stabilize pack temperature.",
                "recommended_date": "2026-07-29T10:00:00",
                "estimated_downtime_hours": 0.0,
                "estimated_cost": 0.0,
                "required_technicians": [],
                "required_tools": [],
                "safety_checklist": ["Confirm command dispatch received by battery controller"],
                "approved": True,
                "approved_by": "Grid Orchestrator",
                "status": "InProgress",
                "execution_log": ["2026-07-28T22:00:00Z - Plan C active. Charging limited to 50A."]
            },
            {
                "package_id": "MP-902",
                "asset_id": "T-101",
                "selected_plan": "Plan B",
                "reasoning": "Transformer oil temperature rises past warning. Continue monitoring and inspect cooling fan operations.",
                "recommended_date": "2026-08-05T08:00:00",
                "estimated_downtime_hours": 1.5,
                "estimated_cost": 450.0,
                "required_technicians": ["Substation Electrician"],
                "required_tools": ["Thermal IR Camera", "Multimeter"],
                "safety_checklist": ["Wear insulating safety gloves", "Verify neutral line grounding"],
                "approved": False,
                "status": "Pending"
            }
        ]
        for item in mocks:
            if isinstance(item["recommended_date"], str):
                item["recommended_date"] = datetime.fromisoformat(item["recommended_date"])
            self.packages[item["package_id"]] = MaintenancePackage(**item)

    def get_by_id(self, package_id: str) -> Optional[MaintenancePackage]:
        return self.packages.get(package_id)

    def get_all(self) -> List[MaintenancePackage]:
        return list(self.packages.values())

    def save(self, package: MaintenancePackage) -> None:
        self.packages[package.package_id] = package
        self.save_all()

    def save_all(self) -> None:
        data = {pkg_id: pkg.model_dump() for pkg_id, pkg in self.packages.items()}
        def serialize_dt(o):
            if isinstance(o, datetime):
                return o.isoformat()
            raise TypeError("Type not serializable")
        with open(self.filepath, 'w') as f:
            json.dump(data, f, indent=2, default=serialize_dt)
class_name = "MaintenanceRepository"
