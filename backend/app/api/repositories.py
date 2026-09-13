from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.repository import Repository
from app.services.github_service import get_repository_info


router = APIRouter(
    prefix="/api/repositories",
    tags=["Repositories"]
)


@router.post("/")
async def create_repository(
    repository_url: str,
    db: Session = Depends(get_db)
):
    try:
        # Get information from GitHub
        data = await get_repository_info(repository_url)

        # Check if repository already exists
        existing_repository = (
            db.query(Repository)
            .filter(Repository.github_url == data["github_url"])
            .first()
        )

        if existing_repository:
            return {
                "status": "exists",
                "message": "Repository already exists",
                "repository_id": existing_repository.id
            }

        # Create repository record
        repository = Repository(
            github_url=data["github_url"],
            owner=data["owner"],
            name=data["name"],
            description=data["description"],
            default_branch=data["default_branch"],
            stars=data["stars"],
            forks=data["forks"],
            language=data["language"]
        )

        db.add(repository)
        db.commit()
        db.refresh(repository)

        return {
            "status": "success",
            "message": "Repository saved successfully",
            "repository_id": repository.id,
            "repository": data
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to save repository"
        )