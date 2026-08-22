from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from app.core.database import get_database
from app.utils.dependencies import get_current_user, get_current_admin
from bson import ObjectId

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

@router.get("/me")
async def get_my_payroll(current_user: dict = Depends(get_current_user)):
    db = get_database()
    payroll = await db.payroll.find_one({"employee_id": current_user["employee_id"]})
    if not payroll:
        # Fallback default payroll
        return {
            "employee_id": current_user["employee_id"],
            "month": datetime.utcnow().strftime("%Y-%m"),
            "salary_structure": {
                "basic": 50000,
                "hra": 20000,
                "allowances": 10000,
                "deductions": 5000,
                "gross_salary": 80000,
                "net_salary": 75000
            },
            "payment_date": datetime.utcnow().strftime("%Y-%m-28"),
            "payment_status": "paid"
        }
    payroll["_id"] = str(payroll["_id"])
    return payroll

@router.get("")
async def get_all_payroll(current_user: dict = Depends(get_current_admin)):
    db = get_database()
    cursor = db.payroll.find({})
    payrolls = []
    async for p in cursor:
        p["_id"] = str(p["_id"])
        payrolls.append(p)
    return payrolls

@router.put("/{id}")
async def update_payroll(id: str, data: dict, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    data["updated_at"] = datetime.utcnow()
    try:
        await db.payroll.update_one({"_id": ObjectId(id)}, {"$set": data})
    except Exception:
        await db.payroll.update_one({"employee_id": id}, {"$set": data})
    return {"message": "Payroll updated successfully"}
