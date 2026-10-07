import os
import json
from datetime import datetime
from typing import List, Dict, Any

class IncidentMemory:
    def __init__(self, filepath="backend/memory/incidents.json"):
        self.filepath = filepath
        self.incidents = []
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    self.incidents = json.load(f)
            except Exception:
                self.incidents = self._get_default_incidents()
        else:
            self.incidents = self._get_default_incidents()
            self._save()

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, 'w') as f:
            json.dump(self.incidents, f, indent=2)

    def add_incident(self, incident: Dict[str, Any]):
        incident["timestamp"] = incident.get("timestamp", datetime.utcnow().isoformat())
        self.incidents.append(incident)
        self._save()

    def search_by_asset(self, asset_type: str) -> List[Dict[str, Any]]:
        return [i for i in self.incidents if i.get("asset_type") == asset_type]

    def get_all(self) -> List[Dict[str, Any]]:
        return self.incidents

    def _get_default_incidents(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "INC-001",
                "asset_id": "T-01",
                "asset_type": "Transformer",
                "timestamp": "2025-10-15T08:30:00Z",
                "description": "High temperature alarm triggered. Winding temperature rose to 112°C. Followed by oil degradation and breakdown voltage drop to 42 kV.",
                "root_cause": "Insulation paper aging and thermal hotspot inside winding coil.",
                "corrective_action": "Outage scheduled. Oil filtered, core inspected. Replaced aging gaskets and topped up oil.",
                "engineer_notes": "Successful repair. Keep a watch on load levels.",
                "accuracy_score": 0.95
            },
            {
                "id": "INC-002",
                "asset_id": "WT-301",
                "asset_type": "Renewable",
                "subtype": "Wind",
                "timestamp": "2025-12-04T14:15:00Z",
                "description": "Nacelle vibration rose from 0.15g to 0.42g within 12 hours. Blade pitch control responded sluggishly.",
                "root_cause": "Gearbox bearing micro-cracks causing mechanical vibration imbalance.",
                "corrective_action": "Sub-system isolated, blade pitched to feather. Replaced gearbox high-speed shaft bearing.",
                "engineer_notes": "Immediate feathering prevented catastrophic rotor blade fracture.",
                "accuracy_score": 0.92
            },
            {
                "id": "INC-003",
                "asset_id": "B-501",
                "asset_type": "Battery",
                "timestamp": "2026-02-18T22:10:00Z",
                "description": "Cell temperature spiked to 58°C in battery container rack 3 during peak discharging. Cell balance delta exceeded 120mV.",
                "root_cause": "Faulty cell bypass switch failing to open, causing runaway cycle aging.",
                "corrective_action": "Automatic string isolation triggered. Replaced cell bypass module and calibrated balance charger.",
                "engineer_notes": "Cooling fans failed to start initially due to controller failure.",
                "accuracy_score": 0.88
            },
            {
                "id": "INC-004",
                "asset_id": "CB-201",
                "asset_type": "CircuitBreaker",
                "timestamp": "2026-04-09T03:00:00Z",
                "description": "Trip coil current rose abnormally and operation speed deteriorated to 68ms.",
                "root_cause": "Trip latch linkage binding due to dried grease and mechanical wear.",
                "corrective_action": "Cleaned trip assembly, applied synthetic lubricants, conducted contact resistance test.",
                "engineer_notes": "Interrupter contacts show 15% erosion. Serviceable for another 300 cycles.",
                "accuracy_score": 0.90
            }
        ]
