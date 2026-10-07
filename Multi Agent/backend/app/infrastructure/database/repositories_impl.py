from typing import List, Optional
from uuid import UUID
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.repositories.repositories import (
    IFleetRepository, ISiteRepository, ISubstationRepository, IAlertRepository, IDecisionRepository
)
from app.domain.models.models import Fleet, Site, Substation, Alert, Decision
from app.infrastructure.database.models import DBFleet, DBSite, DBSubstation, DBAlert, DBDecision

class FleetRepository(IFleetRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, entity_id: UUID) -> Optional[Fleet]:
        result = await self.session.get(DBFleet, entity_id)
        if result:
            return Fleet.model_validate(result.__dict__)
        return None

    async def get_all(self) -> List[Fleet]:
        stmt = select(DBFleet)
        result = await self.session.execute(stmt)
        return [Fleet.model_validate(row.__dict__) for row in result.scalars().all()]

    async def save(self, entity: Fleet) -> Fleet:
        db_obj = DBFleet(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            operator_id=entity.operator_id,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
        self.session.add(db_obj)
        await self.session.flush()
        return entity

    async def delete(self, entity_id: UUID) -> bool:
        db_obj = await self.session.get(DBFleet, entity_id)
        if db_obj:
            await self.session.delete(db_obj)
            return True
        return False

class SiteRepository(ISiteRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, entity_id: UUID) -> Optional[Site]:
        result = await self.session.get(DBSite, entity_id)
        if result:
            return Site.model_validate(result.__dict__)
        return None

    async def get_all(self) -> List[Site]:
        stmt = select(DBSite)
        result = await self.session.execute(stmt)
        return [Site.model_validate(row.__dict__) for row in result.scalars().all()]

    async def get_by_fleet(self, fleet_id: UUID) -> List[Site]:
        stmt = select(DBSite).where(DBSite.fleet_id == fleet_id)
        result = await self.session.execute(stmt)
        return [Site.model_validate(row.__dict__) for row in result.scalars().all()]

    async def save(self, entity: Site) -> Site:
        db_obj = DBSite(
            id=entity.id,
            fleet_id=entity.fleet_id,
            name=entity.name,
            location_lat=entity.location_lat,
            location_lon=entity.location_lon,
            status=entity.status,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
        self.session.add(db_obj)
        await self.session.flush()
        return entity

    async def delete(self, entity_id: UUID) -> bool:
        db_obj = await self.session.get(DBSite, entity_id)
        if db_obj:
            await self.session.delete(db_obj)
            return True
        return False

class AlertRepository(IAlertRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, entity_id: UUID) -> Optional[Alert]:
        result = await self.session.get(DBAlert, entity_id)
        if result:
            return Alert.model_validate(result.__dict__)
        return None

    async def get_all(self) -> List[Alert]:
        stmt = select(DBAlert)
        result = await self.session.execute(stmt)
        return [Alert.model_validate(row.__dict__) for row in result.scalars().all()]

    async def get_active_alerts(self) -> List[Alert]:
        stmt = select(DBAlert).where(DBAlert.status == "active")
        result = await self.session.execute(stmt)
        return [Alert.model_validate(row.__dict__) for row in result.scalars().all()]

    async def save(self, entity: Alert) -> Alert:
        db_obj = DBAlert(
            id=entity.id,
            asset_id=entity.asset_id,
            source_agent=entity.source_agent,
            description=entity.description,
            severity=entity.severity,
            status=entity.status,
            suggested_action=entity.suggested_action,
            created_at=entity.created_at
        )
        self.session.add(db_obj)
        await self.session.flush()
        return entity

    async def delete(self, entity_id: UUID) -> bool:
        db_obj = await self.session.get(DBAlert, entity_id)
        if db_obj:
            await self.session.delete(db_obj)
            return True
        return False

class DecisionRepository(IDecisionRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, entity_id: UUID) -> Optional[Decision]:
        result = await self.session.get(DBDecision, entity_id)
        if result:
            return Decision.model_validate(result.__dict__)
        return None

    async def get_all(self) -> List[Decision]:
        stmt = select(DBDecision)
        result = await self.session.execute(stmt)
        return [Decision.model_validate(row.__dict__) for row in result.scalars().all()]

    async def get_decisions_by_agent(self, agent_name: str) -> List[Decision]:
        stmt = select(DBDecision).where(DBDecision.agent_name == agent_name)
        result = await self.session.execute(stmt)
        return [Decision.model_validate(row.__dict__) for row in result.scalars().all()]

    async def save(self, entity: Decision) -> Decision:
        db_obj = DBDecision(
            id=entity.id,
            agent_name=entity.agent_name,
            decision_type=entity.decision_type,
            confidence=entity.confidence,
            risk_level=entity.risk_level,
            reasoning=entity.reasoning,
            action_taken=entity.action_taken,
            telemetry_snapshot=entity.telemetry_snapshot,
            outcome=entity.outcome,
            user_override=entity.user_override,
            lessons_learned=entity.lessons_learned,
            created_at=entity.created_at
        )
        self.session.add(db_obj)
        await self.session.flush()
        return entity

    async def delete(self, entity_id: UUID) -> bool:
        db_obj = await self.session.get(DBDecision, entity_id)
        if db_obj:
            await self.session.delete(db_obj)
            return True
        return False
