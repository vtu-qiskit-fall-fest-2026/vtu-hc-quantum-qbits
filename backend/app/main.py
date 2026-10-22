import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import engine, Base
from app.database import models

# Import API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.overview import router as overview_router
from app.api.v1.molecules import router as molecules_router
from app.api.v1.classical import router as classical_router
from app.api.v1.quantum import router as quantum_router
from app.api.v1.experiments import router as experiments_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.settings import router as settings_router
from app.api.v1.jobs import router as jobs_router

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Q-MolAI: Hybrid Quantum-Classical Molecular Research Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "operational",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "quantum_backend": "PennyLane Simulator (default.qubit)",
        "rdkit_engine": "operational",
        "database": "connected"
    }

@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to Q-MolAI API. Discover Molecules. Explore Quantum Intelligence.",
        "documentation": "/docs"
    }

# Register API v1 Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(overview_router, prefix=settings.API_V1_STR)
app.include_router(molecules_router, prefix=settings.API_V1_STR)
app.include_router(classical_router, prefix=settings.API_V1_STR)
app.include_router(quantum_router, prefix=settings.API_V1_STR)
app.include_router(experiments_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
