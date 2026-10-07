import asyncio
import random
import logging
from datetime import datetime
from uuid import UUID, uuid4
from app.core.config import get_settings
from app.core.event_bus import event_bus
from app.domain.contracts.events import TelemetryUpdatedEvent
from app.domain.contracts.telemetry import TelemetryMeasurement
from app.engines.pipeline import data_validation_pipeline
from app.infrastructure.cache import cache_layer
from app.api.websocket import websocket_manager

logger = logging.getLogger("FluxCore.TelemetryWorker")

class TelemetryWorker:
    def __init__(self, interval_seconds: float = 3.0):
        self.interval_seconds = interval_seconds
        self.running = False
        self._task: Optional[asyncio.Task] = None
        
        # Static mock asset IDs for simulation
        self.site_id = uuid4()
        self.battery_id = uuid4()
        self.transformer_id = uuid4()

    def start(self):
        if not self.running:
            self.running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info("Background Telemetry Simulation Worker started.")

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("Background Telemetry Simulation Worker stopped.")

    async def _run_loop(self):
        settings = get_settings()
        while self.running:
            if not settings.SIMULATE_LIVE_TELEMETRY:
                await asyncio.sleep(5.0)
                continue

            try:
                # 1. Simulate grid measurements
                raw = {
                    "asset_id": str(self.transformer_id),
                    "voltage_kv": round(115.0 + random.normalvariate(0, 1.2), 2),
                    "current_a": round(400.0 + random.normalvariate(0, 15), 2),
                    "frequency_hz": round(50.0 + random.normalvariate(0, 0.08), 3),
                    "active_power_mw": round(80.0 + random.normalvariate(0, 4.0), 2),
                    "reactive_power_mvar": round(15.0 + random.normalvariate(0, 2.0), 2),
                    
                    "battery_soc_pct": round(max(0, min(100, 75.0 + random.normalvariate(0, 0.5))), 1),
                    "battery_soh_pct": 98.4,
                    "battery_temp_c": round(25.0 + random.normalvariate(0, 0.2), 1),
                    
                    "market_price_mwh": round(45.0 + random.normalvariate(0, 3.5), 2),
                    "carbon_intensity_g_kwh": round(220.0 + random.normalvariate(0, 8.0), 1),
                    "timestamp": datetime.utcnow().isoformat()
                }

                # Introduce random temporary anomalous spike to demonstrate outlier pipeline logic
                if random.random() < 0.05:
                    raw["voltage_kv"] = 150.0 # Clear outlier
                    logger.warning("SIMULATION: Injected random voltage spike anomaly.")

                # 2. Run Data Ingestion & Validation Pipeline
                is_valid, cleaned, issues = data_validation_pipeline.validate_and_clean(raw)
                for issue in issues:
                    logger.warning(f"Data Pipeline warning: {issue}")

                # 3. Create Typed Telemetry Measurement
                measurement = TelemetryMeasurement(
                    asset_id=UUID(cleaned["asset_id"]),
                    timestamp=datetime.fromisoformat(cleaned["timestamp"]),
                    voltage_kv=cleaned["voltage_kv"],
                    current_a=cleaned["current_a"],
                    frequency_hz=cleaned["frequency_hz"],
                    active_power_mw=cleaned["active_power_mw"],
                    reactive_power_mvar=cleaned["reactive_power_mvar"],
                    battery_soc_pct=cleaned["battery_soc_pct"],
                    battery_soh_pct=cleaned["battery_soh_pct"],
                    battery_temp_c=cleaned["battery_temp_c"],
                    market_price_mwh=cleaned["market_price_mwh"],
                    carbon_intensity_g_kwh=cleaned["carbon_intensity_g_kwh"]
                )

                # 4. Cache telemetry
                await cache_layer.cache_telemetry(cleaned["asset_id"], measurement.model_dump(), ttl=15)

                # 5. Publish to Event Bus
                event = TelemetryUpdatedEvent(
                    producer="TelemetryWorker",
                    payload=measurement.model_dump()
                )
                await event_bus.publish(event)

                # 6. Stream Live over WebSocket room
                await websocket_manager.broadcast_to_room("telemetry", measurement.model_dump())

            except Exception as e:
                logger.error(f"Error in Telemetry simulation worker: {e}")

            await asyncio.sleep(self.interval_seconds)

# Global instance for DI
telemetry_worker = TelemetryWorker()
