from sqlalchemy import Column, String, Float, DateTime, Integer, JSON, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
import uuid
from datetime import datetime
from app.infrastructure.database.database import Base

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise String(36) in SQLite.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value

class DBFleet(Base):
    __tablename__ = "fleets"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    operator_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBSite(Base):
    __tablename__ = "sites"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    fleet_id = Column(GUID(), nullable=False)
    name = Column(String, nullable=False)
    location_lat = Column(Float, nullable=False)
    location_lon = Column(Float, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBSubstation(Base):
    __tablename__ = "substations"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    site_id = Column(GUID(), nullable=False)
    name = Column(String, nullable=False)
    capacity_mw = Column(Float, nullable=False)
    voltage_level_kv = Column(Float, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBTransformer(Base):
    __tablename__ = "transformers"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    substation_id = Column(GUID(), nullable=False)
    name = Column(String, nullable=False)
    manufacturer = Column(String)
    nominal_power_mva = Column(Float, nullable=False)
    cooling_type = Column(String)
    status = Column(String, default="active")
    temperature_oil_c = Column(Float, default=0.0)
    temperature_winding_c = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBTransmissionLine(Base):
    __tablename__ = "transmission_lines"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    source_substation_id = Column(GUID(), nullable=False)
    target_substation_id = Column(GUID(), nullable=False)
    voltage_kv = Column(Float, nullable=False)
    max_capacity_mw = Column(Float, nullable=False)
    current_flow_mw = Column(Float, default=0.0)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

class DBBatteryBESS(Base):
    __tablename__ = "battery_systems"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    site_id = Column(GUID(), nullable=False)
    name = Column(String, nullable=False)
    capacity_mwh = Column(Float, nullable=False)
    max_charge_power_mw = Column(Float, nullable=False)
    max_discharge_power_mw = Column(Float, nullable=False)
    soc_pct = Column(Float, default=100.0)
    soh_pct = Column(Float, default=100.0)
    temperature_c = Column(Float, default=25.0)
    status = Column(String, default="idle")
    created_at = Column(DateTime, default=datetime.utcnow)

class DBAlert(Base):
    __tablename__ = "alerts"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    asset_id = Column(GUID(), nullable=False)
    source_agent = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, default="medium")
    status = Column(String, default="active")
    suggested_action = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBDecision(Base):
    __tablename__ = "decisions"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    agent_name = Column(String, nullable=False)
    decision_type = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    reasoning = Column(String, nullable=False)
    action_taken = Column(JSON, nullable=False)
    telemetry_snapshot = Column(JSON, nullable=False)
    outcome = Column(String)
    user_override = Column(Boolean, default=False)
    lessons_learned = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
