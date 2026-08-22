from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.utils.dependencies import get_current_user, get_current_admin
from app.utils.email import send_email_alert
from bson import ObjectId

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    return datetime.now(IST)

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])

@router.get("/me")
async def get_my_leaves(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.leaves.find({"employee_id": current_user["employee_id"]}).sort("created_at", -1)
    leaves = []
    async for l in cursor:
        l["_id"] = str(l["_id"])
        leaves.append(l)
    return leaves

@router.post("")
async def apply_for_leave(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    leave_type = data.get("leave_type", "paid")
    reason = data.get("reason", "")
    total_days = data.get("total_days", 1)
    
    if not start_date or not end_date:
        raise HTTPException(status_code=400, detail="Start and end dates are required")
        
    leave_doc = {
        "employee_id": current_user["employee_id"],
        "leave_type": leave_type,
        "start_date": start_date,
        "end_date": end_date,
        "total_days": total_days,
        "reason": reason,
        "status": "pending",
        "approved_by": None,
        "admin_comments": "",
        "created_at": get_ist_now(),
        "updated_at": get_ist_now()
    }
    
    res = await db.leaves.insert_one(leave_doc)
    leave_id = str(res.inserted_id)
    leave_doc["_id"] = leave_id

    # Trigger Email Alert
    await send_email_alert(
        recipient_email=current_user.get("email", ""),
        subject="Leave Application Received ⏳",
        body_html=f"<h3>Leave Request Received</h3><p>Your {leave_type} leave application ({start_date} to {end_date}, {total_days} days) has been submitted for HR review.</p>",
        user_id=current_user["_id"]
    )
    
    return leave_doc

@router.get("")
async def get_all_leaves(current_user: dict = Depends(get_current_admin)):
    db = get_database()
    cursor = db.leaves.find({}).sort("created_at", -1)
    leaves = []
    async for l in cursor:
        l["_id"] = str(l["_id"])
        leaves.append(l)
    return leaves

@router.put("/{id}/approve")
async def approve_leave(id: str, data: dict = {}, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    comment = data.get("admin_comments", "Approved by Admin")
    
    try:
        leave_doc = await db.leaves.find_one({"_id": ObjectId(id)})
        if not leave_doc:
            raise HTTPException(status_code=404, detail="Leave request not found")

        await db.leaves.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "status": "approved",
                "approved_by": current_user["_id"],
                "admin_comments": comment,
                "updated_at": get_ist_now()
            }}
        )

        emp = await db.users.find_one({"employee_id": leave_doc["employee_id"]})
        if emp and emp.get("email"):
            await send_email_alert(
                recipient_email=emp["email"],
                subject="Leave Request Approved ✅",
                body_html=f"<h3>Leave Approved!</h3><p>Your {leave_doc.get('leave_type')} leave request ({leave_doc.get('start_date')} to {leave_doc.get('end_date')}) has been <strong>APPROVED</strong> by HR.</p><p>Remarks: {comment}</p>",
                user_id=str(emp["_id"])
            )
    except Exception:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    return {"message": "Leave approved"}

@router.put("/{id}/reject")
async def reject_leave(id: str, data: dict = {}, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    comment = data.get("admin_comments", "Rejected by Admin")
    
    try:
        leave_doc = await db.leaves.find_one({"_id": ObjectId(id)})
        if not leave_doc:
            raise HTTPException(status_code=404, detail="Leave request not found")

        await db.leaves.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "status": "rejected",
                "approved_by": current_user["_id"],
                "admin_comments": comment,
                "updated_at": get_ist_now()
            }}
        )

        emp = await db.users.find_one({"employee_id": leave_doc["employee_id"]})
        if emp and emp.get("email"):
            await send_email_alert(
                recipient_email=emp["email"],
                subject="Leave Request Status Update ❌",
                body_html=f"<h3>Leave Rejected</h3><p>Your {leave_doc.get('leave_type')} leave request ({leave_doc.get('start_date')} to {leave_doc.get('end_date')}) was rejected by HR.</p><p>Remarks: {comment}</p>",
                user_id=str(emp["_id"])
            )
    except Exception:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    return {"message": "Leave rejected"}

