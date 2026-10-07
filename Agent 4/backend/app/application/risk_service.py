from typing import Dict, Any, List
from app.domain.aggregates.grid_aggregates import GridTopology
from app.domain.value_objects.telemetry import AssetHealthMetrics

class GridRiskService:
    def calculate_asset_health(self, asset_id: str, asset_type: str, telemetry: Dict[str, float]) -> AssetHealthMetrics:
        """
        Calculates health score, risk score, outage probability, remaining operational hours, and criticality.
        """
        health_score = 100.0
        risk_score = 0.0
        outage_prob = 0.0
        remaining_hours = 8760.0 # 1 year default
        criticality = 3          # 1: High, 2: Medium, 3: Low

        if asset_type == "transformer":
            winding_temp = telemetry.get("winding_temperature", 60.0)
            oil_temp = telemetry.get("top_oil_temperature", 50.0)
            pd = telemetry.get("partial_discharge", 10.0)
            vibration = telemetry.get("vibration", 15.0)
            insulation = telemetry.get("insulation_resistance", 1000.0)
            load = telemetry.get("load_percentage", 60.0)

            # High temp penalty
            if winding_temp > 95:
                health_score -= (winding_temp - 95) * 2.0
            if oil_temp > 85:
                health_score -= (oil_temp - 85) * 1.5
            # PD penalty
            if pd > 100:
                health_score -= (pd / 10.0)
            # Vibration penalty
            if vibration > 50:
                health_score -= (vibration - 50) * 0.4
            # Insulation penalty
            if insulation < 500:
                health_score -= (500 - insulation) * 0.1

            # High load factor
            if load > 100:
                health_score -= (load - 100) * 0.5

            health_score = max(5.0, min(100.0, health_score))
            risk_score = 100.0 - health_score
            outage_prob = 1.0 - (health_score / 100.0)

            # Estimate remaining useful hours
            if health_score < 40:
                remaining_hours = max(2.0, (health_score / 40.0) * 24.0)
            elif health_score < 80:
                remaining_hours = (health_score / 80.0) * 720.0
            
            # Criticality based on MVA (assume T4 is largest)
            criticality = 1 if asset_id == "T4" else 2

        elif asset_type == "transmission_line":
            voltage = telemetry.get("voltage_pu", 1.0)
            current = telemetry.get("current_rms", 0.4)
            thd = telemetry.get("harmonics_thd", 0.5)

            # Voltage deviation penalty
            v_dev = abs(1.0 - voltage)
            if v_dev > 0.05:
                health_score -= (v_dev - 0.05) * 400.0
            # Overcurrent penalty
            if current > 1.2:
                health_score -= (current - 1.2) * 30.0
            if thd > 3.0:
                health_score -= (thd - 3.0) * 2.0

            health_score = max(10.0, min(100.0, health_score))
            risk_score = 100.0 - health_score
            outage_prob = 1.0 - (health_score / 100.0)

            if health_score < 50:
                remaining_hours = max(1.0, (health_score / 50.0) * 12.0)

            # Lines S1-S5 and S2-S5 are backbone (L1, L2)
            criticality = 1 if asset_id in ["L1", "L2"] else 2

        return AssetHealthMetrics(
            asset_id=asset_id,
            health_score=round(health_score, 1),
            risk_score=round(risk_score, 1),
            outage_probability=round(outage_prob, 3),
            remaining_operational_hours=round(remaining_hours, 1),
            criticality_rank=criticality
        )

    def calculate_grid_metrics(self, topology: GridTopology) -> Dict[str, Any]:
        """
        Computes overall grid safety, stability, outage indexes.
        """
        transformer_metrics = []
        for t_id, t in topology.transformers.items():
            metrics = self.calculate_asset_health(t_id, "transformer", t.dict())
            transformer_metrics.append(metrics)

        line_metrics = []
        for line_id, line in topology.transmission_lines.items():
            metrics = self.calculate_asset_health(line_id, "transmission_line", line.dict())
            line_metrics.append(metrics)

        all_healths = [m.health_score for m in transformer_metrics + line_metrics]
        grid_health = sum(all_healths) / len(all_healths) if all_healths else 100.0

        # Outage Probability is max of individual outage probabilities
        max_outage_prob = max([m.outage_probability for m in transformer_metrics + line_metrics]) if all_healths else 0.0

        # Calculate stability index based on average frequency deviations and voltage deviations
        voltages = [line.voltage_pu for line in topology.transmission_lines.values() if line.voltage_pu > 0.1]
        avg_v = sum(voltages) / len(voltages) if voltages else 1.0
        v_dev = abs(1.0 - avg_v)

        stability_score = 100.0 - (v_dev * 200.0)
        stability_score = max(20.0, min(100.0, stability_score))

        return {
            "grid_health_score": round(grid_health, 1),
            "stability_score": round(stability_score, 1),
            "outage_probability": round(max_outage_prob, 3),
            "transformer_healths": {m.asset_id: m.dict() for m in transformer_metrics},
            "line_healths": {m.asset_id: m.dict() for m in line_metrics}
        }
