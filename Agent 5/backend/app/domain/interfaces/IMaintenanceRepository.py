from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.aggregates.MaintenancePackage import MaintenancePackage

class IMaintenanceRepository(ABC):
    @abstractmethod
    def get_by_id(self, package_id: str) -> Optional[MaintenancePackage]:
        pass

    @abstractmethod
    def get_all(self) -> List[MaintenancePackage]:
        pass

    @abstractmethod
    def save(self, package: MaintenancePackage) -> None:
        pass
