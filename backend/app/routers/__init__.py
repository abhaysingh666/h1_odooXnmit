from .auth import router as auth_router
from .employees import router as employees_router
from .attendance import router as attendance_router
from .leaves import router as leaves_router
from .payroll import router as payroll_router

__all__ = [
    "auth_router",
    "employees_router",
    "attendance_router",
    "leaves_router",
    "payroll_router",
]
