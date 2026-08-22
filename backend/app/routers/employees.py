from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.utils.dependencies import get_current_user, get_current_admin
from bson import ObjectId

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    return datetime.now(IST)

def get_ist_date_str():
    return datetime.now(IST).strftime("%Y-%m-%d")

router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.get("")
async def get_all_employees(current_user: dict = Depends(get_current_admin)):
    db = get_database()
    today_str = get_ist_date_str()
    
    cursor = db.employees.find({})
    employees = []
    async for emp in cursor:
        emp["_id"] = str(emp["_id"])
        
        # Determine live status: Green = Present, Airplane = On Leave, Yellow = Absent
        att_record = await db.attendance.find_one({"employee_id": emp["employee_id"], "date": today_str})
        leave_record = await db.leaves.find_one({
            "employee_id": emp["employee_id"],
            "status": "approved",
            "start_date": {"$lte": today_str},
            "end_date": {"$gte": today_str}
        })
        
        if leave_record:
            emp["live_status"] = "on_leave"
        elif att_record and att_record.get("check_in"):
            emp["live_status"] = "present"
        else:
            emp["live_status"] = "absent"
            
        employees.append(emp)
    return employees

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    db = get_database()
    emp = await db.employees.find_one({"user_id": current_user["_id"]})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    emp["_id"] = str(emp["_id"])
    return emp

@router.get("/{id}")
async def get_employee_by_id(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        emp = await db.employees.find_one({"_id": ObjectId(id)})
    except Exception:
        emp = await db.employees.find_one({"employee_id": id})
        
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if current_user.get("role") != "admin" and emp.get("user_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    emp["_id"] = str(emp["_id"])
    return emp

@router.put("/me")
async def update_my_profile(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    update_fields = {}
    for field in ["phone", "address", "profile_picture", "gender", "date_of_birth", "nationality", "marital_status"]:
        if field in data:
            update_fields[f"personal_details.{field}"] = data[field]
            
    if "about" in data:
        update_fields["about"] = data["about"]
        
    if "skills" in data:
        if isinstance(data["skills"], str):
            update_fields["skills"] = [s.strip() for s in data["skills"].split(",") if s.strip()]
        elif isinstance(data["skills"], list):
            update_fields["skills"] = data["skills"]

    if "certifications" in data:
        if isinstance(data["certifications"], str):
            update_fields["certifications"] = [c.strip() for c in data["certifications"].split(",") if c.strip()]
        elif isinstance(data["certifications"], list):
            update_fields["certifications"] = data["certifications"]

    if update_fields:
        update_fields["updated_at"] = get_ist_now()
        await db.employees.update_one({"user_id": current_user["_id"]}, {"$set": update_fields})
        
    emp = await db.employees.find_one({"user_id": current_user["_id"]})
    emp["_id"] = str(emp["_id"])
    return emp

@router.put("/{id}")
async def update_employee_by_admin(id: str, data: dict, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    data["updated_at"] = get_ist_now()
    try:
        await db.employees.update_one({"_id": ObjectId(id)}, {"$set": data})
    except Exception:
        await db.employees.update_one({"employee_id": id}, {"$set": data})
    return {"message": "Employee updated successfully"}
