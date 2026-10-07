import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.domain.interfaces.IAssetRepository import IAssetRepository
from app.domain.entities.Asset import Asset
from app.domain.entities.Transformer import Transformer
from app.domain.entities.CircuitBreaker import CircuitBreaker
from app.domain.entities.TransmissionLine import TransmissionLine
from app.domain.entities.RenewableAsset import RenewableAsset
from app.domain.entities.BatteryAsset import BatteryAsset

class AssetRepository(IAssetRepository):
    def __init__(self, filepath="backend/app/infrastructure/database/assets.json"):
        self.filepath = filepath
        self.assets: Dict[str, Asset] = {}
        self._load()

    def _load(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    data = json.load(f)
                    for asset_id, item in data.items():
                        self.assets[asset_id] = self._create_asset_entity(item)
            except Exception as e:
                print(f"Error loading assets from JSON: {e}. Fallback to mock.")
                self._load_mocks()
        else:
            self._load_mocks()
            self.save_all()

    def _create_asset_entity(self, data: Dict[str, Any]) -> Asset:
        asset_type = data.get("type")
        if asset_type == "Transformer":
            return Transformer(**data)
        elif asset_type == "CircuitBreaker":
            return CircuitBreaker(**data)
        elif asset_type == "TransmissionLine":
            return TransmissionLine(**data)
        elif asset_type == "Renewable":
            return RenewableAsset(**data)
        elif asset_type == "Battery":
            return BatteryAsset(**data)
        else:
            return Asset(**data)

    def _load_mocks(self):
        mocks = [
            {
                "id": "T-101",
                "name": "Substation Alpha Main Transformer",
                "type": "Transformer",
                "station": "Substation Alpha",
                "installation_date": "2018-05-12",
                "status": "Warning",
                "health_index": 82.0,
                "criticality_score": 92.0,
                "risk_score": 16.5,
                "telemetry": {
                    "oil_temp": 79.5,
                    "winding_temp": 89.2,
                    "h2_gas": 95.0,
                    "c2h2_gas": 1.8,
                    "ch4_gas": 62.0,
                    "c2h4_gas": 45.0,
                    "breakdown_voltage": 52.0,
                    "moisture": 19.5,
                    "pd_level": 92.0,
                    "vibration": 2.1,
                    "load_factor": 84.0
                }
            },
            {
                "id": "T-102",
                "name": "Substation Beta Auxiliary Transformer",
                "type": "Transformer",
                "station": "Substation Beta",
                "installation_date": "2020-09-08",
                "status": "Healthy",
                "health_index": 96.0,
                "criticality_score": 75.0,
                "risk_score": 3.0,
                "telemetry": {
                    "oil_temp": 48.0,
                    "winding_temp": 52.4,
                    "h2_gas": 12.0,
                    "c2h2_gas": 0.1,
                    "ch4_gas": 5.0,
                    "c2h4_gas": 2.5,
                    "breakdown_voltage": 68.0,
                    "moisture": 11.2,
                    "pd_level": 42.0,
                    "vibration": 1.1,
                    "load_factor": 52.0
                }
            },
            {
                "id": "CB-201",
                "name": "Alpha Busbar 1 Interrupter",
                "type": "CircuitBreaker",
                "station": "Substation Alpha",
                "installation_date": "2015-11-22",
                "status": "Warning",
                "health_index": 72.0,
                "criticality_score": 85.0,
                "risk_score": 23.8,
                "telemetry": {
                    "switching_operations": 812,
                    "contact_wear": 26.5,
                    "operation_time": 51.5,
                    "sf6_pressure": 5.75,
                    "coil_current": 2.85,
                    "ambient_temp": 24.5
                }
            },
            {
                "id": "L-301",
                "name": "Alpha-Beta Link Transmission Line",
                "type": "TransmissionLine",
                "station": "Grid Segment West",
                "installation_date": "2010-06-15",
                "status": "Healthy",
                "health_index": 90.0,
                "criticality_score": 88.0,
                "risk_score": 8.8,
                "telemetry": {
                    "conductor_temp": 42.5,
                    "sag": 1.62,
                    "wind_speed": 4.8,
                    "current_load": 612.0,
                    "mechanical_tension": 24.5,
                    "leakage_current": 0.38,
                    "ambient_temp": 22.0
                }
            },
            {
                "id": "WT-401",
                "name": "FluxWind Turbine #04",
                "type": "Renewable",
                "subtype": "Wind",
                "station": "FluxWind Array West",
                "installation_date": "2021-03-30",
                "status": "Warning",
                "health_index": 64.0,
                "criticality_score": 68.0,
                "risk_score": 24.5,
                "telemetry": {
                    "rotor_speed": 16.5,
                    "turbine_vibration": 0.29,
                    "gearbox_oil_temp": 79.2,
                    "blade_pitch_angle": 3.8,
                    "power_output": 1.45,
                    "nacelle_temp": 48.0,
                    "ambient_temp": 21.5
                }
            },
            {
                "id": "PV-501",
                "name": "FluxSolar Array Core Inverter 1",
                "type": "Renewable",
                "subtype": "Solar",
                "station": "FluxSolar Flatlands",
                "installation_date": "2022-07-14",
                "status": "Healthy",
                "health_index": 95.0,
                "criticality_score": 60.0,
                "risk_score": 3.0,
                "telemetry": {
                    "panel_temp": 44.5,
                    "inverter_efficiency": 96.8,
                    "string_current": 8.8,
                    "irradiance": 890.0,
                    "dc_voltage": 630.0,
                    "dust_degradation": 1.4,
                    "power_output": 0.28,
                    "ambient_temp": 26.0
                }
            },
            {
                "id": "B-601",
                "name": "Substation Alpha Battery Bank A",
                "type": "Battery",
                "station": "Substation Alpha",
                "installation_date": "2023-01-20",
                "status": "Critical",
                "health_index": 44.0,
                "criticality_score": 90.0,
                "risk_score": 50.4,
                "telemetry": {
                    "soc": 68.0,
                    "soh": 85.0,
                    "cell_temp": 48.2,
                    "max_cell_voltage": 3.98,
                    "min_cell_voltage": 3.75,
                    "internal_resistance": 28.5,
                    "charge_cycles": 1150,
                    "current_draw": -180.0
                }
            }
        ]
        for item in mocks:
            self.assets[item["id"]] = self._create_asset_entity(item)

    def get_by_id(self, asset_id: str) -> Optional[Asset]:
        return self.assets.get(asset_id)

    def get_all(self) -> List[Asset]:
        return list(self.assets.values())

    def save(self, asset: Asset) -> None:
        self.assets[asset.id] = asset
        self.save_all()

    def save_all(self) -> None:
        data = {asset_id: asset.model_dump() for asset_id, asset in self.assets.items()}
        # Handle datetime serialization
        def serialize_dt(o):
            if isinstance(o, datetime):
                return o.isoformat()
            raise TypeError("Type not serializable")
        
        with open(self.filepath, 'w') as f:
            json.dump(data, f, indent=2, default=serialize_dt)
