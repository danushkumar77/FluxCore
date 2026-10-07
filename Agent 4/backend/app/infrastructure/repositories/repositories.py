import json
import os
from typing import List, Dict, Optional
from app.domain.interfaces.repository_interfaces import (
    GridRepositoryInterface,
    IncidentRepositoryInterface,
    TelemetryRepositoryInterface,
    MemoryRepositoryInterface
)
from app.domain.aggregates.grid_aggregates import GridTopology, IncidentReport
from app.domain.value_objects.telemetry import TelemetryFrame

class SQLiteMigrationHelper:
    """
    Metadata class outlining the exact DB schemas for future TimescaleDB/PostgreSQL migration.
    """
    TOPOLOGY_TABLE_SCHEMA = """
    CREATE TABLE IF NOT EXISTS grid_topology_snapshots (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        topology_json JSONB
    );
    """
    TELEMETRY_TABLE_SCHEMA = """
    CREATE TABLE IF NOT EXISTS grid_telemetry (
        time TIMESTAMPTZ NOT NULL,
        substation_id VARCHAR(50) NOT NULL,
        voltage_pu DOUBLE PRECISION,
        current_pu DOUBLE PRECISION,
        frequency_hz DOUBLE PRECISION,
        power_factor DOUBLE PRECISION,
        thd_percent DOUBLE PRECISION,
        active_power_mw DOUBLE PRECISION,
        reactive_power_mvar DOUBLE PRECISION
    );
    SELECT create_hypertable('grid_telemetry', 'time'); -- TimescaleDB specific optimization
    """
    INCIDENT_TABLE_SCHEMA = """
    CREATE TABLE IF NOT EXISTS grid_incidents (
        incident_id UUID PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        fault_type VARCHAR(100),
        severity VARCHAR(50),
        fault_location VARCHAR(100),
        distance_km DOUBLE PRECISION,
        affected_equipment JSONB,
        root_cause_explanation TEXT,
        proposed_plans JSONB,
        selected_plan_id VARCHAR(100),
        status VARCHAR(50)
    );
    """

class FileBasedGridRepository(GridRepositoryInterface):
    def __init__(self, scada_simulator):
        self.scada = scada_simulator

    def get_topology(self) -> GridTopology:
        return self.scada.get_topology()

    def save_topology(self, topology: GridTopology) -> None:
        # In a real system, updates would be written back to SCADA databases or PLC registries
        for sub_id, sub in topology.substations.items():
            self.scada.substations[sub_id] = sub
        for line_id, line in topology.transmission_lines.items():
            self.scada.transmission_lines[line_id] = line
        for b_id, b in topology.breakers.items():
            self.scada.breakers[b_id] = b
        for r_id, r in topology.relays.items():
            self.scada.relays[r_id] = r
        for t_id, t in topology.transformers.items():
            self.scada.transformers[t_id] = t

    def update_breaker_status(self, breaker_id: str, is_closed: bool) -> None:
        breaker = self.scada.breakers.get(breaker_id)
        if breaker:
            breaker.is_closed = is_closed
            import time
            breaker.last_toggle_time = time.time()

    def update_transformer_telemetry(self, transformer_id: str, telemetry: Dict[str, float]) -> None:
        t = self.scada.transformers.get(transformer_id)
        if t:
            for key, val in telemetry.items():
                if hasattr(t, key):
                    setattr(t, key, val)

    def update_line_telemetry(self, line_id: str, telemetry: Dict[str, float]) -> None:
        line = self.scada.transmission_lines.get(line_id)
        if line:
            for key, val in telemetry.items():
                if hasattr(line, key):
                    setattr(line, key, val)

class FileBasedIncidentRepository(IncidentRepositoryInterface):
    def __init__(self, filepath: str = "backend/app/memory/incidents.json"):
        self.filepath = filepath
        self.incidents: Dict[str, IncidentReport] = {}
        self._load_from_disk()

    def _load_from_disk(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    data = json.load(f)
                    for item in data:
                        report = IncidentReport(**item)
                        self.incidents[report.id] = report
            except Exception as e:
                print(f"Error loading incidents from file repository: {e}")

    def _save_to_disk(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        try:
            with open(self.filepath, 'w') as f:
                json.dump([item.dict() for item in self.incidents.values()], f, indent=2)
        except Exception as e:
            print(f"Error writing incidents to file repository: {e}")

    def get_incident(self, incident_id: str) -> Optional[IncidentReport]:
        return self.incidents.get(incident_id)

    def save_incident(self, incident: IncidentReport) -> None:
        self.incidents[incident.id] = incident
        self._save_to_disk()

    def get_all_incidents(self) -> List[IncidentReport]:
        return list(self.incidents.values())

    def get_active_incident(self) -> Optional[IncidentReport]:
        for incident in self.incidents.values():
            if incident.status == "ACTIVE":
                return incident
        return None

class FileBasedTelemetryRepository(TelemetryRepositoryInterface):
    def __init__(self, history_limit: int = 1000):
        self.history: Dict[str, List[TelemetryFrame]] = {}
        self.history_limit = history_limit

    def log_telemetry(self, substation_id: str, frame: TelemetryFrame) -> None:
        if substation_id not in self.history:
            self.history[substation_id] = []
        self.history[substation_id].append(frame)
        # Keep sliding window
        if len(self.history[substation_id]) > self.history_limit:
            self.history[substation_id].pop(0)

    def get_historical_telemetry(self, substation_id: str, limit: int = 100) -> List[TelemetryFrame]:
        frames = self.history.get(substation_id, [])
        return frames[-limit:]

class FileBasedMemoryRepository(MemoryRepositoryInterface):
    def __init__(self, filepath: str = "backend/app/memory/memories.json"):
        self.filepath = filepath
        self.memories: List[Dict] = []
        self._load_from_disk()

    def _load_from_disk(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    self.memories = json.load(f)
            except Exception as e:
                print(f"Error loading memories: {e}")

    def _save_to_disk(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        try:
            with open(self.filepath, 'w') as f:
                json.dump(self.memories, f, indent=2)
        except Exception as e:
            print(f"Error saving memories: {e}")

    def save_memory(self, memory_entry: Dict) -> None:
        self.memories.append(memory_entry)
        self._save_to_disk()

    def search_similar_incidents(self, query_features: Dict, limit: int = 3) -> List[Dict]:
        # Perform cosine similarity simulation or Jaccard text matching on tags
        matches = []
        for mem in self.memories:
            score = 0.0
            # Calculate match based on tags
            q_eq = query_features.get("affected_equipment", [])
            m_eq = mem.get("affected_equipment", [])
            eq_matches = set(q_eq).intersection(set(m_eq))
            if eq_matches:
                score += len(eq_matches) * 0.4
            if query_features.get("fault_type") == mem.get("fault_type"):
                score += 0.5
            if score > 0:
                matches.append((score, mem))
        
        matches.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in matches[:limit]]
