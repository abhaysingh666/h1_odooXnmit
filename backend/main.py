from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import init_db
from app.routers import auth, employees, attendance, leaves, payroll, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await init_db()
    yield
    # Shutdown actions (if any)

app = FastAPI(
    title="Dayflow HRMS API",
    description="Backend API for Employee Management, Attendance, Leaves, Payroll, and Analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity; lock down in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(employees.router, prefix="/api", tags=["Employees"])
app.include_router(attendance.router, prefix="/api", tags=["Attendance"])
app.include_router(leaves.router, prefix="/api", tags=["Leaves"])
app.include_router(payroll.router, prefix="/api", tags=["Payroll"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Dayflow HRMS API. Go to /docs for Swagger documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
