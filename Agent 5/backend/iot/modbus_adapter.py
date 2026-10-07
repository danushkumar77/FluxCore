from typing import Dict, Any

class ModbusAdapter:
    def __init__(self, gateway):
        self.gateway = gateway
        # Slave ID to Asset ID mapping
        self.slave_mapping = {
            1: "T-101",
            2: "T-102",
            3: "CB-201",
            4: "L-301"
        }

    def decode_holding_registers(self, slave_id: int, registers: Dict[int, float]) -> Dict[str, Any]:
        """
        Simulate mapping holding registers to telemetry keys.
        Register 40001 = Temperature, 40002 = Vibration/wear, 40003 = Pressure.
        """
        asset_id = self.slave_mapping.get(slave_id)
        if not asset_id:
            return {"status": "error", "message": f"Unknown Modbus slave ID: {slave_id}"}
            
        telemetry = {}
        for reg_addr, val in registers.items():
            if reg_addr == 40001:
                telemetry["oil_temp"] = val
                telemetry["ambient_temp"] = val
                telemetry["cell_temp"] = val
                telemetry["panel_temp"] = val
                telemetry["conductor_temp"] = val
            elif reg_addr == 40002:
                telemetry["vibration"] = val
                telemetry["contact_wear"] = val
                telemetry["sag"] = val
            elif reg_addr == 40003:
                telemetry["sf6_pressure"] = val
                
        # Filter telemetry fields based on what the asset actually uses
        return self.gateway.ingest_telemetry(asset_id, telemetry)
