"""SQLAlchemy engine, session factory and the predictions table."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from . import config

# SQLite needs check_same_thread=False to be used across FastAPI's threadpool.
_connect_args = (
    {"check_same_thread": False} if config.DATABASE_URL.startswith("sqlite") else {}
)
engine = create_engine(config.DATABASE_URL, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Prediction(Base):
    """One row per customer scored, timestamped for time-series aggregation."""

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False, index=True)

    # Optional caller-supplied identifier (kept only for reference/traceability).
    customer_id = Column(String, nullable=True)

    churn = Column(Integer, nullable=False)              # 0 or 1
    churn_probability = Column(Float, nullable=False)    # P(churn)
    source = Column(String, nullable=False, default="single")  # "single" | "batch"


def init_db() -> None:
    """Create tables if they don't exist yet (called on startup)."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency yielding a session and always closing it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
