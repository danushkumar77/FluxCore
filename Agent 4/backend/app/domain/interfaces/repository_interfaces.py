from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from app.domain.aggregates.grid_aggregates import GridTopology, IncidentReport
from app.domain.entities.grid_assets import Substation, TransmissionLine, Transformer, Breaker, Relay
from app.domain.value_objects.telemetry import TelemetryFrame

class GridRepositoryInterface(ABC):
    @abstractmethod
    def get_topology(self) -> GridTopology:
        pass

    @abstractmethod
    def save_topology(self, topology: GridTopology) -> None:
        pass

    @abstractmethod
    def update_breaker_status(self, breaker_id: str, is_closed: bool) -> None:
        pass

    @abstractmethod
    def update_transformer_telemetry(self, transformer_id: str, telemetry: Dict[str, float]) -> None:
        pass

    @abstractmethod
    def update_line_telemetry(self, line_id: str, telemetry: Dict[str, float]) -> None:
        pass

class IncidentRepositoryInterface(ABC):
    @abstractmethod
    def get_incident(self, incident_id: str) -> Optional[IncidentReport]:
        pass

    @abstractmethod
    def save_incident(self, incident: IncidentReport) -> None:
        pass

    @abstractmethod
    def get_all_incidents(self) -> List[IncidentReport]:
        pass

    @abstractmethod
    def get_active_incident(self) -> Optional[IncidentReport]:
        pass

class TelemetryRepositoryInterface(ABC):
    @abstractmethod
    def log_telemetry(self, substation_id: str, frame: TelemetryFrame) -> None:
        pass

    @abstractmethod
    def get_historical_telemetry(self, substation_id: str, limit: int = 100) -> List[TelemetryFrame]:
        pass

class MemoryRepositoryInterface(ABC):
    @abstractmethod
    def save_memory(self, memory_entry: Dict) -> None:
        pass

    @abstractmethod
    def search_similar_incidents(self, query_features: Dict, limit: int = 3) -> List[Dict]:
        pass
