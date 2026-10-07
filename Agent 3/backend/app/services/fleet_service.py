from typing import List, Optional
from backend.app.domain.entities import Fleet, Site, BatteryContainer
from backend.app.domain.interfaces import BatteryRepository

class FleetService:
    def __init__(self, battery_repo: BatteryRepository):
        self.battery_repo = battery_repo

    async def get_fleet(self) -> Fleet:
        return await self.battery_repo.get_fleet()

    async def get_site(self, site_id: str) -> Optional[Site]:
        return await self.battery_repo.get_site(site_id)

    async def get_container(self, container_id: str) -> Optional[BatteryContainer]:
        return await self.battery_repo.get_container(container_id)

    async def get_all_containers(self) -> List[BatteryContainer]:
        return await self.battery_repo.get_all_containers()

    async def update_container_telemetry(self, container_id: str, active_power_kw: float, soc: float, status: str) -> None:
        container = await self.battery_repo.get_container(container_id)
        if container:
            container.active_power_kw = active_power_kw
            container.soc = soc
            container.status = status
            await self.battery_repo.update_container(container)
            
    async def update_container_soh(self, container_id: str, soh: float) -> None:
        container = await self.battery_repo.get_container(container_id)
        if container:
            container.soh = soh
            await self.battery_repo.update_container(container)
