from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.database import db
from app.utils.dependencies import get_current_user, get_current_admin
from app.schemas.attendance import AttendanceCreate, AttendanceResponse
from bson import ObjectId
import datetime as dt

router = APIRouter()

def now_hhmm() -> str:
    # Local time in HH:MM format
    return dt.datetime.now().strftime("%H:%M")

def calculate_hours(check_in_str: str, check_out_str: str) -> float:
    try:
        in_h, in_m = map(int, check_in_str.split(":"))
        out_h, out_m = map(int, check_out_str.split(":"))
        in_mins = in_h * 60 + in_m
        out_mins = out_h * 60 + out_m
        diff = out_mins - in_mins
        if diff <= 0:
            return 0.0
        return round(diff / 60.0, 2)
    except Exception:
        return 0.0

@router.get("/attendance")
async def get_attendance(
    employeeId: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {}
    # Non-admins can only see their own attendance records
    if current_user.get("role") != "admin":
        query["employee_id"] = current_user.get("employee_id")
    elif employeeId:
        query["employee_id"] = employeeId

    cursor = db.attendance.find(query).sort("date", -1)
    records = []
    async for doc in cursor:
        records.append({
            "id": str(doc["_id"]),
            "employeeId": doc["employee_id"],
            "date": doc["date"],
            "checkIn": doc.get("check_in"),
            "checkOut": doc.get("check_out"),
            "status": doc["status"],
            "working_hours": doc.get("working_hours", 0.0),
            "remarks": doc.get("remarks", "")
        })
    return records

@router.get("/attendance/today/{empId}")
async def get_today_attendance(empId: str, current_user: dict = Depends(get_current_user)):
    # Check permissions
    if current_user.get("role") != "admin" and current_user.get("employee_id") != empId:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = dt.date.today().isoformat()
    doc = await db.attendance.find_one({"employee_id": empId, "date": today})
    if not doc:
        return None
        
    return {
        "id": str(doc["_id"]),
        "employeeId": doc["employee_id"],
        "date": doc["date"],
        "checkIn": doc.get("check_in"),
        "checkOut": doc.get("check_out"),
        "status": doc["status"],
        "working_hours": doc.get("working_hours", 0.0),
        "remarks": doc.get("remarks", "")
    }

@router.post("/attendance/check-in")
async def check_in(payload: dict, current_user: dict = Depends(get_current_user)):
    emp_id = payload.get("employeeId") or current_user.get("employee_id")
    
    # Check permissions
    if current_user.get("role") != "admin" and current_user.get("employee_id") != emp_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = dt.date.today().isoformat()
    
    # Check if already checked in
    existing = await db.attendance.find_one({"employee_id": emp_id, "date": today})
    if existing and existing.get("check_in"):
        raise HTTPException(status_code=400, detail="Already checked in today")
        
    check_in_time = now_hhmm()
    
    record = {
        "employee_id": emp_id,
        "date": today,
        "check_in": check_in_time,
        "check_out": None,
        "status": "present",
        "working_hours": 0.0,
        "remarks": payload.get("remarks", ""),
        "created_at": dt.datetime.utcnow(),
        "updated_at": dt.datetime.utcnow()
    }
    
    if existing:
        await db.attendance.update_one(
            {"_id": existing["_id"]},
            {"$set": {"check_in": check_in_time, "status": "present", "updated_at": dt.datetime.utcnow()}}
        )
        record_id = str(existing["_id"])
    else:
        result = await db.attendance.insert_one(record)
        record_id = str(result.inserted_id)
        
    # Update employee's active status
    await db.employees.update_one({"employee_id": emp_id}, {"$set": {"status": "present"}})
    
    return {
        "id": record_id,
        "employeeId": emp_id,
        "date": today,
        "checkIn": check_in_time,
        "checkOut": None,
        "status": "present",
        "working_hours": 0.0,
        "remarks": payload.get("remarks", "")
    }

@router.post("/attendance/check-out")
async def check_out(payload: dict, current_user: dict = Depends(get_current_user)):
    emp_id = payload.get("employeeId") or current_user.get("employee_id")
    
    # Check permissions
    if current_user.get("role") != "admin" and current_user.get("employee_id") != emp_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = dt.date.today().isoformat()
    
    existing = await db.attendance.find_one({"employee_id": emp_id, "date": today})
    if not existing or not existing.get("check_in"):
        raise HTTPException(status_code=400, detail="Cannot check out without checking in first")
        
    check_out_time = now_hhmm()
    hours = calculate_hours(existing["check_in"], check_out_time)
    
    await db.attendance.update_one(
        {"_id": existing["_id"]},
        {"$set": {
            "check_out": check_out_time,
            "working_hours": hours,
            "updated_at": dt.datetime.utcnow()
        }}
    )
    
    # Update employee's status back to absent (meaning checked out/not currently clocked in)
    await db.employees.update_one({"employee_id": emp_id}, {"$set": {"status": "absent"}})
    
    return {
        "id": str(existing["_id"]),
        "employeeId": emp_id,
        "date": today,
        "checkIn": existing["check_in"],
        "checkOut": check_out_time,
        "status": existing["status"],
        "working_hours": hours,
        "remarks": existing.get("remarks", "")
    }
