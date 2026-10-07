import json
import os
import math
from typing import List, Dict, Any, Optional

class VectorSearchEngine:
    """
    Simulates semantic search by vectorizing fault incident parameters:
    Features: [is_transformer (0/1), is_line (0/1), current_rms, voltage_pu, harmonics_thd, severity_level (0-2)]
    """
    @staticmethod
    def vectorize(incident: Dict[str, Any]) -> List[float]:
        is_trans = 1.0 if "transformer" in incident.get("fault_type", "").lower() or incident.get("equipment_id", "").startswith("T") else 0.0
        is_line = 1.0 if "line" in incident.get("fault_type", "").lower() or incident.get("equipment_id", "").startswith("L") else 0.0
        
        current = float(incident.get("current_rms", 0.4))
        voltage = float(incident.get("voltage_pu", 1.0))
        harmonics = float(incident.get("harmonics_thd", 0.8))
        
        severity_map = {"INFO": 0.0, "WARNING": 1.0, "CRITICAL": 2.0}
        sev = severity_map.get(incident.get("severity", "INFO"), 0.0)
        
        return [is_trans, is_line, current, voltage, harmonics, sev]

    @classmethod
    def cosine_similarity(cls, vec1: List[float], vec2: List[float]) -> float:
        dot_product = sum(a*b for a, b in zip(vec1, vec2))
        magnitude_a = math.sqrt(sum(a*a for a in vec1))
        magnitude_b = math.sqrt(sum(b*b for b in vec2))
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        return dot_product / (magnitude_a * magnitude_b)

class LessonEngine:
    def __init__(self, filepath: str = "backend/app/memory/lessons.json"):
        self.filepath = filepath
        self.lessons: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    self.lessons = json.load(f)
            except Exception as e:
                print(f"Error loading lessons: {e}")

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        try:
            with open(self.filepath, 'w') as f:
                json.dump(self.lessons, f, indent=2)
        except Exception as e:
            print(f"Error saving lessons: {e}")

    def record_restoration_outcome(self, incident_id: str, plan_name: str, success: bool, duration_ms: float, error_msg: Optional[str] = None):
        lesson = {
            "incident_id": incident_id,
            "restoration_plan": plan_name,
            "success": success,
            "execution_duration_ms": duration_ms,
            "error_msg": error_msg,
            "key_takeaway": "Plan executed successfully. Power restored to secondary loop." if success else f"Plan failed: {error_msg}. Rerouting requires secondary line verification."
        }
        self.lessons.append(lesson)
        self._save()

class HistoricalIncidentMemory:
    def __init__(self, filepath: str = "backend/app/memory/historical_incidents.json"):
        self.filepath = filepath
        self.incidents: List[Dict[str, Any]] = []
        self.vector_engine = VectorSearchEngine()
        self._load_defaults()

    def _load_defaults(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    self.incidents = json.load(f)
                    return
            except Exception as e:
                print(f"Error reading historical incidents: {e}")

        # Seed with initial rich historical incidents for search matches
        self.incidents = [
            {
                "incident_id": "hist-001",
                "equipment_id": "T1",
                "fault_type": "TRANSFORMER_OVERHEAT",
                "severity": "CRITICAL",
                "current_rms": 1.1,
                "voltage_pu": 0.96,
                "harmonics_thd": 1.2,
                "root_cause": "High ambient temperature combined with sustained peak overload. Cooling fan relay failed to start.",
                "restoration_strategy": "Shed 15MW load from secondary terminals and trigger manual override of backup radiator fan group.",
                "ieee_reference": "IEEE C57.104"
            },
            {
                "incident_id": "hist-002",
                "equipment_id": "L1",
                "fault_type": "LINE_TO_GROUND",
                "severity": "CRITICAL",
                "current_rms": 5.2,
                "voltage_pu": 0.25,
                "harmonics_thd": 9.4,
                "root_cause": "Lightning strike during storm causing insulator flashover on Section 4 of Line L1.",
                "restoration_strategy": "Isolate line L1 by tripping breakers B1A/B1B. Reroute load through Line L5 tie breaker B5A.",
                "ieee_reference": "IEEE C37.113 (IEEE-21 Protection)"
            },
            {
                "incident_id": "hist-003",
                "equipment_id": "T4",
                "fault_type": "INSULATION_BREAKDOWN",
                "severity": "CRITICAL",
                "current_rms": 1.3,
                "voltage_pu": 0.98,
                "harmonics_thd": 2.2,
                "root_cause": "Dissolved hydrogen gas build-up due to internal arcing, degrading paper winding insulation.",
                "restoration_strategy": "Isolate Autotransformer T4 and transfer load to adjacent substations via 230kV loops.",
                "ieee_reference": "IEEE C57.104"
            }
        ]
        self.save()

    def save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        try:
            with open(self.filepath, 'w') as f:
                json.dump(self.incidents, f, indent=2)
        except Exception as e:
            print(f"Error writing historical incidents: {e}")

    def add_incident(self, incident: Dict[str, Any]):
        self.incidents.append(incident)
        self.save()

    def search_similar(self, current_incident: Dict[str, Any], limit: int = 2) -> List[Dict[str, Any]]:
        vec_query = self.vector_engine.vectorize(current_incident)
        scored = []
        for hist in self.incidents:
            vec_hist = self.vector_engine.vectorize(hist)
            sim = self.vector_engine.cosine_similarity(vec_query, vec_hist)
            scored.append((sim, hist))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:limit]]
