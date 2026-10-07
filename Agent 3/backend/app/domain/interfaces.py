from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from backend.app.domain.entities import (
    Fleet, Site, BatteryContainer, BatteryTelemetry, 
    BatteryHealth, BatteryDecision, BatteryAlert, 
    BatteryExecution, BatteryForecast, BatteryOptimization
)

class BatteryRepository(ABC):
    @abstractmethod
    async def get_fleet(self) -> Fleet:
        pass
        
    @abstractmethod
    async def get_site(self, site_id: str) -> Optional[Site]:
        pass
        
    @abstractmethod
    async def get_container(self, container_id: str) -> Optional[BatteryContainer]:
        pass

    @abstractmethod
    async def get_all_containers(self) -> List[BatteryContainer]:
        pass
        
    @abstractmethod
    async def update_container(self, container: BatteryContainer) -> None:
        pass

class TelemetryRepository(ABC):
    @abstractmethod
    async def save_telemetry(self, telemetry: BatteryTelemetry) -> None:
        pass
        
    @abstractmethod
    async def get_latest_telemetry(self, container_id: str) -> Optional[BatteryTelemetry]:
        pass
        
    @abstractmethod
    async def get_historical_telemetry(self, container_id: str, limit: int = 100) -> List[BatteryTelemetry]:
        pass

class DecisionRepository(ABC):
    @abstractmethod
    async def save_decision(self, decision: BatteryDecision) -> None:
        pass
        
    @abstractmethod
    async def get_decision(self, decision_id: str) -> Optional[BatteryDecision]:
        pass
        
    @abstractmethod
    async def get_historical_decisions(self, container_id: str, limit: int = 100) -> List[BatteryDecision]:
        pass
        
    @abstractmethod
    async def save_execution(self, execution: BatteryExecution) -> None:
        pass

    @abstractmethod
    async def get_historical_executions(self, container_id: str, limit: int = 100) -> List[BatteryExecution]:
        pass

class MemoryRepository(ABC):
    @abstractmethod
    async def save_lesson(self, lesson: Dict[str, Any]) -> None:
        pass
        
    @abstractmethod
    async def search_lessons(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        pass
        
    @abstractmethod
    async def get_all_lessons(self, limit: int = 100) -> List[Dict[str, Any]]:
        pass

class AlertRepository(ABC):
    @abstractmethod
    async def save_alert(self, alert: BatteryAlert) -> None:
        pass
        
    @abstractmethod
    async def get_active_alerts(self) -> List[BatteryAlert]:
        pass
        
    @abstractmethod
    async def get_all_alerts(self, limit: int = 100) -> List[BatteryAlert]:
        pass
        
    @abstractmethod
    async def resolve_alert(self, alert_id: str) -> None:
        pass

class StrategyRepository(ABC):
    @abstractmethod
    async def save_optimization(self, opt: BatteryOptimization) -> None:
        pass
        
    @abstractmethod
    async def get_historical_optimizations(self, limit: int = 100) -> List[BatteryOptimization]:
        pass
