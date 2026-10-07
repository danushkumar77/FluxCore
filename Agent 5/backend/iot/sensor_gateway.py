from typing import Dict, Any
from app.infrastructure.repositories.AssetRepository import AssetRepository
from app.application.prediction_service import PredictionService
from event_bus.publisher import EventBus

class SensorGateway:
    def __init__(self, asset_repo: AssetRepository, pred_service: PredictionService):
        self.asset_repo = asset_repo
        self.pred_service = pred_service
        self.event_bus = EventBus()

    def ingest_telemetry(self, asset_id: str, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        asset = self.asset_repo.get_by_id(asset_id)
        if not asset:
            print(f"SensorGateway: Asset '{asset_id}' not found. Rejecting telemetry.")
            return {"status": "error", "message": "Asset not found"}

        # 1. Basic Ingest & Sanitize (force floats)
        sanitized_telemetry = {}
        for key, val in telemetry.items():
            try:
                sanitized_telemetry[key] = float(val)
            except Exception:
                sanitized_telemetry[key] = val

        # Update temporary asset copy to run drift check
        asset.telemetry = sanitized_telemetry
        
        # 2. Check for sensor drift (Model 8)
        is_drifted = self.pred_service.detect_drift(asset)
        
        # Update asset in db
        asset.telemetry = sanitized_telemetry
        self.asset_repo.save(asset)

        # 3. Publish to Event Bus
        payload = {
            "asset_id": asset_id,
            "asset_type": asset.type,
            "telemetry": sanitized_telemetry,
            "is_drift": is_drifted
        }
        self.event_bus.publish("asset.telemetry.updated", payload)
        
        return {
            "status": "success",
            "asset_id": asset_id,
            "is_drift": is_drifted
        }
