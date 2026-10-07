import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Path to the database file
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agent6.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create engine with connect_args for SQLite to handle multi-threading safely
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
