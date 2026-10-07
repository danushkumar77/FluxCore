from typing import Dict, Any, List
from app.domain.aggregates.grid_aggregates import GridTopology

class DigitalTwinService:
    def generate_twin_payload(self, topology: GridTopology, active_faults: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes domain topology into visual structures for frontend Three.js/React Flow twin rendering.
        """
        nodes = []
        edges = []

        # Substations
        for s_id, s in topology.substations.items():
            # Check if substation has an active transformer fault
            status = "HEALTHY"
            for t_id in s.transformers:
                t = topology.transformers.get(t_id)
                if t and t.status in ["WARNING", "CRITICAL"]:
                    status = t.status

            nodes.append({
                "id": s_id,
                "type": "substation",
                "label": s.name,
                "voltage_level_kv": s.voltage_level_kv,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "status": status,
                "transformers": [t_id for t_id in s.transformers],
                "breakers": [b_id for b_id in s.breakers]
            })

        # Transmission Lines
        for line_id, line in topology.transmission_lines.items():
            # Check if line is faulted or isolated
            status = line.status
            if topology.is_line_isolated(line_id):
                status = "ISOLATED"
            elif line_id in active_faults:
                status = "FAULTED"

            edges.append({
                "id": line_id,
                "from": line.from_substation,
                "to": line.to_substation,
                "voltage_pu": line.voltage_pu,
                "current_rms": line.current_rms,
                "active_power_mw": line.active_power_mw,
                "reactive_power_mvar": line.reactive_power_mvar,
                "harmonics_thd": line.harmonics_thd,
                "status": status
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "active_faults": active_faults,
            "overall_status": "CRITICAL" if any(e["status"] == "FAULTED" for e in edges) else "HEALTHY"
        }
