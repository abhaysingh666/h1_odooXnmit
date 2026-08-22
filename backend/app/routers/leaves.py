"""
Leave / time-off management.

Employees apply for their own time off and watch a calendar; admins and HR
officers see every request in the company and approve or reject it with a
comment. Balances come from each employee's allocation (24 paid / 5 sick by
default); unpaid leave is uncapped but reduces payable days at payroll time.
"""

from datetime import datetime
from typing import Dict, List, Optional

from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from ..core import get_database
from ..core.cloudinary_config import upload_file_to_cloudinary
from ..models import UserInDB
from ..schemas.employee import MessageResponse
from ..schemas.leave import (
    LeaveAllocationResponse,
    LeaveAllocationRow,
    LeaveBalanceResponse,
    LeaveCalendarDay,
    LeaveCalendarResponse,
    LeaveCreate,
    LeaveListResponse,
    LeaveRecord,
    LeaveReview,
    LeaveTypeBalance,
)
from ..utils import get_current_admin, get_current_user
from ..utils.dates import (
    count_working_days,
    date_range,
    is_working_day,
    month_bounds,
    overlaps,
    to_day,
)
from ..utils.presenters import leave_record

router = APIRouter(prefix="/api/leaves", tags=["Time Off"])

LEAVE_LABELS = {
    "paid": "Paid Time Off",
    "sick": "Sick Time Off",
    "unpaid": "Unpaid Leave",
}

ALLOWED_ATTACHMENT_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
]
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024


def _object_id(value: str, label: str = "request id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {label}"
        )
    return ObjectId(value)


def _viewer(current_user: UserInDB) -> Dict:
    return {"_id": current_user.id, "role": current_user.role}


def _week_days(user: Dict) -> List[int]:
    return (user.get("schedule") or {}).get("week_days") or [0, 1, 2, 3, 4]


def _allocation(user: Dict) -> Dict[str, Optional[int]]:
    allocation = user.get("leave_allocation") or {}
    return {
        "paid": int(allocation.get("paid", 24)),
        "sick": int(allocation.get("sick", 5)),
        "unpaid": None,  # uncapped
    }


async def _balances(db, user: Dict, year: int) -> Dict[str, LeaveTypeBalance]:
    """Used / pending / available days per leave type for a calendar year."""
    start = datetime(year, 1, 1)
    end = datetime(year, 12, 31)

    docs = await db.leaves.find(
        {
            "user_id": user["_id"],
            "status": {"$in": ["pending", "approved"]},
            "start_date": {"$lte": end},
            "end_date": {"$gte": start},
        }
    ).to_list(length=500)

    allocation = _allocation(user)
    used: Dict[str, float] = {"paid": 0.0, "sick": 0.0, "unpaid": 0.0}
    pending: Dict[str, float] = {"paid": 0.0, "sick": 0.0, "unpaid": 0.0}

    for doc in docs:
        leave_type = doc.get("leave_type", "paid")
        if leave_type not in used:
            continue
        days = float(doc.get("days") or 0.0)
        if doc.get("status") == "approved":
            used[leave_type] += days
        else:
            pending[leave_type] += days

    balances: Dict[str, LeaveTypeBalance] = {}
    for leave_type, label in LEAVE_LABELS.items():
        allocated = allocation[leave_type]
        available = (
            None
            if allocated is None
            else round(max(0.0, allocated - used[leave_type] - pending[leave_type]), 2)
        )
        balances[leave_type] = LeaveTypeBalance(
            leave_type=leave_type,
            label=label,
            allocated=allocated,
            used=round(used[leave_type], 2),
            pending=round(pending[leave_type], 2),
            available=available,
        )

    return balances


# --------------------------------------------------------------------------- #
# Employee: apply, list, balances, calendar
# --------------------------------------------------------------------------- #

@router.post("", response_model=LeaveRecord, status_code=status.HTTP_201_CREATED)
async def apply_for_leave(
    payload: LeaveCreate,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Submit a time-off request. Admins may file on an employee's behalf by
    passing `employee_id`; everyone else files for themselves.
    """
    db = get_database()

    target_id = current_user.id
    if payload.employee_id and str(payload.employee_id) != str(current_user.id):
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only request time off for yourself",
            )
        target_id = _object_id(payload.employee_id, "employee id")

    user = await db.users.find_one(
        {"_id": target_id, "company_name": current_user.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    start = to_day(payload.start_date)
    end = to_day(payload.end_date)
    week_days = _week_days(user)

    days = count_working_days(start, end, week_days)
    if days == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected period contains no working days",
        )
    if payload.half_day:
        if start != end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A half day must start and end on the same date",
            )
        days = 0.5

    # A sick note is what lets HR approve sick leave without a follow-up email.
    if payload.leave_type == "sick" and days > 2 and not payload.attachment_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sick leave longer than 2 days needs a medical certificate attached",
        )

    # Reject double-booking before it reaches the approver's queue.
    existing = await db.leaves.find(
        {
            "user_id": target_id,
            "status": {"$in": ["pending", "approved"]},
            "start_date": {"$lte": end},
            "end_date": {"$gte": start},
        }
    ).to_list(length=20)
    for doc in existing:
        if overlaps(start, end, doc["start_date"], doc["end_date"]):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have a request covering those dates",
            )

    balances = await _balances(db, user, start.year)
    balance = balances[payload.leave_type]
    if balance.available is not None and days > balance.available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only {balance.available:g} day(s) of {balance.label.lower()} left — "
                f"this request needs {days:g}"
            ),
        )

    now = datetime.utcnow()
    doc = {
        "user_id": target_id,
        "company_name": current_user.company_name,
        "employee_name": user.get("name"),
        "employee_login_id": user.get("login_id"),
        "employee_avatar_url": user.get("avatar_url"),
        "leave_type": payload.leave_type,
        "start_date": start,
        "end_date": end,
        "days": float(days),
        "half_day": payload.half_day,
        "remarks": payload.remarks,
        "attachment_url": payload.attachment_url,
        "status": "pending",
        "reviewed_by": None,
        "reviewer_name": None,
        "review_comment": None,
        "reviewed_at": None,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.leaves.insert_one(doc)
    doc["_id"] = result.inserted_id
    return leave_record(doc, _viewer(current_user))


@router.get("/me", response_model=LeaveListResponse)
async def my_leaves(
    leave_status: Optional[str] = Query(
        default=None, alias="status", pattern="^(pending|approved|rejected|cancelled)$"
    ),
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    limit: int = Query(default=100, ge=1, le=300),
    current_user: UserInDB = Depends(get_current_user),
):
    """The signed-in employee's own requests — they never see anyone else's."""
    db = get_database()

    query: Dict = {"user_id": current_user.id}
    if leave_status:
        query["status"] = leave_status
    if year:
        query["start_date"] = {"$lte": datetime(year, 12, 31)}
        query["end_date"] = {"$gte": datetime(year, 1, 1)}

    docs = await db.leaves.find(query).sort("start_date", -1).to_list(length=limit)
    counts = await _status_counts(db, {"user_id": current_user.id})
    viewer = _viewer(current_user)

    return LeaveListResponse(
        total=counts["total"],
        pending=counts["pending"],
        approved=counts["approved"],
        rejected=counts["rejected"],
        requests=[leave_record(doc, viewer) for doc in docs],
    )


@router.get("/balance", response_model=LeaveBalanceResponse)
async def my_balance(
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    employee_id: Optional[str] = Query(default=None),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Remaining allocation, e.g. "Paid Time Off — 24 Days Available". Admins can
    ask for another employee's balance via `employee_id`.
    """
    db = get_database()
    resolved_year = year or datetime.utcnow().year

    target_id = current_user.id
    if employee_id and str(employee_id) != str(current_user.id):
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own balance",
            )
        target_id = _object_id(employee_id, "employee id")

    user = await db.users.find_one(
        {"_id": target_id, "company_name": current_user.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    balances = await _balances(db, user, resolved_year)
    counts = await _status_counts(db, {"user_id": target_id})

    return LeaveBalanceResponse(
        year=resolved_year,
        balances=list(balances.values()),
        pending_requests=counts["pending"],
        approved_requests=counts["approved"],
        rejected_requests=counts["rejected"],
    )


@router.get("/calendar", response_model=LeaveCalendarResponse)
async def leave_calendar(
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    employee_id: Optional[str] = Query(default=None),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Marked-up days for the employee time-off calendar. Omit `month` for the whole
    year; pass it for a single month's grid.
    """
    db = get_database()
    resolved_year = year or datetime.utcnow().year

    target_id = current_user.id
    if employee_id and str(employee_id) != str(current_user.id):
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own calendar",
            )
        target_id = _object_id(employee_id, "employee id")

    user = await db.users.find_one(
        {"_id": target_id, "company_name": current_user.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    if month:
        window_start, window_end = month_bounds(resolved_year, month)
    else:
        window_start = datetime(resolved_year, 1, 1)
        window_end = datetime(resolved_year, 12, 31)

    docs = await db.leaves.find(
        {
            "user_id": target_id,
            "status": {"$in": ["pending", "approved"]},
            "start_date": {"$lte": window_end},
            "end_date": {"$gte": window_start},
        }
    ).to_list(length=500)

    week_days = _week_days(user)
    days: Dict[datetime, LeaveCalendarDay] = {}

    for doc in docs:
        for day in date_range(doc["start_date"], doc["end_date"]):
            if not (window_start <= day <= window_end):
                continue
            working = is_working_day(day, week_days)
            if not working:
                continue
            # An approved day should never be hidden by an overlapping pending one.
            current = days.get(day)
            if current and current.status == "approved":
                continue
            days[day] = LeaveCalendarDay(
                day=day,
                leave_type=doc.get("leave_type"),
                status=doc.get("status"),
                is_working_day=working,
            )

    return LeaveCalendarResponse(
        year=resolved_year,
        days=[days[key] for key in sorted(days)],
    )


@router.post("/attachment")
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Upload a supporting document (typically a sick-leave certificate) and get
    back a URL to attach to the request.
    """
    if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attachments must be a PDF or an image (JPEG, PNG, WEBP)",
        )

    content = await file.read()
    if len(content) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Attachments must be 10 MB or smaller",
        )

    try:
        result = upload_file_to_cloudinary(
            content,
            folder="dayflow_hrms/leave_attachments",
            filename=file.filename,
        )
    except Exception as exc:  # Cloudinary raises plain Exceptions
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upload failed: {exc}",
        )

    return {"url": result["url"], "filename": file.filename}


# --------------------------------------------------------------------------- #
# Admin / HR: review queue
# --------------------------------------------------------------------------- #

@router.get("", response_model=LeaveListResponse)
async def list_leaves(
    q: Optional[str] = Query(default=None, description="Search employee name or Login ID"),
    leave_status: Optional[str] = Query(
        default=None, alias="status", pattern="^(pending|approved|rejected|cancelled)$"
    ),
    leave_type: Optional[str] = Query(default=None, pattern="^(paid|sick|unpaid)$"),
    employee_id: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Every request in the company — the Time Off approvals table. Admin/HR only;
    employees use `/api/leaves/me`.
    """
    db = get_database()

    query: Dict = {"company_name": admin.company_name}
    if leave_status:
        query["status"] = leave_status
    if leave_type:
        query["leave_type"] = leave_type
    if employee_id:
        query["user_id"] = _object_id(employee_id, "employee id")
    if q:
        needle = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [{"employee_name": needle}, {"employee_login_id": needle}]

    docs = (
        await db.leaves.find(query)
        .sort([("status", 1), ("start_date", -1)])
        .to_list(length=limit)
    )
    counts = await _status_counts(db, {"company_name": admin.company_name})
    viewer = _viewer(admin)

    return LeaveListResponse(
        total=counts["total"],
        pending=counts["pending"],
        approved=counts["approved"],
        rejected=counts["rejected"],
        requests=[leave_record(doc, viewer) for doc in docs],
    )


@router.get("/allocations", response_model=LeaveAllocationResponse)
async def leave_allocations(
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    q: Optional[str] = Query(default=None, description="Search employee name or Login ID"),
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Yearly allocation and usage for every active employee — the Allocation tab.

    Deliberately two queries for the whole company (employees, then their
    requests for the year) rather than a balance lookup per employee.
    """
    db = get_database()
    resolved_year = year or datetime.utcnow().year
    start = datetime(resolved_year, 1, 1)
    end = datetime(resolved_year, 12, 31)

    query: Dict = {"company_name": admin.company_name, "is_active": {"$ne": False}}
    if q:
        needle = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [{"name": needle}, {"login_id": needle}]

    users = await db.users.find(query).sort("name", 1).to_list(length=500)
    if not users:
        return LeaveAllocationResponse(year=resolved_year, total_employees=0, rows=[])

    # user id -> {leave_type: {"used": x, "pending": y}}
    tally: Dict[str, Dict[str, Dict[str, float]]] = {}
    cursor = db.leaves.find(
        {
            "user_id": {"$in": [user["_id"] for user in users]},
            "status": {"$in": ["pending", "approved"]},
            "start_date": {"$lte": end},
            "end_date": {"$gte": start},
        },
        {"user_id": 1, "leave_type": 1, "status": 1, "days": 1},
    )
    async for doc in cursor:
        bucket = tally.setdefault(str(doc["user_id"]), {})
        entry = bucket.setdefault(doc.get("leave_type", "paid"), {"used": 0.0, "pending": 0.0})
        key = "used" if doc.get("status") == "approved" else "pending"
        entry[key] += float(doc.get("days") or 0.0)

    rows: List[LeaveAllocationRow] = []
    for user in users:
        allocation = _allocation(user)
        spent = tally.get(str(user["_id"]), {})

        def _for(leave_type: str) -> tuple[float, float]:
            entry = spent.get(leave_type) or {}
            return round(float(entry.get("used", 0.0)), 2), round(
                float(entry.get("pending", 0.0)), 2
            )

        paid_used, paid_pending = _for("paid")
        sick_used, sick_pending = _for("sick")
        unpaid_used, _ = _for("unpaid")

        paid_allocated = allocation["paid"] or 0
        sick_allocated = allocation["sick"] or 0

        rows.append(
            LeaveAllocationRow(
                employee_id=str(user["_id"]),
                employee_name=user.get("name", ""),
                employee_login_id=user.get("login_id", ""),
                employee_avatar_url=user.get("avatar_url"),
                department=(user.get("job") or {}).get("department"),
                paid_allocated=paid_allocated,
                paid_used=paid_used,
                paid_pending=paid_pending,
                paid_available=round(
                    max(0.0, paid_allocated - paid_used - paid_pending), 2
                ),
                sick_allocated=sick_allocated,
                sick_used=sick_used,
                sick_pending=sick_pending,
                sick_available=round(
                    max(0.0, sick_allocated - sick_used - sick_pending), 2
                ),
                unpaid_used=unpaid_used,
            )
        )

    return LeaveAllocationResponse(
        year=resolved_year, total_employees=len(rows), rows=rows
    )


@router.post("/{leave_id}/review", response_model=LeaveRecord)
async def review_leave(
    leave_id: str,
    payload: LeaveReview,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Approve or reject a pending request. The decision is reflected immediately in
    the employee's calendar, balance and attendance view.
    """
    db = get_database()
    doc = await db.leaves.find_one(
        {"_id": _object_id(leave_id), "company_name": admin.company_name}
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
        )
    if doc.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This request has already been {doc.get('status')}",
        )

    new_status = "approved" if payload.action == "approve" else "rejected"
    now = datetime.utcnow()

    await db.leaves.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "status": new_status,
                "reviewed_by": admin.id,
                "reviewer_name": admin.name,
                "review_comment": payload.comment,
                "reviewed_at": now,
                "updated_at": now,
            }
        },
    )

    # Approved days become "leave" in the attendance record so the month view and
    # the payslip's payable-day count agree.
    if new_status == "approved":
        await _mark_attendance_leave(db, doc)

    fresh = await db.leaves.find_one({"_id": doc["_id"]})
    return leave_record(fresh, _viewer(admin))


@router.post("/{leave_id}/cancel", response_model=MessageResponse)
async def cancel_leave(
    leave_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """Withdraw a request. Only pending requests, only your own (or an admin's action)."""
    db = get_database()
    doc = await db.leaves.find_one(
        {"_id": _object_id(leave_id), "company_name": current_user.company_name}
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
        )

    is_owner = str(doc.get("user_id")) == str(current_user.id)
    if not is_owner and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only withdraw your own requests",
        )
    if doc.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending requests can be withdrawn",
        )

    await db.leaves.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "status": "cancelled",
                "updated_at": datetime.utcnow(),
            }
        },
    )
    return MessageResponse(message="Time-off request withdrawn.")


@router.get("/{leave_id}", response_model=LeaveRecord)
async def get_leave(
    leave_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """A single request. Employees may only open their own."""
    db = get_database()
    doc = await db.leaves.find_one(
        {"_id": _object_id(leave_id), "company_name": current_user.company_name}
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
        )

    if current_user.role != "admin" and str(doc.get("user_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own time-off records",
        )

    return leave_record(doc, _viewer(current_user))


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

async def _status_counts(db, base_query: Dict) -> Dict[str, int]:
    """Pending/approved/rejected tallies for the header chips."""
    pipeline = [
        {"$match": base_query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    counts = {"total": 0, "pending": 0, "approved": 0, "rejected": 0, "cancelled": 0}
    async for row in db.leaves.aggregate(pipeline):
        key = row["_id"]
        if key in counts:
            counts[key] = row["count"]
        counts["total"] += row["count"]
    return counts


async def _mark_attendance_leave(db, leave: Dict) -> None:
    """
    Write a `leave` attendance row for every working day of an approved request.

    Days the employee actually checked in are left alone — a real check-in always
    beats a leave marker.
    """
    user = await db.users.find_one({"_id": leave["user_id"]})
    week_days = _week_days(user or {})

    for day in date_range(leave["start_date"], leave["end_date"]):
        if not is_working_day(day, week_days):
            continue

        existing = await db.attendance.find_one(
            {"user_id": leave["user_id"], "day": day}
        )
        if existing and existing.get("check_in"):
            continue

        now = datetime.utcnow()
        await db.attendance.update_one(
            {"user_id": leave["user_id"], "day": day},
            {
                "$set": {
                    "user_id": leave["user_id"],
                    "company_name": leave["company_name"],
                    "day": day,
                    "status": "leave",
                    "work_minutes": 0.0,
                    "extra_minutes": 0.0,
                    "break_minutes": 0.0,
                    "note": f"{LEAVE_LABELS.get(leave['leave_type'], 'Leave')} (approved)",
                    "source": "admin",
                    "recorded_by": leave.get("reviewed_by"),
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
