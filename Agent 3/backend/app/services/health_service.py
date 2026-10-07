import os
import json
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.domain.entities import BatteryTelemetry, BatteryAlert, BatteryHealth
from backend.app.domain.interfaces import AlertRepository
from backend.app.core.event_bus import EventBus, EventContract, event_bus_instance

logger = logging.getLogger("FluxCore.HealthService")

class HealthService:
    def __init__(self, alert_repo: AlertRepository, event_bus: EventBus = event_bus_instance):
        self.alert_repo = alert_repo
        self.event_bus = event_bus
        self.limits = []
        self.thermal_rules = []
        self.emergency_rules = []
        self._load_rules()

    def _load_rules(self):
        try:
            with open("backend/knowledge/battery_limits.json", "r") as f:
                self.limits = json.load(f).get("limits", [])
            with open("backend/knowledge/thermal_rules.json", "r") as f:
                self.thermal_rules = json.load(f).get("rules", [])
            with open("backend/knowledge/emergency_rules.json", "r") as f:
                self.emergency_rules = json.load(f).get("rules", [])
            logger.info("Loaded health boundaries and safety rules from Knowledge Base.")
        except Exception as e:
            logger.error(f"Error loading rules in HealthService: {str(e)}")

    async def evaluate_telemetry_health(self, telemetry: BatteryTelemetry, correlation_id: str) -> List[BatteryAlert]:
        alerts_raised = []
        
        # 1. Evaluate Cell Voltage Limits
        max_v_rule = next((l for l in self.limits if l["id"] == "LIMIT-VOLT-MAX"), None)
        min_v_rule = next((l for l in self.limits if l["id"] == "LIMIT-VOLT-MIN"), None)
        
        if max_v_rule and telemetry.avg_cell_voltage > max_v_rule["value"]:
            alert = await self._create_alert(telemetry.container_id, "CRITICAL", "VOLTAGE_HIGH", 
                                            f"Overvoltage detected! Avg Cell Voltage: {telemetry.avg_cell_voltage}V exceeds limit {max_v_rule['value']}V. Rule: {max_v_rule['id']}", correlation_id)
            alerts_raised.append(alert)
            
        if min_v_rule and telemetry.avg_cell_voltage < min_v_rule["value"]:
            alert = await self._create_alert(telemetry.container_id, "CRITICAL", "VOLTAGE_LOW", 
                                            f"Undervoltage detected! Avg Cell Voltage: {telemetry.avg_cell_voltage}V below limit {min_v_rule['value']}V. Rule: {min_v_rule['id']}", correlation_id)
            alerts_raised.append(alert)

        # 2. Evaluate Cell Temp Limits & Thermal Rules
        for rule in self.thermal_rules:
            threshold = rule["temp_threshold"]
            rule_id = rule["id"]
            if telemetry.avg_cell_temp > threshold:
                severity = "CRITICAL" if rule_id == "THERMAL-CRITICAL-SHUTDOWN" else "WARNING"
                alert = await self._create_alert(telemetry.container_id, severity, "TEMP_HIGH", 
                                                f"{rule['name']}: Temperature {telemetry.avg_cell_temp:.1f}C exceeded threshold {threshold}C. Rule: {rule_id}", correlation_id)
                alerts_raised.append(alert)
                
        # 3. Evaluate Emergency Rules
        for rule in self.emergency_rules:
            rule_id = rule["id"]
            if rule_id == "EMERGENCY-THERMAL-RUNAWAY" and telemetry.avg_cell_temp > rule["temp_runaway_threshold"]:
                alert = await self._create_alert(telemetry.container_id, "CRITICAL", "THERMAL_RUNAWAY",
                                                f"EMERGENCY ACTIVE: Thermal Runaway conditions detected ({telemetry.avg_cell_temp:.1f}C)! Isolating grid and activating fire suppressors. Rule: {rule_id}", correlation_id)
                alerts_raised.append(alert)

        # 4. Check SOC Limits
        soc_min_rule = next((l for l in self.limits if l["id"] == "LIMIT-SOC-MIN"), None)
        if soc_min_rule and telemetry.soc < soc_min_rule["value"]:
            alert = await self._create_alert(telemetry.container_id, "WARNING", "SOC_LOW",
                                            f"Low SOC Warning: State of Charge is {telemetry.soc:.1f}%, which is below recommended minimum {soc_min_rule['value']}%. Rule: {soc_min_rule['id']}", correlation_id)
            alerts_raised.append(alert)
            
        # Publish health update event
        health_event = EventContract(
            event_type="battery.health.updated",
            correlation_id=correlation_id,
            payload={
                "container_id": telemetry.container_id,
                "health_status": "CRITICAL" if any(a.severity == "CRITICAL" for a in alerts_raised) else ("WARNING" if alerts_raised else "NOMINAL"),
                "alert_count": len(alerts_raised)
            }
        )
        await self.event_bus.publish(health_event)

        return alerts_raised

    async def _create_alert(self, container_id: str, severity: str, source: str, message: str, correlation_id: str) -> BatteryAlert:
        alert = BatteryAlert(
            alert_id=f"ALT-{str(uuid.uuid4())[:8]}",
            container_id=container_id,
            timestamp=datetime.utcnow(),
            severity=severity,
            source=source,
            message=message,
            active=True
        )
        await self.alert_repo.save_alert(alert)
        
        # Publish event
        event = EventContract(
            event_type="battery.alert.created",
            correlation_id=correlation_id,
            payload=alert.dict()
        )
        await self.event_bus.publish(event)
        return alert

    async def get_active_alerts(self) -> List[BatteryAlert]:
        return await self.alert_repo.get_active_alerts()

    async def get_all_alerts(self, limit: int = 100) -> List[BatteryAlert]:
        return await self.alert_repo.get_all_alerts(limit)

    async def resolve_alert(self, alert_id: str) -> None:
        await self.alert_repo.resolve_alert(alert_id)
