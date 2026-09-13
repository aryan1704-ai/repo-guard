from sqlalchemy import Column, Integer, String, Text, ForeignKey

from app.core.database import Base


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    scan_id = Column(
        Integer,
        ForeignKey("scans.id"),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    severity = Column(
        String(50),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    file_path = Column(
        String(500),
        nullable=True
    )

    line_number = Column(
        Integer,
        nullable=True
    )

    rule_id = Column(
        String(255),
        nullable=True
    )

    recommendation = Column(
        Text,
        nullable=True
    )