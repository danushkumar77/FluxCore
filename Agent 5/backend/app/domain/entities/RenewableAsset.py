from app.domain.entities.Asset import Asset

class RenewableAsset(Asset):
    subtype: str = "Wind"  # "Wind" or "Solar"

    def __init__(self, **data):
        super().__init__(**data)
        self.type = "Renewable"
        if not self.telemetry:
            if self.subtype == "Wind":
                self.telemetry = {
                    "rotor_speed": 15.0,         # rpm
                    "turbine_vibration": 0.15,   # g (vibration level)
                    "gearbox_oil_temp": 62.0,    # °C
                    "blade_pitch_angle": 2.5,    # degrees
                    "power_output": 1.8,         # MW
                    "nacelle_temp": 45.0,        # °C
                    "ambient_temp": 22.0         # °C
                }
            else:  # Solar
                self.telemetry = {
                    "panel_temp": 42.0,          # °C
                    "inverter_efficiency": 97.5, # %
                    "string_current": 8.5,       # A
                    "irradiance": 850.0,         # W/m²
                    "dc_voltage": 620.0,         # V
                    "dust_degradation": 1.2,     # %
                    "power_output": 0.25,        # MW
                    "ambient_temp": 25.0         # °C
                }
