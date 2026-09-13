from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    BackgroundTasks,
    Query
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.scan import Scan
from app.models.repository import Repository
from app.models.security_finding import SecurityFinding
from app.models.secret_finding import SecretFinding
from app.models.dependency import Dependency
from app.models.health_metric import HealthMetric

from app.services.scan_service import run_scan_background


router = APIRouter(
    prefix="/api/scans",
    tags=["Scans"]
)


# =========================================================
# CREATE NEW SCAN
# =========================================================

@router.post("/")
def create_scan(
    background_tasks: BackgroundTasks,
    repository_id: int = Query(...),
    db: Session = Depends(get_db)
):

    # Check repository
    repository = db.query(Repository).filter(
        Repository.id == repository_id
    ).first()

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )


    # Create scan
    scan = Scan(
        repository_id=repository_id,
        status="QUEUED",
        progress=0
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)


    # Start scan in background
    background_tasks.add_task(
        run_scan_background,
        scan.id
    )


    return {
        "status": "success",
        "message": "Scan started successfully",
        "scan_id": scan.id,
        "repository_id": repository_id
    }


# =========================================================
# GET ALL SCANS
# =========================================================

@router.get("/")
def get_scans(
    db: Session = Depends(get_db)
):

    scans = db.query(Scan).order_by(
        Scan.created_at.desc()
    ).all()


    results = []


    for scan in scans:

        repository = db.query(Repository).filter(
            Repository.id == scan.repository_id
        ).first()


        results.append({
            "scan_id": scan.id,

            "repository": {
                "id": repository.id,
                "owner": repository.owner,
                "name": repository.name,
                "github_url": repository.github_url
            } if repository else None,

            "status": scan.status,
            "progress": scan.progress,

            "scores": {
                "security": scan.security_score,
                "dependency": scan.dependency_score,
                "secret": scan.secret_score,
                "cicd": scan.cicd_score,
                "health": scan.health_score,
                "overall": scan.overall_score
            },

            "created_at": scan.created_at,
            "completed_at": scan.completed_at
        })


    return {
        "status": "success",
        "scans": results
    }


# =========================================================
# GET SCAN STATUS
# =========================================================

@router.get("/{scan_id}/status")
def get_scan_status(
    scan_id: int,
    db: Session = Depends(get_db)
):

    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()


    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )


    repository = db.query(Repository).filter(
        Repository.id == scan.repository_id
    ).first()


    return {
        "scan_id": scan.id,

        "status": scan.status,

        "progress": scan.progress,

        "repository": {
            "id": repository.id,
            "owner": repository.owner,
            "name": repository.name,
            "github_url": repository.github_url
        } if repository else None
    }


# =========================================================
# GET SINGLE SCAN
# =========================================================

@router.get("/{scan_id}")
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db)
):

    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()


    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )


    repository = db.query(Repository).filter(
        Repository.id == scan.repository_id
    ).first()


    return {
        "scan_id": scan.id,

        "status": scan.status,

        "progress": scan.progress,

        "repository": {
            "id": repository.id,
            "owner": repository.owner,
            "name": repository.name,
            "github_url": repository.github_url,
            "description": repository.description,
            "default_branch": repository.default_branch,
            "stars": repository.stars,
            "forks": repository.forks,
            "language": repository.language
        } if repository else None,

        "scores": {
            "security": scan.security_score,
            "dependency": scan.dependency_score,
            "secret": scan.secret_score,
            "cicd": scan.cicd_score,
            "health": scan.health_score,
            "overall": scan.overall_score
        },

        "created_at": scan.created_at,

        "completed_at": scan.completed_at
    }


# =========================================================
# GET SECURITY FINDINGS
# =========================================================

@router.get("/{scan_id}/findings")
def get_findings(
    scan_id: int,
    db: Session = Depends(get_db)
):

    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()


    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )


    findings = db.query(
        SecurityFinding
    ).filter(
        SecurityFinding.scan_id == scan_id
    ).all()


    results = []


    for finding in findings:

        results.append({
            "id": finding.id,
            "category": finding.category,
            "severity": finding.severity,
            "title": finding.title,
            "description": finding.description,
            "file_path": finding.file_path,
            "line_number": finding.line_number,
            "rule_id": finding.rule_id,
            "recommendation": finding.recommendation
        })


    return {
        "status": "success",
        "scan_id": scan_id,
        "count": len(results),
        "findings": results
    }


# =========================================================
# GET DEPENDENCIES
# =========================================================

@router.get("/{scan_id}/dependencies")
def get_dependencies(
    scan_id: int,
    db: Session = Depends(get_db)
):

    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()


    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )


    dependencies = db.query(
        Dependency
    ).filter(
        Dependency.scan_id == scan_id
    ).all()


    results = []


    for dependency in dependencies:

        results.append({
            "id": dependency.id,
            "name": dependency.name,
            "version": dependency.version,
            "ecosystem": dependency.ecosystem,
            "vulnerability_count":
                dependency.vulnerability_count
        })


    return {
        "status": "success",
        "scan_id": scan_id,
        "count": len(results),
        "dependencies": results
    }


# =========================================================
# GET SECRET FINDINGS
# =========================================================

@router.get("/{scan_id}/secrets")
def get_secrets(
    scan_id: int,
    db: Session = Depends(get_db)
):

    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()


    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )


    secrets = db.query(
        SecretFinding
    ).filter(
        SecretFinding.scan_id == scan_id
    ).all()


    results = []


    for secret in secrets:

        results.append({
            "id": secret.id,
            "secret_type": secret.secret_type,
            "file_path": secret.file_path,
            "line_number": secret.line_number,
            "severity": secret.severity,
            "description": secret.description
        })


    return {
        "status": "success",
        "scan_id": scan_id,
        "count": len(results),
        "secrets": results
    }


# =========================================================
# GET CI/CD FINDINGS
# =========================================================

@router.get("/{scan_id}/cicd")
def get_cicd_findings(
    scan_id: int,
    db: Session = Depends(get_db)
):

    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()


    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )


    findings = db.query(
        SecurityFinding
    ).filter(
        SecurityFinding.scan_id == scan_id,
        SecurityFinding.category == "CICD"
    ).all()


    results = []


    for finding in findings:

        results.append({
            "id": finding.id,
            "severity": finding.severity,
            "title": finding.title,
            "description": finding.description,
            "file_path": finding.file_path,
            "line_number": finding.line_number,
            "rule_id": finding.rule_id,
            "recommendation": finding.recommendation
        })


    return {
        "status": "success",
        "scan_id": scan_id,
        "count": len(results),
        "findings": results
    }


# =========================================================
# GET CODE HEALTH
# =========================================================

@router.get("/{scan_id}/health")
def get_health(
    scan_id: int,
    db: Session = Depends(get_db)
):

    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()


    if not scan:

        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )


    health = db.query(
        HealthMetric
    ).filter(
        HealthMetric.scan_id == scan_id
    ).first()


    if not health:

        return {
            "status": "success",
            "scan_id": scan_id,
            "health": None
        }


    return {
        "status": "success",

        "scan_id": scan_id,

        "health": {
            "total_files": health.total_files,
            "code_files": health.code_files,
            "total_lines": health.total_lines,
            "readme_found": health.readme_found,
            "test_files": health.test_files,
            "dependency_files":
                health.dependency_files,
            "todo_count": health.todo_count,
            "large_files": health.large_files
        }
    }