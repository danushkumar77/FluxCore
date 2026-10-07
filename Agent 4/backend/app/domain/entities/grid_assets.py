from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Transformer(BaseModel):
    id: str
    name: str
    substation_id: str
    load_percentage: float = 0.0          # %
    winding_temperature: float = 40.0      # °C
    top_oil_temperature: float = 35.0      # °C
    partial_discharge: float = 10.0         # pC
    vibration: float = 15.0                # um
    insulation_resistance: float = 1000.0  # MOhm
    cooling_active: bool = False
    status: str = "HEALTHY"                # HEALTHY, WARNING, CRITICAL

class TransmissionLine(BaseModel):
    id: str
    name: str
    from_substation: str
    to_substation: str
    voltage_pu: float = 1.0                # pu (nominal is 1.0)
    current_rms: float = 0.5               # per unit or Amps relative to nominal
    frequency_hz: float = 60.0
    active_power_mw: float = 100.0
    reactive_power_mvar: float = 15.0
    harmonics_thd: float = 0.8             # %
    power_factor: float = 0.98
    impedance_real: float = 0.05           # pu
    impedance_imag: float = 0.15           # pu
    status: str = "HEALTHY"                # HEALTHY, WARNING, CRITICAL, FAULTED

class Breaker(BaseModel):
    id: str
    name: str
    substation_id: str
    associated_line_id: Optional[str] = None
    associated_transformer_id: Optional[str] = None
    is_closed: bool = True
    failure_to_trip: bool = False
    last_toggle_time: float = 0.0          # Epoch timestamp

class Relay(BaseModel):
    id: str
    name: str
    substation_id: str
    associated_breaker_id: str
    mode_50_active: bool = True            # Instantaneous Overcurrent
    mode_51_active: bool = True            # Time-Delay Overcurrent
    mode_87T_active: bool = False          # Differential (true for transformer relays)
    mode_21_active: bool = False           # Distance (true for transmission line relays)
    trip_waveform_data: List[float] = Field(default_factory=list)
    status: str = "HEALTHY"                # HEALTHY, TRIPPED, FAULTED

class Substation(BaseModel):
    id: str
    name: str
    transformers: List[str] = Field(default_factory=list)
    breakers: List[str] = Field(default_factory=list)
    relays: List[str] = Field(default_factory=list)
    voltage_level_kv: float = 230.0        # kV
    latitude: float
    longitude: float
