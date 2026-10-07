from typing import Dict, Any, List

class DigitalTwinService:
    def __init__(self):
        pass

    def get_digital_twin_geometry(self, asset_id: str, asset_type: str) -> Dict[str, Any]:
        """
        Returns structural bounding boxes, cooling lines, and sensor coordinates
        to map physical indicators to the React Three Fiber viewport.
        """
        if asset_type == "Transformer":
            return {
                "asset_id": asset_id,
                "asset_type": asset_type,
                "components": [
                    {"name": "oil_tank", "type": "box", "position": [0, 0, 0], "scale": [3, 2, 2], "color": "#1f2d3d"},
                    {"name": "conservator", "type": "cylinder", "position": [0, 1.3, -0.5], "scale": [0.6, 0.6, 2], "color": "#2c3e50"},
                    {"name": "bushing_a", "type": "cylinder", "position": [-0.8, 1.2, 0.5], "scale": [0.15, 1.0, 0.15], "color": "#7f8c8d"},
                    {"name": "bushing_b", "type": "cylinder", "position": [0, 1.2, 0.5], "scale": [0.15, 1.0, 0.15], "color": "#7f8c8d"},
                    {"name": "bushing_c", "type": "cylinder", "position": [0.8, 1.2, 0.5], "scale": [0.15, 1.0, 0.15], "color": "#7f8c8d"},
                    {"name": "radiator_fins_left", "type": "box", "position": [-1.6, 0, 0], "scale": [0.2, 1.6, 1.8], "color": "#34495e"},
                    {"name": "radiator_fins_right", "type": "box", "position": [1.6, 0, 0], "scale": [0.2, 1.6, 1.8], "color": "#34495e"},
                    {"name": "cooling_fan_1", "type": "cylinder", "position": [-1.75, -0.4, 0], "scale": [0.1, 0.5, 0.5], "color": "#95a5a6"},
                    {"name": "cooling_fan_2", "type": "cylinder", "position": [1.75, -0.4, 0], "scale": [0.1, 0.5, 0.5], "color": "#95a5a6"}
                ],
                "sensor_positions": {
                    "oil_temp": [0, 0.5, 0],
                    "winding_temp": [0, -0.2, 0.2],
                    "pd_level": [0.8, 0.8, 0.3],
                    "vibration": [1.5, -0.5, 0.8]
                },
                "hotspots": [
                    {"name": "core_winding", "position": [0, -0.3, 0.1], "radius": 0.6}
                ]
            }
            
        elif asset_type == "CircuitBreaker":
            return {
                "asset_id": asset_id,
                "asset_type": asset_type,
                "components": [
                    {"name": "control_cabinet", "type": "box", "position": [0, -0.8, 0], "scale": [1.2, 0.8, 1.0], "color": "#2c3e50"},
                    {"name": "support_column_a", "type": "cylinder", "position": [-0.6, 0.4, 0], "scale": [0.2, 1.6, 0.2], "color": "#bdc3c7"},
                    {"name": "support_column_b", "type": "cylinder", "position": [0.6, 0.4, 0], "scale": [0.2, 1.6, 0.2], "color": "#bdc3c7"},
                    {"name": "interrupter_head_a", "type": "cylinder", "position": [-0.6, 1.3, 0], "scale": [0.4, 0.6, 0.8], "color": "#7f8c8d", "rotation": [0, 0, 1.57]},
                    {"name": "interrupter_head_b", "type": "cylinder", "position": [0.6, 1.3, 0], "scale": [0.4, 0.6, 0.8], "color": "#7f8c8d", "rotation": [0, 0, 1.57]}
                ],
                "sensor_positions": {
                    "sf6_pressure": [-0.6, 0.2, 0],
                    "contact_wear": [0.6, 1.3, 0],
                    "operation_time": [0, -0.6, 0]
                },
                "hotspots": [
                    {"name": "contacts_erosion_zone", "position": [0.6, 1.3, 0], "radius": 0.35}
                ]
            }
            
        elif asset_type == "TransmissionLine":
            return {
                "asset_id": asset_id,
                "asset_type": asset_type,
                "components": [
                    {"name": "tower_base", "type": "box", "position": [0, -1.5, 0], "scale": [1.2, 1.0, 1.2], "color": "#7f8c8d"},
                    {"name": "tower_body", "type": "cylinder", "position": [0, 1.0, 0], "scale": [0.4, 4.0, 0.4], "color": "#bdc3c7"},
                    {"name": "cross_arm_lower", "type": "box", "position": [0, 2.0, 0], "scale": [3.6, 0.2, 0.4], "color": "#7f8c8d"},
                    {"name": "cross_arm_upper", "type": "box", "position": [0, 2.8, 0], "scale": [2.8, 0.2, 0.4], "color": "#7f8c8d"},
                    {"name": "insulator_a", "type": "cylinder", "position": [-1.7, 1.6, 0], "scale": [0.15, 0.6, 0.15], "color": "#ecf0f1"},
                    {"name": "insulator_b", "type": "cylinder", "position": [1.7, 1.6, 0], "scale": [0.15, 0.6, 0.15], "color": "#ecf0f1"},
                    {"name": "conductor_wire_a", "type": "line", "position": [-1.7, 1.3, 0], "scale": [1.0, 1.0, 1.0], "color": "#95a5a6"},
                    {"name": "conductor_wire_b", "type": "line", "position": [1.7, 1.3, 0], "scale": [1.0, 1.0, 1.0], "color": "#95a5a6"}
                ],
                "sensor_positions": {
                    "conductor_temp": [0, 1.3, 0],
                    "sag": [0, 0.8, 0]
                },
                "hotspots": [
                    {"name": "sag_peak", "position": [0, 0.5, 0], "radius": 0.4}
                ]
            }
            
        elif asset_type == "Renewable":
            # Assume Wind Turbine
            return {
                "asset_id": asset_id,
                "asset_type": asset_type,
                "components": [
                    {"name": "foundation", "type": "box", "position": [0, -2.5, 0], "scale": [2.0, 0.4, 2.0], "color": "#34495e"},
                    {"name": "tower", "type": "cylinder", "position": [0, 0.5, 0], "scale": [0.3, 6.0, 0.3], "color": "#ecf0f1"},
                    {"name": "nacelle", "type": "box", "position": [0, 3.6, 0], "scale": [1.0, 0.8, 1.6], "color": "#bdc3c7"},
                    {"name": "spinner_hub", "type": "cylinder", "position": [0, 3.6, 0.95], "scale": [0.4, 0.4, 0.3], "color": "#95a5a6", "rotation": [1.57, 0, 0]},
                    {"name": "blade_a", "type": "box", "position": [0, 4.8, 0.95], "scale": [0.2, 2.4, 0.05], "color": "#ffffff"},
                    {"name": "blade_b", "type": "box", "position": [-1.0, 3.0, 0.95], "scale": [0.2, 2.4, 0.05], "color": "#ffffff", "rotation": [0, 0, 2.09]},
                    {"name": "blade_c", "type": "box", "position": [1.0, 3.0, 0.95], "scale": [0.2, 2.4, 0.05], "color": "#ffffff", "rotation": [0, 0, -2.09]}
                ],
                "sensor_positions": {
                    "turbine_vibration": [0, 3.6, 0],
                    "gearbox_oil_temp": [0.2, 3.6, -0.4],
                    "rotor_speed": [0, 3.6, 0.8]
                },
                "hotspots": [
                    {"name": "bearing_gearbox", "position": [0, 3.6, -0.2], "radius": 0.45}
                ]
            }
            
        elif asset_type == "Battery":
            return {
                "asset_id": asset_id,
                "asset_type": asset_type,
                "components": [
                    {"name": "enclosure", "type": "box", "position": [0, 0, 0], "scale": [3.6, 2.0, 1.8], "color": "#2c3e50"},
                    {"name": "rack_1", "type": "box", "position": [-1.0, 0, 0], "scale": [0.8, 1.6, 1.4], "color": "#1a252f"},
                    {"name": "rack_2", "type": "box", "position": [0, 0, 0], "scale": [0.8, 1.6, 1.4], "color": "#1a252f"},
                    {"name": "rack_3", "type": "box", "position": [1.0, 0, 0], "scale": [0.8, 1.6, 1.4], "color": "#1a252f"},
                    {"name": "inverter_module", "type": "box", "position": [1.5, 0.5, 0.6], "scale": [0.4, 0.6, 0.4], "color": "#95a5a6"}
                ],
                "sensor_positions": {
                    "cell_temp": [0, 0.2, 0.1],
                    "soh": [-1.0, 0.5, 0.1],
                    "internal_resistance": [1.0, -0.5, 0.1]
                },
                "hotspots": [
                    {"name": "cell_runaway_rack_2", "position": [0, 0.3, 0], "radius": 0.5}
                ]
            }
        else:
            return {}
