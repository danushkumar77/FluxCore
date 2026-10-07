from app.domain.entities.Asset import Asset

class BatteryAsset(Asset):
    def __init__(self, **data):
        super().__init__(**data)
        self.type = "Battery"
        if not self.telemetry:
            self.telemetry = {
                "soc": 75.0,                 # % (State of Charge)
                "soh": 98.0,                 # % (State of Health)
                "cell_temp": 28.0,           # °C
                "max_cell_voltage": 3.82,    # V
                "min_cell_voltage": 3.79,    # V
                "internal_resistance": 15.0, # mΩ
                "charge_cycles": 240,        # count
                "current_draw": -50.0        # A (negative = discharging, positive = charging)
            }
