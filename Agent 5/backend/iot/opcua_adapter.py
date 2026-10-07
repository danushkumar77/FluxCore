from typing import Dict, Any

class OPCUAAdapter:
    def __init__(self, gateway):
        self.gateway = gateway

    def handle_node_change(self, node_id: str, value: Any) -> Dict[str, Any]:
        """
        Receives OPC-UA node updates, e.g. ns=2;s=SubstationAlpha.T_101.OilTemp
        """
        try:
            # Parse string node identifier
            parts = node_id.split(";s=")
            if len(parts) < 2:
                return {"status": "error", "message": "Invalid NodeId format"}
                
            path = parts[1]
            path_parts = path.split(".")
            # Expected format: SubstationName.Asset_ID.MetricName
            if len(path_parts) < 3:
                return {"status": "error", "message": "Insufficient NodePath depth"}
                
            asset_raw = path_parts[1]
            metric_raw = path_parts[2]
            
            # Map T_101 -> T-101
            asset_id = asset_raw.replace("_", "-")
            
            # Map metric name
            metric_mapping = {
                "OilTemp": "oil_temp",
                "WindingTemp": "winding_temp",
                "SF6Pressure": "sf6_pressure",
                "Vibration": "vibration",
                "ConductorTemp": "conductor_temp",
                "StateOfHealth": "soh"
            }
            
            metric_name = metric_mapping.get(metric_raw, metric_raw.lower())
            return self.gateway.ingest_telemetry(asset_id, {metric_name: value})
        except Exception as e:
            return {"status": "error", "message": f"OPC-UA node decode failure: {e}"}
