from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.utils.dependencies import get_current_user, get_current_admin
from app.utils.email import send_email_alert

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    return datetime.now(IST)

def get_ist_date_str():
    return datetime.now(IST).strftime("%Y-%m-%d")

def get_ist_time_str():
    return datetime.now(IST).strftime("%H:%M:%S")

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

@router.get("/me")
async def get_my_attendance(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.attendance.find({"employee_id": current_user["employee_id"]}).sort("date", -1)
    records = []
    async for rec in cursor:
        rec["_id"] = str(rec["_id"])
        records.append(rec)
    return records

@router.post("/check-in")
async def check_in(current_user: dict = Depends(get_current_user)):
    db = get_database()
    today_str = get_ist_date_str()
    
    # Check if already checked in today
    existing = await db.attendance.find_one({
        "employee_id": current_user["employee_id"],
        "date": today_str
    })
    
    if existing and existing.get("check_in"):
        if not existing.get("check_out"):
            return {"message": "Already checked in today", "check_in": existing["check_in"]}
        raise HTTPException(status_code=400, detail="Shift already completed for today")
        
    now = get_ist_now()
    time_str = now.strftime("%H:%M:%S")
    record = {
        "employee_id": current_user["employee_id"],
        "date": today_str,
        "check_in": time_str,
        "check_out": None,
        "status": "present",
        "working_hours": 0,
        "created_at": now,
        "updated_at": now
    }
    
    if existing:
        await db.attendance.update_one({"_id": existing["_id"]}, {"$set": record})
    else:
        await db.attendance.insert_one(record)
        
    await send_email_alert(
        recipient_email=current_user.get("email", ""),
        subject="Daily Shift Check-In Logged 🟢",
        body_html=f"<h3>Check-In Confirmed</h3><p>Hello {current_user.get('first_name', 'Employee')}, your shift check-in for {today_str} IST was recorded at <strong>{time_str} IST</strong>.</p>",
        user_id=current_user["_id"]
    )

    return {"message": "Checked in successfully", "check_in": record["check_in"]}

@router.post("/check-out")
async def check_out(current_user: dict = Depends(get_current_user)):
    db = get_database()
    today_str = get_ist_date_str()
    
    existing = await db.attendance.find_one({
        "employee_id": current_user["employee_id"],
        "date": today_str
    })
    
    if not existing or not existing.get("check_in"):
        raise HTTPException(status_code=400, detail="Must check in before checking out")
        
    if existing.get("check_out"):
        raise HTTPException(status_code=400, detail="Already checked out today")
        
    now = get_ist_now()
    check_in_time = datetime.strptime(f"{today_str} {existing['check_in']}", "%Y-%m-%d %H:%M:%S").replace(tzinfo=IST)
    hours = round((now - check_in_time).total_seconds() / 3600, 2)
    
    status_type = "half-day" if hours < 4.0 else "present"
    update_data = {
        "check_out": now.strftime("%H:%M:%S"),
        "working_hours": hours,
        "status": status_type,
        "updated_at": now
    }
    
    await db.attendance.update_one({"_id": existing["_id"]}, {"$set": update_data})
    return {"message": "Checked out successfully", "check_out": update_data["check_out"], "working_hours": hours, "status": status_type}

@router.get("")
async def get_all_attendance(current_user: dict = Depends(get_current_admin)):
    db = get_database()
    cursor = db.attendance.find({}).sort("date", -1)
    records = []
    async for rec in cursor:
        rec["_id"] = str(rec["_id"])
        records.append(rec)
    return records
