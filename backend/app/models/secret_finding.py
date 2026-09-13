from sqlalchemy import Column, Integer, String, ForeignKey

from app.core.database import Base


class SecretFinding(Base):
    __tablename__ = "secret_findings"

    id = Column(Integer, primary_key=True, index=True)

    scan_id = Column(
        Integer,
        ForeignKey("scans.id"),
        nullable=False
    )

    secret_type = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    line_number = Column(
        Integer,
        nullable=True
    )

    severity = Column(
        String(50),
        default="HIGH"
    )

    description = Column(
        String(500),
        nullable=True
    )