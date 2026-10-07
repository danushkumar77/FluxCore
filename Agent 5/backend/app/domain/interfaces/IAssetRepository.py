from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.Asset import Asset

class IAssetRepository(ABC):
    @abstractmethod
    def get_by_id(self, asset_id: str) -> Optional[Asset]:
        pass

    @abstractmethod
    def get_all(self) -> List[Asset]:
        pass

    @abstractmethod
    def save(self, asset: Asset) -> None:
        pass
