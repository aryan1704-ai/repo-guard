from app.api.ai_report import router as ai_report_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.repositories import router as repositories_router
from app.services.github_service import get_repository_info
from app.api.scans import router as scans_router
from fastapi import FastAPI
from app.core.database import engine, Base
from app.models import Repository, Scan

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RepoGuard API",
    description="AI-Powered GitHub Repository Security & Health Analyzer",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_report_router)
app.include_router(repositories_router)
app.include_router(scans_router)

@app.get("/")
def root():
    print("ROOT ENDPOINT CALLED")
    return {
        "message": "RepoGuard API is running",
        "status": "success"
    }


@app.get("/api/health")
def health_check():
    try:
        with engine.connect():
            database_status = "connected"
    except Exception as e:
        database_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "RepoGuard API",
        "database": database_status
    }

@app.get("/api/github/analyze")
async def analyze_github_repository(url: str):
    try:
        repository = await get_repository_info(url)

        return {
            "status": "success",
            "repository": repository
        }

    except ValueError as e:
        return {
            "status": "error",
            "message": str(e)
        }