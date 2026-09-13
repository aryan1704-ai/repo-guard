from sqlalchemy import Column, Integer, Boolean, ForeignKey
from app.core.database import Base


class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(Integer, primary_key=True, index=True)

    scan_id = Column(
        Integer,
        ForeignKey("scans.id"),
        nullable=False
    )

    total_files = Column(Integer, default=0)
    code_files = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)

    readme_found = Column(Boolean, default=False)

    test_files = Column(Integer, default=0)
    dependency_files = Column(Integer, default=0)

    todo_count = Column(Integer, default=0)
    large_files = Column(Integer, default=0)