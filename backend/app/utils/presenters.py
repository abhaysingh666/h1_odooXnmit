"""
Shared shaping of MongoDB documents into API payloads.

Keeping this in one place means the directory grid, the profile page and the
attendance table all agree on what "present today" means and which fields an
employee is allowed to see about a colleague.
"""

from datetime import datetime
from typing import Dict, List, Optional

from .dates import is_working_day, split_hours, to_day

# Blocks any authenticated user may read about a colleague.
PUBLIC_PROFILE_KEYS = ("job", "resume", "schedule")


def status_for_day(
    day: datetime,
    attendance: Optional[Dict],
    leave: Optional[Dict],
    week_days: Optional[List[int]] = None,
) -> str:
    """
    Resolve a single day into one of:
      present | checked_out | leave | absent | weekend

    An approved leave wins over a missing attendance record, and a same-day
    check-in wins over leave (someone who came in anyway is present).
    """
    if attendance and attendance.get("check_in"):
        return "checked_out" if attendance.get("check_out") else "present"
    if leave:
        return "leave"
    if not is_working_day(to_day(day), week_days):
        return "weekend"
    return "absent"


def employee_card(
    user: Dict,
    attendance: Optional[Dict] = None,
    leave: Optional[Dict] = None,
    day: Optional[datetime] = None,
) -> Dict:
    """Directory tile payload."""
    job = user.get("job") or {}
    reference_day = day or to_day(datetime.utcnow())
    schedule = user.get("schedule") or {}

    return {
        "_id": str(user["_id"]),
        "login_id": user.get("login_id"),
        "name": user.get("name"),
        "email_id": user.get("email_id"),
        "phone": user.get("phone"),
        "role": user.get("role", "employee"),
        "avatar_url": user.get("avatar_url"),
        "department": job.get("department"),
        "job_title": job.get("job_title"),
        "is_active": user.get("is_active", True),
        "is_verified": user.get("is_verified", False),
        "date_of_joining": user.get("date_of_joining"),
        "today_status": status_for_day(
            reference_day, attendance, leave, schedule.get("week_days")
        ),
        "checked_in_at": (attendance or {}).get("check_in"),
        "checked_out_at": (attendance or {}).get("check_out"),
        "leave_type": (leave or {}).get("leave_type"),
    }


def employee_detail(
    user: Dict,
    viewer: Dict,
    attendance: Optional[Dict] = None,
    leave: Optional[Dict] = None,
) -> Dict:
    """
    Full profile payload.

    Private info (bank, statutory, personal contact) is returned only to the
    employee themselves or to an admin/HR officer — the directory's view-only
    mode for colleagues sees the public blocks only.
    """
    viewer_is_admin = viewer.get("role") == "admin"
    is_self = str(viewer.get("_id")) == str(user["_id"])
    can_see_private = viewer_is_admin or is_self

    payload = {
        "_id": str(user["_id"]),
        "login_id": user.get("login_id"),
        "company_name": user.get("company_name"),
        "company_logo_url": user.get("company_logo_url"),
        "name": user.get("name"),
        "email_id": user.get("email_id"),
        "phone": user.get("phone"),
        "role": user.get("role", "employee"),
        "avatar_url": user.get("avatar_url"),
        "is_active": user.get("is_active", True),
        "is_verified": user.get("is_verified", False),
        "is_first_login": user.get("is_first_login", False),
        "date_of_joining": user.get("date_of_joining"),
        "created_at": user.get("created_at"),
        "job": user.get("job") or {},
        "resume": user.get("resume") or {},
        "schedule": user.get("schedule") or {},
        "leave_allocation": user.get("leave_allocation") or {},
        "private": (user.get("private") or {}) if can_see_private else None,
        "can_edit": can_see_private,
        "can_edit_all": viewer_is_admin,
        # Salary is admin-only per the spec; employees read their own payroll
        # through /api/payroll/me, which is read-only.
        "can_view_salary": viewer_is_admin or is_self,
        "today_status": status_for_day(
            to_day(datetime.utcnow()),
            attendance,
            leave,
            (user.get("schedule") or {}).get("week_days"),
        ),
    }
    return payload


def attendance_record(
    doc: Optional[Dict],
    day: datetime,
    user: Optional[Dict] = None,
    week_days: Optional[List[int]] = None,
    leave: Optional[Dict] = None,
) -> Dict:
    """
    One attendance row. `doc` may be None — the table shows every calendar day in
    the period, including days with no record, so gaps are visible.
    """
    work_minutes = float((doc or {}).get("work_minutes") or 0.0)
    extra_minutes = float((doc or {}).get("extra_minutes") or 0.0)
    working = is_working_day(to_day(day), week_days)

    if doc and doc.get("status"):
        status = doc["status"]
    elif leave:
        status = "leave"
    elif not working:
        status = "weekend"
    else:
        status = "absent"

    return {
        "_id": str(doc["_id"]) if doc and doc.get("_id") else None,
        "employee_id": str((doc or {}).get("user_id") or (user or {}).get("_id") or ""),
        "employee_name": (user or {}).get("name"),
        "employee_login_id": (user or {}).get("login_id"),
        "employee_avatar_url": (user or {}).get("avatar_url"),
        "day": to_day(day),
        "check_in": (doc or {}).get("check_in"),
        "check_out": (doc or {}).get("check_out"),
        "work_minutes": work_minutes,
        "extra_minutes": extra_minutes,
        "break_minutes": float((doc or {}).get("break_minutes") or 0.0),
        "work_hours": split_hours(work_minutes),
        "extra_hours": split_hours(extra_minutes),
        "status": status,
        "is_working_day": working,
        "note": (doc or {}).get("note"),
        "source": (doc or {}).get("source", "self"),
    }


def leave_record(doc: Dict, viewer: Optional[Dict] = None) -> Dict:
    """One time-off row, with a flag for whether the viewer can withdraw it."""
    viewer = viewer or {}
    is_owner = str(viewer.get("_id")) == str(doc.get("user_id"))
    is_admin = viewer.get("role") == "admin"

    return {
        "_id": str(doc["_id"]),
        "employee_id": str(doc.get("user_id")),
        "employee_name": doc.get("employee_name"),
        "employee_login_id": doc.get("employee_login_id"),
        "employee_avatar_url": doc.get("employee_avatar_url"),
        "leave_type": doc.get("leave_type"),
        "start_date": doc.get("start_date"),
        "end_date": doc.get("end_date"),
        "days": float(doc.get("days") or 0.0),
        "half_day": bool(doc.get("half_day")),
        "remarks": doc.get("remarks"),
        "attachment_url": doc.get("attachment_url"),
        "status": doc.get("status"),
        "reviewer_name": doc.get("reviewer_name"),
        "review_comment": doc.get("review_comment"),
        "reviewed_at": doc.get("reviewed_at"),
        "created_at": doc.get("created_at"),
        "can_cancel": doc.get("status") == "pending" and (is_owner or is_admin),
    }
