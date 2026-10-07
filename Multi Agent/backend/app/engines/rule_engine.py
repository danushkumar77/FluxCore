import logging
from typing import Dict, Any, List, Tuple
from app.domain.contracts.telemetry import TelemetryMeasurement
from app.domain.contracts.alerts import AlertModel

logger = logging.getLogger("FluxCore.RuleEngine")

class GridConstraintViolation(Exception):
    pass

class RuleEngine:
    def __init__(self):
        # Configure thresholds
        self.voltage_nominal_kv = 115.0
        self.voltage_deviation_limit_pct = 5.0
        
        self.frequency_nominal_hz = 50.0
        self.frequency_deviation_limit_hz = 0.5  # 49.5 to 50.5
        
        self.battery_min_soc_pct = 10.0
        self.battery_max_temp_c = 60.0
        self.transformer_max_temp_c = 90.0

    def evaluate_telemetry(self, telemetry: TelemetryMeasurement) -> List[Dict[str, Any]]:
        """
        Evaluates active telemetry data points against IEEE, IEC, and system safety constraints.
        Returns a list of violations / alerts triggered.
        """
        violations = []

        # 1. Voltage Constraint Check (IEC 60038 / IEEE standard)
        if telemetry.voltage_kv is not None:
            deviation = abs(telemetry.voltage_kv - self.voltage_nominal_kv) / self.voltage_nominal_kv * 100.0
            if deviation > self.voltage_deviation_limit_pct:
                violations.append({
                    "rule": "IEEE-1159-VOLTAGE-DEVIATION",
                    "category": "grid",
                    "severity": "high" if deviation > 10.0 else "medium",
                    "description": f"Voltage deviation at {deviation:.1f}% exceeds threshold of {self.voltage_deviation_limit_pct}%",
                    "value": telemetry.voltage_kv,
                    "suggested_action": "Adjust tap changer or activate reactive power compensation."
                })

        # 2. Frequency Constraint Check (Safety / Emergency rules)
        if telemetry.frequency_hz is not None:
            if abs(telemetry.frequency_hz - self.frequency_nominal_hz) > self.frequency_deviation_limit_hz:
                severity = "critical" if abs(telemetry.frequency_hz - self.frequency_nominal_hz) > 1.0 else "high"
                violations.append({
                    "rule": "GRID-CODE-FREQ-LIMIT",
                    "category": "emergency",
                    "severity": severity,
                    "description": f"Grid frequency anomalous at {telemetry.frequency_hz} Hz (deviation exceeds {self.frequency_deviation_limit_hz} Hz)",
                    "value": telemetry.frequency_hz,
                    "suggested_action": "TRIGGER IMMEDIATE UNDER-FREQUENCY LOAD SHEDDING (UFLS)" if severity == "critical" else "Request rapid battery discharge injection."
                })

        # 3. Battery Constraints (Battery Health / Life Protection Rules)
        if telemetry.battery_soc_pct is not None:
            if telemetry.battery_soc_pct < self.battery_min_soc_pct:
                violations.append({
                    "rule": "BESS-DEEP-DISCHARGE-PREVENTION",
                    "category": "battery",
                    "severity": "high",
                    "description": f"Battery State of Charge is dangerously low at {telemetry.battery_soc_pct}% (Limit: {self.battery_min_soc_pct}%)",
                    "value": telemetry.battery_soc_pct,
                    "suggested_action": "FORCE CUTOFF / Charging command required."
                })

        if telemetry.battery_temp_c is not None:
            if telemetry.battery_temp_c > self.battery_max_temp_c:
                violations.append({
                    "rule": "BESS-THERMAL-RUNAWAY-PROTECTION",
                    "category": "safety",
                    "severity": "critical",
                    "description": f"Battery temperature is {telemetry.battery_temp_c} C, exceeding thermal threshold of {self.battery_max_temp_c} C",
                    "value": telemetry.battery_temp_c,
                    "suggested_action": "SHUT DOWN BESS INVERTER / Trigger cooling fans override."
                })

        # 4. Transformer Temperature Check (Maintenance rules)
        if telemetry.temperature_c is not None and telemetry.temperature_c > self.transformer_max_temp_c:
            violations.append({
                "rule": "XFRM-OVERHEAT-ALARM",
                "category": "maintenance",
                "severity": "high",
                "description": f"Transformer core temperature reaches {telemetry.temperature_c} C. Maximum load capacity exceeded.",
                "value": telemetry.temperature_c,
                "suggested_action": "Reduce grid load throughput / Schedule physical onsite sensor calibration."
            })

        return violations

    def audit_ai_decision(self, decision_action: dict, telemetry: TelemetryMeasurement) -> Tuple[bool, str]:
        """
        Validates if an proposed AI recommendation violates physical grid limits or safety rules.
        Returns (is_approved, reason).
        """
        action_type = decision_action.get("type")
        
        # Scenario: AI recommends discharging battery during emergency grid low frequency
        if action_type == "discharge_battery":
            if telemetry.battery_soc_pct is not None and telemetry.battery_soc_pct <= self.battery_min_soc_pct:
                return False, f"Rule Engine Block: Battery SOC ({telemetry.battery_soc_pct}%) is below minimum physical threshold ({self.battery_min_soc_pct}%)."

        # Scenario: AI suggests adding loads during overtemperature condition
        if action_type == "increase_load":
            if telemetry.temperature_c is not None and telemetry.temperature_c > self.transformer_max_temp_c:
                return False, f"Rule Engine Block: Transformer temperature is critical ({telemetry.temperature_c} C). Cannot accept additional loads."

        return True, "Approved: Safety rules validated."

# Global instance for DI
rule_engine = RuleEngine()
