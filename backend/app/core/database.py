from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

async def init_db():
    # Setup indexes for collections
    await db.users.create_index("employee_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.employees.create_index("employee_id", unique=True)
    await db.employees.create_index("user_id")
    
    # Composite index for attendance to prevent multiple records for same employee on same date
    await db.attendance.create_index([("employee_id", 1), ("date", 1)], unique=True)
    
    await db.leaves.create_index("employee_id")
    await db.leaves.create_index("status")
    
    # Composite unique index for payroll to ensure only one payroll record per employee per month
    await db.payroll.create_index([("employee_id", 1), ("month", 1)], unique=True)
