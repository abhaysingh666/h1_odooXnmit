"""
Attendance tracking.

Employees check in and out for themselves; admins/HR can see any day across the
company and correct records manually. Every derived figure (work hours, extra
hours, payable days) is computed here so payroll and the UI never disagree.
"""

from datetime import date, datetime
from typing import Dict, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..core import get_database
from ..models import UserInDB
from ..schemas.attendance import (
    AttendanceRecord,
    AttendanceSummary,
    CheckInRequest,
    CheckOutRequest,
    DayAttendanceResponse,
    ManualAttendance,
    MyAttendanceResponse,
    TodayStatus,
)
from ..utils import get_current_admin, get_current_user
from ..utils.dates import (
    count_working_days,
    date_range,
    is_working_day,
    minutes_between,
    month_bounds,
    month_label,
    resolve_period,
    split_hours,
    to_day,
    today,
)
from ..utils.presenters import attendance_record

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def _object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid employee id"
        )
    return ObjectId(value)


def _schedule(user: Dict) -> Dict:
    schedule = user.get("schedule") or {}
    return {
        "hours_per_day": float(schedule.get("hours_per_day") or 8.0),
        "week_days": schedule.get("week_days") or [0, 1, 2, 3, 4],
        "break_minutes": float(schedule.get("break_minutes") or 0.0),
    }


def _derive(check_in: datetime, check_out: datetime, break_minutes: float, hours_per_day: float):
    """Work and extra minutes for a completed day, plus present/half-day."""
    gross = minutes_between(check_in, check_out)
    work = max(0.0, gross - max(0.0, break_minutes))
    expected = hours_per_day * 60
    extra = max(0.0, work - expected)
    # Less than half the expected day on site is recorded as a half day.
    day_status = "present" if work >= expected / 2 else "half_day"
    return round(work, 2), round(extra, 2), day_status


async def _leave_on(db, user_id: ObjectId, day: datetime) -> Optional[Dict]:
    return await db.leaves.find_one(
        {
            "user_id": user_id,
            "status": "approved",
            "start_date": {"$lte": day},
            "end_date": {"$gte": day},
        }
    )


# --------------------------------------------------------------------------- #
# Self-service check in / out
# --------------------------------------------------------------------------- #

@router.get("/today", response_model=TodayStatus)
async def my_today(current_user: UserInDB = Depends(get_current_user)):
    """State of the check-in widget: whether you're in, out, or on leave."""
    db = get_database()
    day = today()

    user = await db.users.find_one({"_id": current_user.id})
    schedule = _schedule(user or {})

    doc = await db.attendance.find_one({"user_id": current_user.id, "day": day})
    leave = await _leave_on(db, current_user.id, day)

    checked_in = bool(doc and doc.get("check_in"))
    checked_out = bool(doc and doc.get("check_out"))

    # Show live elapsed time while the employee is still checked in.
    work_minutes = float((doc or {}).get("work_minutes") or 0.0)
    if checked_in and not checked_out:
        work_minutes = max(
            0.0,
            minutes_between(doc["check_in"], datetime.utcnow()) - schedule["break_minutes"],
        )

    extra_minutes = max(0.0, work_minutes - schedule["hours_per_day"] * 60)

    if checked_in:
        current_status = "checked_out" if checked_out else "present"
    elif leave:
        current_status = "leave"
    elif not is_working_day(day, schedule["week_days"]):
        current_status = "weekend"
    else:
        current_status = "absent"

    return TodayStatus(
        day=day,
        status=current_status,
        checked_in=checked_in,
        checked_out=checked_out,
        check_in=(doc or {}).get("check_in"),
        check_out=(doc or {}).get("check_out"),
        work_minutes=round(work_minutes, 2),
        work_hours=split_hours(work_minutes),
        extra_hours=split_hours(extra_minutes),
        is_working_day=is_working_day(day, schedule["week_days"]),
        on_leave=bool(leave),
        leave_type=(leave or {}).get("leave_type"),
        can_check_in=not checked_in,
        can_check_out=checked_in and not checked_out,
    )


@router.post("/check-in", response_model=TodayStatus)
async def check_in(
    payload: CheckInRequest = CheckInRequest(),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Start the working day. Idempotent by (user, day) — a second check-in on the
    same day is rejected rather than overwriting the first timestamp.
    """
    db = get_database()
    day = today()
    now = datetime.utcnow()

    existing = await db.attendance.find_one({"user_id": current_user.id, "day": day})
    if existing and existing.get("check_in"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already checked in today",
        )

    doc = {
        "user_id": current_user.id,
        "company_name": current_user.company_name,
        "day": day,
        "check_in": now,
        "check_out": None,
        "work_minutes": 0.0,
        "extra_minutes": 0.0,
        "break_minutes": 0.0,
        "status": "present",
        "note": payload.note,
        "source": "self",
        "recorded_by": current_user.id,
        "created_at": now,
        "updated_at": now,
    }

    if existing:
        await db.attendance.update_one({"_id": existing["_id"]}, {"$set": doc})
    else:
        await db.attendance.insert_one(doc)

    return await my_today(current_user)


@router.post("/check-out", response_model=TodayStatus)
async def check_out(
    payload: CheckOutRequest = CheckOutRequest(),
    current_user: UserInDB = Depends(get_current_user),
):
    """Close the working day and freeze the derived work/extra hours."""
    db = get_database()
    day = today()
    now = datetime.utcnow()

    doc = await db.attendance.find_one({"user_id": current_user.id, "day": day})
    if not doc or not doc.get("check_in"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You need to check in before checking out",
        )
    if doc.get("check_out"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already checked out today",
        )

    user = await db.users.find_one({"_id": current_user.id})
    schedule = _schedule(user or {})
    break_minutes = (
        payload.break_minutes if payload.break_minutes is not None else schedule["break_minutes"]
    )

    work, extra, day_status = _derive(
        doc["check_in"], now, break_minutes, schedule["hours_per_day"]
    )

    await db.attendance.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "check_out": now,
                "work_minutes": work,
                "extra_minutes": extra,
                "break_minutes": break_minutes,
                "status": day_status,
                "note": payload.note or doc.get("note"),
                "updated_at": now,
            }
        },
    )

    return await my_today(current_user)


# --------------------------------------------------------------------------- #
# Monthly views
# --------------------------------------------------------------------------- #

@router.get("/me", response_model=MyAttendanceResponse)
async def my_attendance(
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    current_user: UserInDB = Depends(get_current_user),
):
    """Day-wise attendance for the signed-in employee, defaulting to this month."""
    db = get_database()
    user = await db.users.find_one({"_id": current_user.id})
    return await monthly_attendance(db, user, year, month)


@router.get("/employee/{employee_id}", response_model=MyAttendanceResponse)
async def employee_attendance(
    employee_id: str,
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    One employee's month. Employees may only read their own record; admins may
    read anyone in their company.
    """
    target_id = _object_id(employee_id)

    if current_user.role != "admin" and str(target_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own attendance",
        )

    db = get_database()
    user = await db.users.find_one(
        {"_id": target_id, "company_name": current_user.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    return await monthly_attendance(db, user, year, month)


@router.get("/day", response_model=DayAttendanceResponse)
async def day_attendance(
    on: Optional[date] = Query(default=None, alias="date"),
    q: Optional[str] = Query(default=None, description="Search name or Login ID"),
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Admin/HR day view: every active employee and what they did on that date,
    including the ones with no record at all.
    """
    db = get_database()
    day = to_day(on) if on else today()

    query: Dict = {"company_name": admin.company_name, "is_active": {"$ne": False}}
    if q:
        needle = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [{"name": needle}, {"login_id": needle}]

    users = await db.users.find(query).sort("name", 1).to_list(length=500)
    user_ids = [user["_id"] for user in users]

    attendance_by_user: Dict[str, Dict] = {}
    if user_ids:
        cursor = db.attendance.find({"user_id": {"$in": user_ids}, "day": day})
        async for doc in cursor:
            attendance_by_user[str(doc["user_id"])] = doc

    leave_by_user: Dict[str, Dict] = {}
    if user_ids:
        cursor = db.leaves.find(
            {
                "user_id": {"$in": user_ids},
                "status": "approved",
                "start_date": {"$lte": day},
                "end_date": {"$gte": day},
            }
        )
        async for doc in cursor:
            leave_by_user[str(doc["user_id"])] = doc

    records = [
        attendance_record(
            attendance_by_user.get(str(user["_id"])),
            day,
            user,
            _schedule(user)["week_days"],
            leave_by_user.get(str(user["_id"])),
        )
        for user in users
    ]

    return DayAttendanceResponse(
        day=day,
        is_working_day=is_working_day(day),
        total_employees=len(users),
        present=sum(1 for r in records if r["status"] in ("present", "half_day")),
        absent=sum(1 for r in records if r["status"] == "absent"),
        on_leave=sum(1 for r in records if r["status"] == "leave"),
        records=records,
    )


@router.post("/manual", response_model=AttendanceRecord)
async def record_attendance(
    payload: ManualAttendance,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Manual correction by HR — a missed check-out, a recorded absence, a holiday.
    Upserts on (employee, day) so re-submitting a date edits it in place.
    """
    db = get_database()
    target_id = _object_id(payload.employee_id)

    user = await db.users.find_one(
        {"_id": target_id, "company_name": admin.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    day = to_day(payload.day)
    if day > today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance cannot be recorded for a future date",
        )

    schedule = _schedule(user)
    break_minutes = (
        payload.break_minutes if payload.break_minutes is not None else schedule["break_minutes"]
    )

    work = extra = 0.0
    day_status = payload.status
    if payload.check_in and payload.check_out:
        work, extra, derived = _derive(
            payload.check_in, payload.check_out, break_minutes, schedule["hours_per_day"]
        )
        # An explicit non-present status (leave, holiday) is respected as-is.
        if payload.status == "present":
            day_status = derived

    now = datetime.utcnow()
    doc = {
        "user_id": target_id,
        "company_name": admin.company_name,
        "day": day,
        "check_in": payload.check_in,
        "check_out": payload.check_out,
        "work_minutes": work,
        "extra_minutes": extra,
        "break_minutes": break_minutes if payload.check_in else 0.0,
        "status": day_status,
        "note": payload.note,
        "source": "admin",
        "recorded_by": admin.id,
        "updated_at": now,
    }

    await db.attendance.update_one(
        {"user_id": target_id, "day": day},
        {"$set": doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    fresh = await db.attendance.find_one({"user_id": target_id, "day": day})
    return attendance_record(fresh, day, user, schedule["week_days"])


# --------------------------------------------------------------------------- #
# Shared monthly builder
# --------------------------------------------------------------------------- #

async def monthly_attendance(
    db, user: Dict, year: Optional[int], month: Optional[int]
) -> MyAttendanceResponse:
    """
    One employee's month: a row per elapsed day plus the summary that payroll
    uses to work out payable days. Shared with the payroll router.
    """
    try:
        resolved_year, resolved_month = resolve_period(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    start, end = month_bounds(resolved_year, resolved_month)
    schedule = _schedule(user)
    week_days = schedule["week_days"]

    docs = await db.attendance.find(
        {"user_id": user["_id"], "day": {"$gte": start, "$lte": end}}
    ).to_list(length=62)
    by_day = {to_day(doc["day"]): doc for doc in docs}

    leaves = await db.leaves.find(
        {
            "user_id": user["_id"],
            "status": "approved",
            "start_date": {"$lte": end},
            "end_date": {"$gte": start},
        }
    ).to_list(length=200)

    leave_by_day: Dict[datetime, Dict] = {}
    for leave in leaves:
        for day in date_range(leave["start_date"], leave["end_date"]):
            if start <= day <= end and is_working_day(day, week_days):
                leave_by_day[day] = leave

    # Only report days that have already happened — future dates in the current
    # month would otherwise all read as "absent".
    horizon = min(end, today())

    records = [
        attendance_record(
            by_day.get(day), day, user, week_days, leave_by_day.get(day)
        )
        for day in date_range(start, end)
        if day <= horizon
    ]

    total_working = count_working_days(start, end, week_days)
    present = sum(1 for r in records if r["status"] == "present")
    half = sum(1 for r in records if r["status"] == "half_day")
    absent = sum(1 for r in records if r["status"] == "absent")

    leave_days = sum(
        1
        for day, leave in leave_by_day.items()
        if day <= horizon and (by_day.get(day) or {}).get("check_in") is None
    )
    unpaid_days = sum(
        1
        for day, leave in leave_by_day.items()
        if day <= horizon
        and leave.get("leave_type") == "unpaid"
        and (by_day.get(day) or {}).get("check_in") is None
    )

    work_total = sum(r["work_minutes"] for r in records)
    extra_total = sum(r["extra_minutes"] for r in records)
    worked_days = present + half

    # Absences and unpaid leave are what reduce pay; paid/sick leave does not.
    payable = max(0.0, total_working - absent - unpaid_days - (half * 0.5))

    summary = AttendanceSummary(
        period=month_label(resolved_year, resolved_month),
        year=resolved_year,
        month=resolved_month,
        total_working_days=total_working,
        days_present=present,
        days_absent=absent,
        half_days=half,
        leave_days=float(leave_days),
        unpaid_leave_days=float(unpaid_days),
        payable_days=round(payable, 2),
        total_work_hours=split_hours(work_total),
        total_extra_hours=split_hours(extra_total),
        average_work_hours=split_hours(work_total / worked_days if worked_days else 0),
    )

    return MyAttendanceResponse(summary=summary, records=records)
