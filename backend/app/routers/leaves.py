from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db
from app.utils.dependencies import get_current_user, get_current_admin
from app.schemas.leave import LeaveCreate, LeaveAction, LeaveResponse
from bson import ObjectId
import datetime as dt

router = APIRouter()

def parse_date(date_str: str) -> dt.date:
    try:
        return dt.datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date_str}. Use YYYY-MM-DD")

@router.post("/leaves")
async def apply_leave(data: LeaveCreate, current_user: dict = Depends(get_current_user)):
    # Validate permissions
    emp_id = data.employeeId
    if current_user.get("role") != "admin" and current_user.get("employee_id") != emp_id:
        raise HTTPException(status_code=403, detail="Not authorized to apply leave for this employee")
        
    start_date = parse_date(data.startDate)
    end_date = parse_date(data.endDate)
    
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="End date must be greater than or equal to start date")
        
    total_days = (end_date - start_date).days + 1
    
    # Check for overlapping leave requests (approved or pending)
    overlap = await db.leaves.find_one({
        "employee_id": emp_id,
        "status": {"$ne": "rejected"},
        "start_date": {"$lte": data.endDate},
        "end_date": {"$gte": data.startDate}
    })
    
    if overlap:
        raise HTTPException(
            status_code=400,
            detail="Overlapping leave request already exists for this date range"
        )
        
    new_leave = {
        "employee_id": emp_id,
        "leave_type": data.leave_type,
        "start_date": data.startDate,
        "end_date": data.endDate,
        "total_days": total_days,
        "reason": data.reason,
        "status": "pending",
        "approved_by": None,
        "admin_comments": "",
        "created_at": dt.datetime.utcnow(),
        "updated_at": dt.datetime.utcnow()
    }
    
    result = await db.leaves.insert_one(new_leave)
    
    return {
        "id": str(result.inserted_id),
        "employeeId": emp_id,
        "type": data.leave_type,
        "startDate": data.startDate,
        "endDate": data.endDate,
        "totalDays": total_days,
        "reason": data.reason,
        "status": "pending",
        "approvedBy": None,
        "adminComments": "",
        "appliedOn": dt.date.today().isoformat()
    }

@router.get("/leaves/me")
async def get_my_leaves(current_user: dict = Depends(get_current_user)):
    emp_id = current_user.get("employee_id")
    cursor = db.leaves.find({"employee_id": emp_id}).sort("created_at", -1)
    
    leaves = []
    async for doc in cursor:
        leaves.append({
            "id": str(doc["_id"]),
            "employeeId": doc["employee_id"],
            "type": doc["leave_type"],
            "startDate": doc["start_date"],
            "endDate": doc["end_date"],
            "totalDays": doc["total_days"],
            "reason": doc.get("reason", ""),
            "status": doc["status"],
            "approvedBy": str(doc["approved_by"]) if doc.get("approved_by") else None,
            "adminComments": doc.get("admin_comments", ""),
            "appliedOn": doc["created_at"].date().isoformat() if doc.get("created_at") else doc["start_date"]
        })
    return leaves

@router.get("/leaves")
async def get_all_leaves(current_admin: dict = Depends(get_current_admin)):
    cursor = db.leaves.find().sort("created_at", -1)
    
    leaves = []
    async for doc in cursor:
        leaves.append({
            "id": str(doc["_id"]),
            "employeeId": doc["employee_id"],
            "type": doc["leave_type"],
            "startDate": doc["start_date"],
            "endDate": doc["end_date"],
            "totalDays": doc["total_days"],
            "reason": doc.get("reason", ""),
            "status": doc["status"],
            "approvedBy": str(doc["approved_by"]) if doc.get("approved_by") else None,
            "adminComments": doc.get("admin_comments", ""),
            "appliedOn": doc["created_at"].date().isoformat() if doc.get("created_at") else doc["start_date"]
        })
    return leaves

@router.get("/leaves/pending")
async def get_pending_leaves(current_admin: dict = Depends(get_current_admin)):
    cursor = db.leaves.find({"status": "pending"}).sort("created_at", -1)
    
    leaves = []
    async for doc in cursor:
        leaves.append({
            "id": str(doc["_id"]),
            "employeeId": doc["employee_id"],
            "type": doc["leave_type"],
            "startDate": doc["start_date"],
            "endDate": doc["end_date"],
            "totalDays": doc["total_days"],
            "reason": doc.get("reason", ""),
            "status": doc["status"],
            "approvedBy": str(doc["approved_by"]) if doc.get("approved_by") else None,
            "adminComments": doc.get("admin_comments", ""),
            "appliedOn": doc["created_at"].date().isoformat() if doc.get("created_at") else doc["start_date"]
        })
    return leaves

@router.put("/leaves/{id}/approve")
async def approve_leave(id: str, action: LeaveAction, current_admin: dict = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
        
    leave = await db.leaves.find_one({"_id": ObjectId(id)})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if leave["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot approve a leave that is already {leave['status']}")
        
    await db.leaves.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": "approved",
            "approved_by": current_admin["employee_id"],
            "admin_comments": action.admin_comments,
            "updated_at": dt.datetime.utcnow()
        }}
    )
    
    # Also create/update daily attendance log for this date range to mark as 'leave'
    # For every date in range, upsert attendance as 'leave'
    start = parse_date(leave["start_date"])
    end = parse_date(leave["end_date"])
    curr = start
    while curr <= end:
        date_str = curr.isoformat()
        # check if record exists for this employee and date
        existing = await db.attendance.find_one({"employee_id": leave["employee_id"], "date": date_str})
        if existing:
            await db.attendance.update_one(
                {"_id": existing["_id"]},
                {"$set": {"status": "leave", "updated_at": dt.datetime.utcnow()}}
            )
        else:
            await db.attendance.insert_one({
                "employee_id": leave["employee_id"],
                "date": date_str,
                "check_in": None,
                "check_out": None,
                "status": "leave",
                "working_hours": 0.0,
                "remarks": f"Approved Leave: {leave['leave_type']}",
                "created_at": dt.datetime.utcnow(),
                "updated_at": dt.datetime.utcnow()
            })
        curr += dt.timedelta(days=1)
        
    return {"message": "Leave approved successfully"}

@router.put("/leaves/{id}/reject")
async def reject_leave(id: str, action: LeaveAction, current_admin: dict = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
        
    leave = await db.leaves.find_one({"_id": ObjectId(id)})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if leave["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot reject a leave that is already {leave['status']}")
        
    await db.leaves.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": "rejected",
            "approved_by": current_admin["employee_id"],
            "admin_comments": action.admin_comments,
            "updated_at": dt.datetime.utcnow()
        }}
    )
    
    return {"message": "Leave rejected successfully"}
