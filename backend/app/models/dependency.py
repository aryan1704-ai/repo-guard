from sqlalchemy import Column, Integer, String, ForeignKey

from app.core.database import Base


class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, index=True)

    scan_id = Column(
        Integer,
        ForeignKey("scans.id"),
        nullable=False
    )

    name = Column(String(255), nullable=False)

    version = Column(String(100), nullable=True)

    ecosystem = Column(String(100), nullable=True)

    vulnerability_count = Column(
        Integer,
        default=0
    )