import random
import uuid
from datetime import datetime
from typing import List, Optional
from backend.app.domain.entities import BatteryTelemetry, BatteryContainer
from backend.app.domain.interfaces import TelemetryRepository
from backend.app.core.event_bus import EventBus, EventContract, event_bus_instance

class TelemetryService:
    def __init__(self, telemetry_repo: TelemetryRepository, event_bus: EventBus = event_bus_instance):
        self.telemetry_repo = telemetry_repo
        self.event_bus = event_bus

    async def generate_simulated_telemetry(self, container: BatteryContainer) -> BatteryTelemetry:
        correlation_id = str(uuid.uuid4())
        
        # Calculate derived voltages and temperatures based on status
        if container.status == "CHARGING":
            current_draw_a = container.active_power_kw * 1000 / 480.0
            avg_temp_delta = 2.5
        elif container.status == "DISCHARGING":
            current_draw_a = -container.active_power_kw * 1000 / 480.0
            avg_temp_delta = 4.0
        else:
            current_draw_a = 0.0
            avg_temp_delta = -0.5
            
        ambient = 25.0 + 8.0 * random.uniform(-1, 1)
        # Compute cell averages
        avg_voltage = 3.2 + (container.soc / 100.0) * 0.95
        avg_temp = max(18.0, 25.0 + avg_temp_delta + (ambient - 25.0) * 0.2 + random.uniform(-0.2, 0.2))
        
        # Grid indicators
        freq = 60.0 + random.uniform(-0.05, 0.05)
        voltage = 480.0 + random.uniform(-3, 3)
        
        # Forecast indicators
        solar = max(0.0, 450.0 - 5.0 * (datetime.utcnow().hour - 12)**2)
        demand = 500.0 + 200.0 * random.uniform(-0.5, 0.5)
        
        # Electricity market pricing simulation: high during morning and evening peaks, low during mid-day
        hour = datetime.utcnow().hour
        if 8 <= hour <= 10 or 17 <= hour <= 21:
            price = 150.0 + 100.0 * random.uniform(0.5, 1.5)
        elif 11 <= hour <= 15:
            price = 20.0 + 20.0 * random.uniform(-0.5, 0.5)  # Solar solar peak price dump
        else:
            price = 45.0 + 15.0 * random.uniform(-0.5, 0.5)
            
        telemetry = BatteryTelemetry(
            telemetry_id=f"TEL-{str(uuid.uuid4())[:8]}",
            container_id=container.container_id,
            timestamp=datetime.utcnow(),
            soc=container.soc,
            soh=container.soh,
            avg_cell_voltage=avg_voltage,
            avg_cell_temp=avg_temp,
            charge_cycles=int(5000 * (100.0 - container.soh) / 20.0),
            current_draw_a=current_draw_a,
            frequency_hz=freq,
            grid_voltage_v=voltage,
            ambient_temp=ambient,
            solar_forecast_kw=solar,
            demand_forecast_kw=demand,
            market_price_usd=price
        )
        
        await self.telemetry_repo.save_telemetry(telemetry)
        
        # Publish event
        event = EventContract(
            event_type="battery.telemetry.updated",
            correlation_id=correlation_id,
            payload=telemetry.dict()
        )
        await self.event_bus.publish(event)
        
        return telemetry

    async def get_latest_telemetry(self, container_id: str) -> Optional[BatteryTelemetry]:
        return await self.telemetry_repo.get_latest_telemetry(container_id)

    async def get_historical_telemetry(self, container_id: str, limit: int = 100) -> List[BatteryTelemetry]:
        return await self.telemetry_repo.get_historical_telemetry(container_id, limit)
