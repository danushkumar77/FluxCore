from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic
from uuid import UUID
from app.domain.models.models import DomainEntity

T = TypeVar('T', bound=DomainEntity)

class IRepository(Generic[T], ABC):
    @abstractmethod
    async def get_by_id(self, entity_id: UUID) -> Optional[T]:
        pass

    @abstractmethod
    async def get_all(self) -> List[T]:
        pass

    @abstractmethod
    async def save(self, entity: T) -> T:
        pass

    @abstractmethod
    async def delete(self, entity_id: UUID) -> bool:
        pass

class IFleetRepository(IRepository[Any if 'Any' in globals() else object], ABC):
    pass

class ISiteRepository(IRepository[Any if 'Any' in globals() else object], ABC):
    @abstractmethod
    async def get_by_fleet(self, fleet_id: UUID) -> List[Any if 'Any' in globals() else object]:
        pass

class ISubstationRepository(IRepository[Any if 'Any' in globals() else object], ABC):
    pass

class IAssetRepository(IRepository[Any if 'Any' in globals() else object], ABC):
    @abstractmethod
    async def get_by_site(self, site_id: UUID) -> List[Any if 'Any' in globals() else object]:
        pass

class IAlertRepository(IRepository[Any if 'Any' in globals() else object], ABC):
    @abstractmethod
    async def get_active_alerts(self) -> List[Any if 'Any' in globals() else object]:
        pass

class IDecisionRepository(IRepository[Any if 'Any' in globals() else object], ABC):
    @abstractmethod
    async def get_decisions_by_agent(self, agent_name: str) -> List[Any if 'Any' in globals() else object]:
        pass
