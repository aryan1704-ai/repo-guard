from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)

    repository_id = Column(
        Integer,
        ForeignKey("repositories.id"),
        nullable=False
    )

    status = Column(
        String(50),
        default="QUEUED",
        nullable=False
    )

    progress = Column(
        Integer,
        default=0,
        nullable=False
    )

    security_score = Column(Integer, nullable=True)

    dependency_score = Column(Integer, nullable=True)

    secret_score = Column(Integer, nullable=True)

    cicd_score = Column(Integer, nullable=True)

    health_score = Column(Integer, nullable=True)

    overall_score = Column(Integer, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    completed_at = Column(DateTime, nullable=True)