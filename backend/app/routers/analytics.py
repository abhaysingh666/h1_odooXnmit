from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import db
from app.utils.dependencies import get_current_user, get_current_admin
import datetime as dt

router = APIRouter()

@router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_admin: dict = Depends(get_current_admin)):
    today_str = dt.date.today().isoformat()
    current_month_str = dt.date.today().strftime("%Y-%m")
    
    # 1. Total Employee Count
    total_employees = await db.employees.count_documents({})
    
    # 2. Present Today Count
    present_today = await db.attendance.count_documents({"date": today_str, "status": "present"})
    
    # 3. Pending Leave Requests Count
    pending_leaves = await db.leaves.count_documents({"status": "pending"})
    
    # 4. Payroll Summary (Total net salary processed this month)
    payroll_pipeline = [
        {"$match": {"month": current_month_str}},
        {"$group": {"_id": None, "total_net": {"$sum": "$salary_structure.net_salary"}}}
    ]
    payroll_cursor = db.payroll.aggregate(payroll_pipeline)
    payroll_res = await payroll_cursor.to_list(length=1)
    total_payroll = payroll_res[0]["total_net"] if payroll_res else 0.0
    
    # 5. Attendance Trend (Last 7 Days)
    # We aggregate by date and status, and map it for easy consumption
    start_date_str = (dt.date.today() - dt.timedelta(days=7)).isoformat()
    trend_pipeline = [
        {"$match": {"date": {"$gte": start_date_str, "$lte": today_str}}},
        {"$group": {
            "_id": {
                "date": "$date",
                "status": "$status"
            },
            "count": {"$sum": 1}
        }},
        {"$group": {
            "_id": "$_id.date",
            "statuses": {
                "$push": {
                    "k": "$_id.status",
                    "v": "$count"
                }
            }
        }},
        {"$project": {
            "date": "$_id",
            "counts": {"$arrayToObject": "$statuses"},
            "_id": 0
        }},
        {"$sort": {"date": 1}}
    ]
    trend_cursor = db.attendance.aggregate(trend_pipeline)
    trend_raw = await trend_cursor.to_list(length=100)
    
    # Fill in dates in the last 7 days to ensure a complete chart (even if some dates have no checkins)
    trend_data = []
    for i in range(7, -1, -1):
        day = (dt.date.today() - dt.timedelta(days=i)).isoformat()
        # Find if we have raw data for this day
        day_raw = next((item for item in trend_raw if item["date"] == day), None)
        counts = day_raw.get("counts", {}) if day_raw else {}
        
        trend_data.append({
            "date": day,
            "present": counts.get("present", 0),
            "leave": counts.get("leave", 0),
            "absent": counts.get("absent", 0)
        })
        
    return {
        "stats": {
            "totalEmployees": total_employees,
            "presentToday": present_today,
            "pendingLeaves": pending_leaves,
            "monthlyPayroll": round(total_payroll, 2)
        },
        "attendanceTrend": trend_data
    }
