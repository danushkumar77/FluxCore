from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4

class TelemetryMeasurement(BaseModel):
    measurement_id: UUID = Field(default_factory=uuid4)
    asset_id: UUID
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Basic Electrical Measurements
    voltage_kv: Optional[float] = Field(None, description="Voltage in Kilovolts")
    current_a: Optional[float] = Field(None, description="Current in Amperes")
    frequency_hz: Optional[float] = Field(None, description="Grid Frequency in Hertz")
    active_power_mw: Optional[float] = Field(None, description="Active Power in Megawatts")
    reactive_power_mvar: Optional[float] = Field(None, description="Reactive Power in Megavars")
    energy_kwh: Optional[float] = Field(None, description="Total Energy in Kilowatt-hours")
    temperature_c: Optional[float] = Field(None, description="Ambient or Equipment Temperature in Celsius")

    # Meteorological Measurements
    wind_speed_m_s: Optional[float] = Field(None, description="Wind speed in meters/second")
    solar_irradiance_w_m2: Optional[float] = Field(None, description="Solar irradiance in Watts/sq meter")

    # Battery Specific
    battery_soc_pct: Optional[float] = Field(None, description="State of Charge (0-100%)")
    battery_soh_pct: Optional[float] = Field(None, description="State of Health (0-100%)")
    battery_temp_c: Optional[float] = Field(None, description="Battery Core Temperature in Celsius")

    # Market & Carbon Parameters
    market_price_mwh: Optional[float] = Field(None, description="Energy price per Megawatt-hour")
    carbon_intensity_g_kwh: Optional[float] = Field(None, description="Carbon intensity in grams of CO2 per Kilowatt-hour")

    @field_validator("voltage_kv")
    def validate_voltage(cls, v):
        if v is not None and v < 0:
            raise ValueError("Voltage cannot be negative")
        return v

    @field_validator("frequency_hz")
    def validate_frequency(cls, v):
        if v is not None and (v < 40 or v > 70):
            raise ValueError("Grid frequency must be between 40Hz and 70Hz")
        return v

    @field_validator("battery_soc_pct", "battery_soh_pct")
    def validate_pct(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Percentage value must be between 0 and 100")
        return v
