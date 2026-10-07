from typing import Dict, Any, List
from app.domain.entities.grid_assets import Relay, Breaker, TransmissionLine, Transformer
from app.domain.aggregates.grid_aggregates import GridTopology

class RelayIntelligenceService:
    def analyze_trip(self, relay: Relay, breaker: Breaker, asset_telemetry: Dict[str, float]) -> Dict[str, Any]:
        """
        Analyzes whether a relay tripped correctly based on standard physical parameters and returns diagnosis.
        """
        voltage_pu = asset_telemetry.get("voltage_pu", 1.0)
        current_rms = asset_telemetry.get("current_rms", 0.0)
        winding_temp = asset_telemetry.get("winding_temperature", 60.0)
        partial_discharge = asset_telemetry.get("partial_discharge", 10.0)

        # Standard thresholds
        overcurrent_threshold = 4.0
        transformer_temp_threshold = 110.0
        partial_discharge_threshold = 500.0

        is_tripped = (relay.status == "TRIPPED" or not breaker.is_closed)
        
        # Scenario diagnosis
        if is_tripped:
            # Check if there is an actual physical fault condition
            if relay.mode_21_active or relay.mode_50_active:
                if current_rms > overcurrent_threshold or voltage_pu < 0.5:
                    return {
                        "relay_id": relay.id,
                        "breaker_id": breaker.id,
                        "analysis": "Correct Overcurrent / Distance protection trip. Verified physical short circuit.",
                        "coordination": "CORRECT",
                        "severity": "CRITICAL",
                        "false_trip": False,
                        "breaker_failure": False,
                        "confidence": 0.98
                    }
            if relay.mode_87T_active or relay.mode_51_active:
                if winding_temp > transformer_temp_threshold or partial_discharge > partial_discharge_threshold:
                    return {
                        "relay_id": relay.id,
                        "breaker_id": breaker.id,
                        "analysis": "Correct Transformer Differential/Thermal trip. Internal winding breakdown suspected.",
                        "coordination": "CORRECT",
                        "severity": "CRITICAL",
                        "false_trip": False,
                        "breaker_failure": False,
                        "confidence": 0.96
                    }
            
            # If we reached here, a trip occurred but values are nominal
            return {
                "relay_id": relay.id,
                "breaker_id": breaker.id,
                "analysis": "FALSE TRIP detected. Relay activated breaker open command without exceeding safety envelopes.",
                "coordination": "MISCOORDINATED",
                "severity": "WARNING",
                "false_trip": True,
                "breaker_failure": False,
                "confidence": 0.85
            }
        else:
            # Relay did not trip. Check if it should have!
            should_have_tripped = False
            reason = ""
            if (relay.mode_21_active or relay.mode_50_active) and current_rms > overcurrent_threshold:
                should_have_tripped = True
                reason = f"Phase current {current_rms:.2f} pu exceeded pickup threshold {overcurrent_threshold} pu."
            elif (relay.mode_87T_active or relay.mode_51_active) and winding_temp > transformer_temp_threshold:
                should_have_tripped = True
                reason = f"Winding temp {winding_temp:.2f}°C exceeded critical thermal limit {transformer_temp_threshold}°C."

            if should_have_tripped:
                return {
                    "relay_id": relay.id,
                    "breaker_id": breaker.id,
                    "analysis": f"BREAKER FAILURE detected. Relay sensed fault condition ({reason}) but breaker failed to open.",
                    "coordination": "FAILED",
                    "severity": "CRITICAL",
                    "false_trip": False,
                    "breaker_failure": True,
                    "confidence": 0.95
                }
            
            return {
                "relay_id": relay.id,
                "breaker_id": breaker.id,
                "analysis": "Relay and breaker operating normally within limits.",
                "coordination": "NORMAL",
                "severity": "INFO",
                "false_trip": False,
                "breaker_failure": False,
                "confidence": 1.0
            }

    def analyze_grid_coordination(self, topology: GridTopology) -> List[Dict[str, Any]]:
        anomalies = []
        for relay_id, relay in topology.relays.items():
            breaker = topology.breakers.get(relay.associated_breaker_id)
            if not breaker:
                continue
            
            # Retrieve associated telemetry
            telemetry = {}
            if breaker.associated_line_id:
                line = topology.transmission_lines.get(breaker.associated_line_id)
                if line:
                    telemetry = {"voltage_pu": line.voltage_pu, "current_rms": line.current_rms}
            elif breaker.associated_transformer_id:
                t = topology.transformers.get(breaker.associated_transformer_id)
                if t:
                    telemetry = {
                        "winding_temperature": t.winding_temperature,
                        "partial_discharge": t.partial_discharge
                    }

            result = self.analyze_trip(relay, breaker, telemetry)
            if result["severity"] in ["WARNING", "CRITICAL"]:
                anomalies.append(result)
        return anomalies
