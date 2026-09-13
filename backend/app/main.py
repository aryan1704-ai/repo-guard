from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.models import Repository, Scan

from app.api.repositories import router as repositories_router
from app.api.scans import router as scans_router
from app.api.ai_report import router as ai_report_router


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="RepoGuard API",
    description="AI-Powered GitHub Repository Security & Health Analyzer",
    version="1.0.0",
)


# CORS configuration
# Allows the deployed frontend to communicate with the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(repositories_router)
app.include_router(scans_router)
app.include_router(ai_report_router)


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "RepoGuard API is running",
        "status": "success"
    }


# Health check endpoint
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

