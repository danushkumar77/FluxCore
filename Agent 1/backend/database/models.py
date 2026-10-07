from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, DateTime, Integer, event
from sqlalchemy.engine import Engine
from datetime import datetime
import json
from config.settings import settings

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if settings.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

engine = create_async_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class PredictionRecord(Base):
    __tablename__ = 'predictions'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    input_data: Mapped[str] = mapped_column(String)
    
    prediction: Mapped[float] = mapped_column(Float)
    next_6h_demand: Mapped[float] = mapped_column(Float)
    next_24h_demand: Mapped[float] = mapped_column(Float)
    peak_demand: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    risk: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    trend: Mapped[str] = mapped_column(String)
    grid_stress_index: Mapped[float] = mapped_column(Float)
    reserve_margin: Mapped[float] = mapped_column(Float)
    reasoning: Mapped[str] = mapped_column(String)
    recommendations: Mapped[str] = mapped_column(String)
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
