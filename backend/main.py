from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core import (
    settings,
    connect_to_mongo,
    close_mongo_connection,
    create_indexes,
    connect_to_redis,
    close_redis_connection
)
from app.routers import (
    auth_router,
    employees_router,
    attendance_router,
    leaves_router,
    payroll_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    print("🚀 Starting Dayflow HRMS Backend...")
    
    # Create uploads directory
    os.makedirs("uploads/company_logos", exist_ok=True)
    
    await connect_to_mongo()
    await create_indexes()
    await connect_to_redis()
    print("✅ Application started successfully")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    await close_mongo_connection()
    await close_redis_connection()
    print("✅ Application shut down successfully")


# Create FastAPI app
app = FastAPI(
    title="Dayflow HRMS API",
    description="Human Resource Management System API - Every workday, perfectly aligned",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads (only if directory exists)
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(employees_router)
app.include_router(attendance_router)
app.include_router(leaves_router)
app.include_router(payroll_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Dayflow HRMS API",
        "tagline": "Every workday, perfectly aligned",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
