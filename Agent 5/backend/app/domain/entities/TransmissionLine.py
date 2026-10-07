from app.domain.entities.Asset import Asset

class TransmissionLine(Asset):
    def __init__(self, **data):
        super().__init__(**data)
        self.type = "TransmissionLine"
        if not self.telemetry:
            self.telemetry = {
                "conductor_temp": 40.0,       # °C
                "sag": 1.5,                  # meters (sag distance)
                "wind_speed": 5.0,           # m/s
                "current_load": 450.0,       # A
                "mechanical_tension": 25.0,  # kN
                "leakage_current": 0.5,      # mA (corrosion/insulator health)
                "ambient_temp": 25.0         # °C
            }
