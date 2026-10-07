import json
from typing import Dict, Any

class MQTTAdapter:
    def __init__(self, gateway):
        self.gateway = gateway

    def handle_message(self, topic: str, payload_str: str) -> Dict[str, Any]:
        """
        Receives MQTT payloads from topics like: grid/assets/T-101/telemetry
        """
        try:
            parts = topic.split("/")
            asset_id = parts[2]  # Extract T-101
            payload = json.loads(payload_str)
            return self.gateway.ingest_telemetry(asset_id, payload)
        except Exception as e:
            return {"status": "error", "message": f"MQTT Parse Error: {e}"}
