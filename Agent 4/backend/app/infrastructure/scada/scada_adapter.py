import random
import time
import math
from typing import Dict, List, Any
from app.domain.entities.grid_assets import Substation, TransmissionLine, Transformer, Breaker, Relay
from app.domain.aggregates.grid_aggregates import GridTopology
from app.domain.value_objects.telemetry import TelemetryFrame

class SCADASimulator:
    def __init__(self):
        # Initialize grid assets
        self.substations = {
            "S1": Substation(id="S1", name="North Substation", voltage_level_kv=230.0, latitude=40.7128, longitude=-74.0060, transformers=["T1"], breakers=["B1A", "B5A", "BT1P", "BT1S"], relays=["R1A", "R5A", "RT1P", "RT1S"]),
            "S2": Substation(id="S2", name="South Substation", voltage_level_kv=230.0, latitude=40.7589, longitude=-73.9851, transformers=["T2"], breakers=["B2A", "B5B", "BT2P", "BT2S"], relays=["R2A", "R5B", "RT2P", "RT2S"]),
            "S3": Substation(id="S3", name="East Substation", voltage_level_kv=138.0, latitude=40.7282, longitude=-73.7949, transformers=["T3"], breakers=["B3A", "B6A", "BT3P", "BT3S"], relays=["R3A", "R6A", "RT3P", "RT3S"]),
            "S4": Substation(id="S4", name="West Substation", voltage_level_kv=138.0, latitude=40.6413, longitude=-73.7781, transformers=[], breakers=["B4A", "B6B"], relays=["R4A", "R6B"]),
            "S5": Substation(id="S5", name="Central Hub", voltage_level_kv=230.0, latitude=40.7829, longitude=-73.9654, transformers=["T4"], breakers=["B1B", "B2B", "B3B", "B4B", "BT4P", "BT4S"], relays=["R1B", "R2B", "R3B", "R4B", "RT4P", "RT4S"])
        }

        self.transmission_lines = {
            "L1": TransmissionLine(id="L1", name="Line S1-S5", from_substation="S1", to_substation="S5", voltage_pu=1.0, current_rms=0.4, active_power_mw=80.0, reactive_power_mvar=8.0),
            "L2": TransmissionLine(id="L2", name="Line S2-S5", from_substation="S2", to_substation="S5", voltage_pu=1.0, current_rms=0.45, active_power_mw=90.0, reactive_power_mvar=10.0),
            "L3": TransmissionLine(id="L3", name="Line S3-S5", from_substation="S3", to_substation="S5", voltage_pu=1.0, current_rms=0.3, active_power_mw=40.0, reactive_power_mvar=5.0),
            "L4": TransmissionLine(id="L4", name="Line S4-S5", from_substation="S4", to_substation="S5", voltage_pu=1.0, current_rms=0.35, active_power_mw=48.0, reactive_power_mvar=6.0),
            "L5": TransmissionLine(id="L5", name="Line S1-S2", from_substation="S1", to_substation="S2", voltage_pu=1.0, current_rms=0.25, active_power_mw=50.0, reactive_power_mvar=4.0),
            "L6": TransmissionLine(id="L6", name="Line S3-S4", from_substation="S3", to_substation="S4", voltage_pu=1.0, current_rms=0.15, active_power_mw=20.0, reactive_power_mvar=2.0)
        }

        self.transformers = {
            "T1": Transformer(id="T1", name="Transformer T1", substation_id="S1", load_percentage=65.0, winding_temperature=62.0, top_oil_temperature=55.0, partial_discharge=12.0, vibration=14.0, insulation_resistance=850.0),
            "T2": Transformer(id="T2", name="Transformer T2", substation_id="S2", load_percentage=70.0, winding_temperature=68.0, top_oil_temperature=59.0, partial_discharge=15.0, vibration=16.0, insulation_resistance=780.0),
            "T3": Transformer(id="T3", name="Transformer T3", substation_id="S3", load_percentage=55.0, winding_temperature=58.0, top_oil_temperature=51.0, partial_discharge=8.0, vibration=12.0, insulation_resistance=900.0),
            "T4": Transformer(id="T4", name="Transformer T4 Autotransformer", substation_id="S5", load_percentage=80.0, winding_temperature=75.0, top_oil_temperature=65.0, partial_discharge=22.0, vibration=18.0, insulation_resistance=680.0)
        }

        self.breakers = {
            "B1A": Breaker(id="B1A", name="Breaker B1A", substation_id="S1", associated_line_id="L1"),
            "B1B": Breaker(id="B1B", name="Breaker B1B", substation_id="S5", associated_line_id="L1"),
            "B2A": Breaker(id="B2A", name="Breaker B2A", substation_id="S2", associated_line_id="L2"),
            "B2B": Breaker(id="B2B", name="Breaker B2B", substation_id="S5", associated_line_id="L2"),
            "B3A": Breaker(id="B3A", name="Breaker B3A", substation_id="S3", associated_line_id="L3"),
            "B3B": Breaker(id="B3B", name="Breaker B3B", substation_id="S5", associated_line_id="L3"),
            "B4A": Breaker(id="B4A", name="Breaker B4A", substation_id="S4", associated_line_id="L4"),
            "B4B": Breaker(id="B4B", name="Breaker B4B", substation_id="S5", associated_line_id="L4"),
            "B5A": Breaker(id="B5A", name="Breaker B5A", substation_id="S1", associated_line_id="L5"),
            "B5B": Breaker(id="B5B", name="Breaker B5B", substation_id="S2", associated_line_id="L5"),
            "B6A": Breaker(id="B6A", name="Breaker B6A", substation_id="S3", associated_line_id="L6"),
            "B6B": Breaker(id="B6B", name="Breaker B6B", substation_id="S4", associated_line_id="L6"),
            "BT1P": Breaker(id="BT1P", name="Breaker T1 Primary", substation_id="S1", associated_transformer_id="T1"),
            "BT1S": Breaker(id="BT1S", name="Breaker T1 Secondary", substation_id="S1", associated_transformer_id="T1"),
            "BT2P": Breaker(id="BT2P", name="Breaker T2 Primary", substation_id="S2", associated_transformer_id="T2"),
            "BT2S": Breaker(id="BT2S", name="Breaker T2 Secondary", substation_id="S2", associated_transformer_id="T2"),
            "BT3P": Breaker(id="BT3P", name="Breaker T3 Primary", substation_id="S3", associated_transformer_id="T3"),
            "BT3S": Breaker(id="BT3S", name="Breaker T3 Secondary", substation_id="S3", associated_transformer_id="T3"),
            "BT4P": Breaker(id="BT4P", name="Breaker T4 Primary", substation_id="S5", associated_transformer_id="T4"),
            "BT4S": Breaker(id="BT4S", name="Breaker T4 Secondary", substation_id="S5", associated_transformer_id="T4")
        }

        self.relays = {
            "R1A": Relay(id="R1A", name="Relay S1 L1 Protection", substation_id="S1", associated_breaker_id="B1A", mode_21_active=True),
            "R1B": Relay(id="R1B", name="Relay S5 L1 Protection", substation_id="S5", associated_breaker_id="B1B", mode_21_active=True),
            "R2A": Relay(id="R2A", name="Relay S2 L2 Protection", substation_id="S2", associated_breaker_id="B2A", mode_21_active=True),
            "R2B": Relay(id="R2B", name="Relay S5 L2 Protection", substation_id="S5", associated_breaker_id="B2B", mode_21_active=True),
            "R3A": Relay(id="R3A", name="Relay S3 L3 Protection", substation_id="S3", associated_breaker_id="B3A", mode_21_active=True),
            "R3B": Relay(id="R3B", name="Relay S5 L3 Protection", substation_id="S5", associated_breaker_id="B3B", mode_21_active=True),
            "R4A": Relay(id="R4A", name="Relay S4 L4 Protection", substation_id="S4", associated_breaker_id="B4A", mode_21_active=True),
            "R4B": Relay(id="R4B", name="Relay S5 L4 Protection", substation_id="S5", associated_breaker_id="B4B", mode_21_active=True),
            "R5A": Relay(id="R5A", name="Relay S1 L5 Protection", substation_id="S1", associated_breaker_id="B5A", mode_21_active=True),
            "R5B": Relay(id="R5B", name="Relay S2 L5 Protection", substation_id="S2", associated_breaker_id="B5B", mode_21_active=True),
            "R6A": Relay(id="R6A", name="Relay S3 L6 Protection", substation_id="S3", associated_breaker_id="B6A", mode_21_active=True),
            "R6B": Relay(id="R6B", name="Relay S4 L6 Protection", substation_id="S4", associated_breaker_id="B6B", mode_21_active=True),
            "RT1P": Relay(id="RT1P", name="Relay T1 Primary Protection", substation_id="S1", associated_breaker_id="BT1P", mode_87T_active=True),
            "RT1S": Relay(id="RT1S", name="Relay T1 Secondary Protection", substation_id="S1", associated_breaker_id="BT1S", mode_51_active=True),
            "RT2P": Relay(id="RT2P", name="Relay T2 Primary Protection", substation_id="S2", associated_breaker_id="BT2P", mode_87T_active=True),
            "RT2S": Relay(id="RT2S", name="Relay T2 Secondary Protection", substation_id="S2", associated_breaker_id="BT2S", mode_51_active=True),
            "RT3P": Relay(id="RT3P", name="Relay T3 Primary Protection", substation_id="S3", associated_breaker_id="BT3P", mode_87T_active=True),
            "RT3S": Relay(id="RT3S", name="Relay T3 Secondary Protection", substation_id="S3", associated_breaker_id="BT3S", mode_51_active=True),
            "RT4P": Relay(id="RT4P", name="Relay T4 Primary Protection", substation_id="S5", associated_breaker_id="BT4P", mode_87T_active=True),
            "RT4S": Relay(id="RT4S", name="Relay T4 Secondary Protection", substation_id="S5", associated_breaker_id="BT4S", mode_51_active=True)
        }

        # Fault simulation parameters
        self.active_faults = {} # key: target_id, value: fault_type, startTime, severity
        self.weather = "CLEAR" # CLEAR, STORM, LIGHTNING_STRIKE
        self.time_step = 0

    def get_topology(self) -> GridTopology:
        return GridTopology(
            substations=self.substations,
            transmission_lines=self.transmission_lines,
            breakers=self.breakers,
            relays=self.relays,
            transformers=self.transformers
        )

    def inject_fault(self, target_id: str, fault_type: str, severity: str = "CRITICAL"):
        self.active_faults[target_id] = {
            "type": fault_type,
            "severity": severity,
            "start_time": time.time()
        }

    def clear_fault(self, target_id: str):
        if target_id in self.active_faults:
            del self.active_faults[target_id]

    def step(self):
        self.time_step += 1
        # 1. Update weather conditions
        if self.time_step % 60 == 0:
            self.weather = random.choice(["CLEAR", "CLEAR", "CLEAR", "STORM", "STORM"])

        # 2. Simulate standard fluctuations + active faults on lines
        for line_id, line in self.transmission_lines.items():
            # Check if isolated (both terminal breakers open)
            breaker_from = [b for b in self.breakers.values() if b.associated_line_id == line_id and b.substation_id == line.from_substation][0]
            breaker_to = [b for b in self.breakers.values() if b.associated_line_id == line_id and b.substation_id == line.to_substation][0]

            if not breaker_from.is_closed or not breaker_to.is_closed:
                # Isolated line: no current, no power flow, voltage could be zero
                line.current_rms = 0.0
                line.active_power_mw = 0.0
                line.reactive_power_mvar = 0.0
                line.voltage_pu = 0.0
                line.status = "HEALTHY" # Isolated is technically not faulted anymore
                continue

            if line_id in self.active_faults:
                fault = self.active_faults[line_id]
                # High current, low voltage, high harmonics
                line.current_rms = random.uniform(4.5, 6.0) # IEEE-50 critical range
                line.voltage_pu = random.uniform(0.1, 0.4)
                line.harmonics_thd = random.uniform(8.0, 15.0)
                line.active_power_mw = line.current_rms * line.voltage_pu * 100 * random.uniform(0.1, 0.3)
                line.reactive_power_mvar = line.current_rms * line.voltage_pu * 100 * random.uniform(0.8, 0.95)
                line.status = "FAULTED"
            else:
                # Normal operational fluctuations
                base_load = {
                    "L1": 80.0, "L2": 90.0, "L3": 40.0, "L4": 48.0, "L5": 50.0, "L6": 20.0
                }[line_id]
                noise = math.sin(self.time_step / 10.0) * 5.0 + random.uniform(-1.0, 1.0)
                line.active_power_mw = max(5.0, base_load + noise)
                line.reactive_power_mvar = line.active_power_mw * 0.15 + random.uniform(-0.5, 0.5)
                line.voltage_pu = 1.0 + math.cos(self.time_step / 15.0) * 0.02 + random.uniform(-0.005, 0.005)
                line.current_rms = (line.active_power_mw / 100.0) / line.voltage_pu
                line.harmonics_thd = 0.5 + random.uniform(0.1, 0.4)
                line.status = "HEALTHY"

        # 3. Simulate Transformers
        for t_id, t in self.transformers.items():
            # Check primary breaker
            breaker_p = self.breakers.get(f"BT{t_id[1]}P")
            breaker_s = self.breakers.get(f"BT{t_id[1]}S")
            if breaker_p and not breaker_p.is_closed:
                # Transformer disconnected
                t.load_percentage = 0.0
                t.winding_temperature = max(25.0, t.winding_temperature - 0.5)
                t.top_oil_temperature = max(25.0, t.top_oil_temperature - 0.3)
                t.partial_discharge = 0.0
                t.vibration = 0.0
                t.status = "HEALTHY"
                continue

            if t_id in self.active_faults:
                fault = self.active_faults[t_id]
                if fault["type"] == "TRANSFORMER_OVERHEAT":
                    t.load_percentage = random.uniform(125.0, 140.0)
                    t.winding_temperature += random.uniform(1.5, 3.0)
                    t.top_oil_temperature += random.uniform(0.8, 1.5)
                    t.vibration = random.uniform(80.0, 110.0)
                    t.status = "CRITICAL" if t.winding_temperature > 110 else "WARNING"
                elif fault["type"] == "INSULATION_BREAKDOWN":
                    t.partial_discharge = random.uniform(550.0, 700.0)
                    t.insulation_resistance = max(5.0, t.insulation_resistance - 50.0)
                    t.winding_temperature += random.uniform(0.2, 0.5)
                    t.status = "CRITICAL"
            else:
                # Normal heating cycle
                base_load = {"T1": 65.0, "T2": 70.0, "T3": 55.0, "T4": 80.0}[t_id]
                noise = math.sin(self.time_step / 8.0) * 3.0 + random.uniform(-0.5, 0.5)
                t.load_percentage = max(10.0, base_load + noise)
                # Thermal time constant simulation
                target_winding_temp = 35.0 + t.load_percentage * 0.4 + (5.0 if t.cooling_active else 0.0)
                t.winding_temperature += (target_winding_temp - t.winding_temperature) * 0.05
                target_oil_temp = 30.0 + t.load_percentage * 0.35
                t.top_oil_temperature += (target_oil_temp - t.top_oil_temperature) * 0.02
                
                t.partial_discharge = max(2.0, t.partial_discharge + random.uniform(-0.2, 0.2))
                t.vibration = max(5.0, t.vibration + random.uniform(-0.1, 0.1))
                t.insulation_resistance = max(100.0, t.insulation_resistance + random.uniform(-1.0, 1.0))
                t.status = "HEALTHY"

        # 4. Trigger Relays automatically if breaker controls are autonomous
        # In a real grid, relays trip breakers locally in milliseconds before SCADA loops
        for r_id, r in self.relays.items():
            breaker = self.breakers[r.associated_breaker_id]
            if not breaker.is_closed:
                r.status = "HEALTHY"
                continue

            # Check if monitored assets have critical flags
            tripped = False
            if breaker.associated_line_id:
                line = self.transmission_lines[breaker.associated_line_id]
                # IEEE-50 check
                if r.mode_21_active and line.current_rms > 4.0:
                    tripped = True
                    r.trip_waveform_data = [math.sin(t*0.5)*line.current_rms + random.uniform(-0.1, 0.1) for t in range(50)]
            elif breaker.associated_transformer_id:
                t = self.transformers[breaker.associated_transformer_id]
                # IEEE-87T checks
                if r.mode_87T_active and t.partial_discharge > 500.0:
                    tripped = True
                if r.mode_51_active and t.winding_temperature > 110.0:
                    tripped = True

            if tripped:
                r.status = "TRIPPED"
                # Open breaker
                breaker.is_closed = False
                breaker.last_toggle_time = time.time()

class ModbusAdapter:
    def read_holding_registers(self, address: int, count: int) -> List[int]:
        # Return mock registers mapped from SCADA simulation values
        return [random.randint(100, 1000) for _ in range(count)]

class DNP3Adapter:
    def get_analog_input(self, index: int) -> float:
        # Mock DNP3 analog points
        return 1.0 + random.uniform(-0.01, 0.01)

class MQTTAdapter:
    def publish_telemetry(self, topic: str, payload: dict):
        pass
