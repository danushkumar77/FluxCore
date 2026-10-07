from app.domain.entities.Asset import Asset

class Transformer(Asset):
    def __init__(self, **data):
        super().__init__(**data)
        self.type = "Transformer"
        # Default telemetry if not set
        if not self.telemetry:
            self.telemetry = {
                "oil_temp": 45.0,           # °C
                "winding_temp": 50.0,       # °C
                "h2_gas": 15.0,             # ppm (Hydrogen)
                "c2h2_gas": 0.2,            # ppm (Acetylene)
                "ch4_gas": 5.0,             # ppm (Methane)
                "c2h4_gas": 2.0,            # ppm (Ethylene)
                "breakdown_voltage": 65.0,  # kV (Oil quality)
                "moisture": 12.0,           # ppm
                "pd_level": 50.0,           # pC (Partial discharge)
                "vibration": 1.2,           # mm/s
                "load_factor": 60.0         # %
            }
