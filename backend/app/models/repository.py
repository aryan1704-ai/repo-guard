from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)

    github_url = Column(String(500), unique=True, nullable=False)

    owner = Column(String(255), nullable=False)

    name = Column(String(255), nullable=False)

    description = Column(Text, nullable=True)

    default_branch = Column(String(100), default="main")

    stars = Column(Integer, default=0)

    forks = Column(Integer, default=0)

    language = Column(String(100), nullable=True)

    last_updated = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )