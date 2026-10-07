import logging
from typing import Dict, Any, List
from app.core.event_bus import event_bus
from app.domain.contracts.events import BaseEvent

logger = logging.getLogger("FluxCore.NotificationEngine")

class NotificationEngine:
    def __init__(self):
        # Maps priority levels to allowed channels
        self.routing_rules = {
            "critical": ["email", "sms", "slack", "teams", "push"],
            "high": ["email", "slack", "teams", "push"],
            "medium": ["slack", "push"],
            "low": ["push"],
            "informational": ["push"]
        }

    def start(self):
        """Auto-subscribes notification engine to alert topics on Event Bus."""
        event_bus.subscribe("grid.fault.detected", self.on_alert_received)
        event_bus.subscribe("maintenance.required", self.on_alert_received)
        logger.info("Notification Engine started and subscribed to Alert events.")

    async def on_alert_received(self, event: BaseEvent):
        payload = event.payload
        severity = payload.get("severity", "medium").lower()
        description = payload.get("description", "Grid Alert")
        asset_id = payload.get("asset_id", "Unknown Asset")
        
        logger.info(f"Notification Engine processing alert for Asset: {asset_id} | Severity: {severity}")
        
        channels = self.routing_rules.get(severity, ["push"])
        
        for channel in channels:
            await self._dispatch_to_channel(channel, severity, description, asset_id)

    async def _dispatch_to_channel(self, channel: str, severity: str, message: str, asset: str):
        log_msg = f"[NOTIFICATION SEND] Channel: {channel.upper()} | Priority: {severity.upper()} | Asset: {asset} | Msg: {message}"
        
        # Highlighting logs differently based on critical / high priorities
        if severity == "critical":
            logger.critical(log_msg)
        elif severity == "high":
            logger.error(log_msg)
        else:
            logger.info(log_msg)

        # Mock integrations with communication APIs
        if channel == "slack":
            # In production: httpx.post(slack_webhook_url, json={"text": log_msg})
            pass
        elif channel == "sms":
            # In production: twilio_client.messages.create(...)
            pass
        elif channel == "email":
            # In production: sendgrid_client.send(...)
            pass

# Global instance for DI
notification_engine = NotificationEngine()
