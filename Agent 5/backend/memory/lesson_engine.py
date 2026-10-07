import os
import json
from datetime import datetime
from typing import List, Dict, Any

class LessonEngine:
    def __init__(self, filepath="backend/memory/lessons.json"):
        self.filepath = filepath
        self.lessons = []
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    self.lessons = json.load(f)
            except Exception:
                self.lessons = self._get_default_lessons()
        else:
            self.lessons = self._get_default_lessons()
            self._save()

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, 'w') as f:
            json.dump(self.lessons, f, indent=2)

    def record_lesson(self, asset_id: str, asset_type: str, prediction_error: float, feedback: str, outcome: str):
        lesson = {
            "id": f"LES-{len(self.lessons) + 1:03d}",
            "timestamp": datetime.utcnow().isoformat(),
            "asset_id": asset_id,
            "asset_type": asset_type,
            "prediction_error": prediction_error,
            "feedback": feedback,
            "outcome": outcome,
            "lesson_learned": f"For {asset_type} assets displaying similar profiles: {feedback}. Expected mitigation error reduced by {prediction_error * 100:.1f}%."
        }
        self.lessons.append(lesson)
        self._save()

    def get_all(self) -> List[Dict[str, Any]]:
        return self.lessons

    def _get_default_lessons(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "LES-001",
                "timestamp": "2025-11-20T09:00:00Z",
                "asset_id": "T-01",
                "asset_type": "Transformer",
                "prediction_error": 0.05,
                "feedback": "Early filtration when acetylene gas crosses 2.5ppm prevents rapid degradation. Waiting for 5.0ppm increases core corrosion.",
                "outcome": "Successful mitigation",
                "lesson_learned": "For Transformer assets displaying similar profiles: Early filtration when acetylene gas crosses 2.5ppm prevents rapid degradation. Expected mitigation error reduced by 5.0%."
            },
            {
                "id": "LES-002",
                "timestamp": "2026-01-10T16:00:00Z",
                "asset_id": "WT-301",
                "asset_type": "Renewable",
                "prediction_error": 0.08,
                "feedback": "Vibration spikes on wind turbines correlate heavily with sudden wind shear changes. Adjust pitch angle proactively by 1.5 degrees.",
                "outcome": "Prevention of trip",
                "lesson_learned": "For Renewable assets displaying similar profiles: Vibration spikes on wind turbines correlate heavily with sudden wind shear changes. Adjust pitch angle proactively by 1.5 degrees. Expected mitigation error reduced by 8.0%."
            }
        ]
