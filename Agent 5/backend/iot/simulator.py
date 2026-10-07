import asyncio
import random
from typing import Dict, Any
from iot.sensor_gateway import SensorGateway
from app.infrastructure.repositories.AssetRepository import AssetRepository

class TelemetrySimulator:
    def __init__(self, gateway: SensorGateway, asset_repo: AssetRepository):
        self.gateway = gateway
        self.asset_repo = asset_repo
        self.running = False
        self.task = None

    def start(self):
        if not self.running:
            self.running = True
            self.task = asyncio.create_task(self._simulation_loop())
            print("Telemetry Simulator background worker started.")

    def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            print("Telemetry Simulator background worker stopped.")

    async def _simulation_loop(self):
        while self.running:
            try:
                assets = self.asset_repo.get_all()
                for asset in assets:
                    new_telemetry = dict(asset.telemetry)
                    
                    # Apply simulation logic based on asset type
                    if asset.type == "Transformer":
                        # Standard random walk
                        new_telemetry["oil_temp"] = max(30.0, min(100.0, new_telemetry.get("oil_temp", 45.0) + random.normalvariate(0.1, 0.3)))
                        new_telemetry["winding_temp"] = new_telemetry["oil_temp"] + random.uniform(5.0, 12.0)
                        new_telemetry["h2_gas"] = max(5.0, new_telemetry.get("h2_gas", 15.0) + random.uniform(0.0, 0.8))
                        # Slow degradation on breakdown voltage if temperature is high
                        if new_telemetry["oil_temp"] > 75.0:
                            new_telemetry["breakdown_voltage"] = max(30.0, new_telemetry.get("breakdown_voltage", 65.0) - random.uniform(0.05, 0.2))
                            new_telemetry["c2h2_gas"] = max(0.0, new_telemetry.get("c2h2_gas", 0.2) + random.uniform(0.01, 0.05))
                            
                    elif asset.type == "CircuitBreaker":
                        # Contact wear slowly increases if switching happens
                        if random.random() > 0.9:  # 10% chance of a switching operation
                            new_telemetry["switching_operations"] = int(new_telemetry.get("switching_operations", 150) + 1)
                            new_telemetry["contact_wear"] = min(100.0, new_telemetry.get("contact_wear", 5.0) + random.uniform(0.05, 0.15))
                            new_telemetry["operation_time"] = max(35.0, min(90.0, new_telemetry.get("operation_time", 40.0) + random.normalvariate(0.05, 0.2)))
                        # Slow leakage of SF6 pressure
                        new_telemetry["sf6_pressure"] = max(3.0, new_telemetry.get("sf6_pressure", 6.2) - random.uniform(0.001, 0.005))
                        
                    elif asset.type == "TransmissionLine":
                        # sag is linked to current load and conductor temp
                        load = max(100.0, min(1000.0, new_telemetry.get("current_load", 450.0) + random.normalvariate(5.0, 25.0)))
                        new_telemetry["current_load"] = load
                        new_telemetry["conductor_temp"] = max(20.0, min(110.0, 25.0 + (load / 10.0) + random.normalvariate(0.0, 1.0)))
                        # Sag increases as conductor temp rises
                        new_telemetry["sag"] = max(0.5, min(6.0, 1.0 + (new_telemetry["conductor_temp"] / 40.0) + random.normalvariate(0.0, 0.05)))
                        
                    elif asset.type == "Renewable":
                        subtype = getattr(asset, "subtype", "Wind")
                        if subtype == "Wind":
                            # Rotor speed correlates with wind fluctuation
                            speed = max(5.0, min(22.0, new_telemetry.get("rotor_speed", 15.0) + random.normalvariate(0.0, 0.5)))
                            new_telemetry["rotor_speed"] = speed
                            new_telemetry["power_output"] = max(0.0, min(3.0, (speed / 7.0) + random.normalvariate(0.0, 0.1)))
                            # Vibration drifts up
                            new_telemetry["turbine_vibration"] = max(0.05, min(0.8, new_telemetry.get("turbine_vibration", 0.15) + random.normalvariate(0.001, 0.005)))
                            new_telemetry["gearbox_oil_temp"] = 40.0 + (speed * 1.5) + (new_telemetry["turbine_vibration"] * 50.0)
                        else:  # Solar
                            # Irradiance fluctuates (day/night loop simulator)
                            irr = max(100.0, min(1100.0, new_telemetry.get("irradiance", 800.0) + random.normalvariate(5.0, 20.0)))
                            new_telemetry["irradiance"] = irr
                            new_telemetry["power_output"] = max(0.0, min(0.35, (irr / 3000.0)))
                            new_telemetry["panel_temp"] = 25.0 + (irr / 40.0) + random.normalvariate(0.0, 0.5)
                            # Dust degradation slowly rises unless cleaned
                            new_telemetry["dust_degradation"] = min(20.0, new_telemetry.get("dust_degradation", 1.2) + random.uniform(0.001, 0.004))
                            
                    elif asset.type == "Battery":
                        # Battery charge/discharge cycles
                        soc = new_telemetry.get("soc", 75.0)
                        current = new_telemetry.get("current_draw", -50.0)
                        
                        # SoC update
                        soc += (current / 3600.0) * 100.0  # simple integration
                        if soc >= 100.0:
                            soc = 100.0
                            current = -50.0  # switch to discharge
                        elif soc <= 10.0:
                            soc = 10.0
                            current = 80.0  # switch to charge
                            new_telemetry["charge_cycles"] = int(new_telemetry.get("charge_cycles", 240) + 1)
                            # SOH drops slightly per cycle
                            new_telemetry["soh"] = max(60.0, new_telemetry.get("soh", 98.0) - random.uniform(0.01, 0.03))
                            new_telemetry["internal_resistance"] = min(100.0, new_telemetry.get("internal_resistance", 15.0) + random.uniform(0.01, 0.05))

                        new_telemetry["soc"] = soc
                        new_telemetry["current_draw"] = current
                        
                        # cell temperature rises during heavy charging/discharging
                        new_telemetry["cell_temp"] = max(20.0, min(65.0, 25.0 + (abs(current) / 8.0) + random.normalvariate(0.0, 0.2)))
                        # cell imbalance
                        new_telemetry["max_cell_voltage"] = max(3.7, min(4.2, 3.8 + (soc / 250.0) + random.uniform(0.01, 0.03)))
                        new_telemetry["min_cell_voltage"] = max(3.5, min(4.2, 3.8 + (soc / 250.0) - random.uniform(0.01, 0.05)))
                    
                    # Send updated telemetry to gateway
                    self.gateway.ingest_telemetry(asset.id, new_telemetry)
                    
                # Run every 5 seconds
                await asyncio.sleep(5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Simulator error: {e}")
                await asyncio.sleep(5)
