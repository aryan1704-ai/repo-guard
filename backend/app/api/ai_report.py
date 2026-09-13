from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.scan import Scan
from app.models.security_finding import SecurityFinding
from app.models.secret_finding import SecretFinding
from app.models.dependency import Dependency
from app.models.health_metric import HealthMetric

from app.services.ai_analyzer import (
    build_ai_analysis_data,
    build_ai_prompt
)

from app.services.gemini_service import generate_ai_report


router = APIRouter(
    prefix="/api/scans",
    tags=["AI Report"]
)


@router.get("/{scan_id}/ai-report")
def get_ai_report(
    scan_id: int,
    db: Session = Depends(get_db)
):

    # 1. Find scan
    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()

    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )

    # 2. Get security findings
    security_findings = db.query(
        SecurityFinding
    ).filter(
        SecurityFinding.scan_id == scan_id
    ).all()

    # 3. Get dependencies
    dependencies = db.query(
        Dependency
    ).filter(
        Dependency.scan_id == scan_id
    ).all()

    # 4. Get detected secrets
    secrets = db.query(
        SecretFinding
    ).filter(
        SecretFinding.scan_id == scan_id
    ).all()

    # 5. Get CI/CD findings
    cicd_findings = db.query(
        SecurityFinding
    ).filter(
        SecurityFinding.scan_id == scan_id,
        SecurityFinding.category == "CICD"
    ).all()

    # 6. Get code health information
    health = db.query(
        HealthMetric
    ).filter(
        HealthMetric.scan_id == scan_id
    ).first()

    # 7. Prepare structured data
    analysis_data = build_ai_analysis_data(
        scan=scan,
        security_findings=security_findings,
        dependencies=dependencies,
        secrets=secrets,
        cicd_findings=cicd_findings,
        health=health
    )

    # 8. Build grounded AI prompt
    prompt = build_ai_prompt(
        analysis_data
    )

    # 9. Generate Gemini report
    try:
        ai_report = generate_ai_report(
            prompt
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI report generation failed: {str(e)}"
        )

    # 10. Return complete response
    return {
        "status": "success",
        "scan_id": scan_id,

        "scan": {
            "overall_score": scan.overall_score,
            "security_score": scan.security_score,
            "dependency_score": scan.dependency_score,
            "secret_score": scan.secret_score,
            "cicd_score": scan.cicd_score,
            "health_score": scan.health_score
        },

        "message": "AI report generated successfully",

        "ai_report": ai_report
    }