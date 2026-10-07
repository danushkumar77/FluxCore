from app.domain.entities.Asset import Asset

class CircuitBreaker(Asset):
    def __init__(self, **data):
        super().__init__(**data)
        self.type = "CircuitBreaker"
        if not self.telemetry:
            self.telemetry = {
                "switching_operations": 150,  # Count
                "contact_wear": 5.0,         # %
                "operation_time": 42.0,      # ms
                "sf6_pressure": 6.2,         # bar (SF6 gas pressure)
                "coil_current": 2.1,         # A
                "ambient_temp": 25.0         # °C
            }
