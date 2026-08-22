"""
Employee directory and profile management.

Read access is company-wide for every authenticated user — the directory grid in
the spec is visible to employees, but in view-only mode. Write access is split:
an employee may edit their own contact/resume blocks, an admin may edit anything
on anyone in their company.
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pymongo.errors import DuplicateKeyError

from ..core import get_database
from ..core.cloudinary_config import upload_image_to_cloudinary
from ..models import UserInDB
from ..schemas.employee import (
    DirectoryStats,
    EmployeeAdminUpdate,
    EmployeeCard,
    EmployeeDetail,
    EmployeeSelfUpdate,
    MessageResponse,
)
from ..utils import get_current_admin, get_current_user
from ..utils.dates import to_day, today
from ..utils.presenters import employee_card, employee_detail

router = APIRouter(prefix="/api/employees", tags=["Employees"])

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
MAX_AVATAR_BYTES = 5 * 1024 * 1024


def _object_id(value: str, label: str = "employee id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {label}",
        )
    return ObjectId(value)


async def _today_context(db, company_name: str, user_ids: List[ObjectId]) -> tuple[Dict, Dict]:
    """
    Attendance and approved-leave lookups for today, keyed by user id.

    Two queries for the whole page instead of two per employee.
    """
    day = today()

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

    return attendance_by_user, leave_by_user


@router.get("", response_model=List[EmployeeCard])
async def list_employees(
    q: Optional[str] = Query(default=None, description="Search name, Login ID, email or department"),
    department: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default=None, pattern="^(employee|admin)$"),
    presence: Optional[str] = Query(
        default=None,
        pattern="^(present|leave|absent)$",
        description="Filter by today's attendance status",
    ),
    include_inactive: bool = Query(default=False),
    limit: int = Query(default=200, ge=1, le=500),
    current_user: UserInDB = Depends(get_current_user),
):
    """
    The directory grid. Scoped to the caller's company; employees get the same
    list as admins but the cards open in view-only mode.
    """
    db = get_database()

    query: Dict = {"company_name": current_user.company_name}
    if not include_inactive:
        query["is_active"] = {"$ne": False}
    if role:
        query["role"] = role
    if department:
        query["job.department"] = department
    if q:
        needle = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [
            {"name": needle},
            {"login_id": needle},
            {"email_id": needle},
            {"job.department": needle},
            {"job.job_title": needle},
        ]

    users = await db.users.find(query).sort("name", 1).to_list(length=limit)
    user_ids = [user["_id"] for user in users]
    attendance_by_user, leave_by_user = await _today_context(
        db, current_user.company_name, user_ids
    )

    cards = [
        employee_card(
            user,
            attendance_by_user.get(str(user["_id"])),
            leave_by_user.get(str(user["_id"])),
        )
        for user in users
    ]

    if presence:
        wanted = {"present": {"present", "checked_out"}, "leave": {"leave"}, "absent": {"absent"}}
        cards = [card for card in cards if card["today_status"] in wanted[presence]]

    return cards


@router.get("/stats", response_model=DirectoryStats)
async def directory_stats(current_user: UserInDB = Depends(get_current_user)):
    """Headline counters for the dashboards."""
    db = get_database()
    company = current_user.company_name
    day = today()
    month_start = datetime(day.year, day.month, 1)

    users = await db.users.find(
        {"company_name": company},
        {"_id": 1, "role": 1, "is_active": 1, "is_verified": 1, "created_at": 1, "schedule": 1},
    ).to_list(length=1000)

    user_ids = [user["_id"] for user in users]
    attendance_by_user, leave_by_user = await _today_context(db, company, user_ids)

    active = [user for user in users if user.get("is_active", True)]

    present = sum(
        1
        for user in active
        if (attendance_by_user.get(str(user["_id"])) or {}).get("check_in")
    )
    on_leave = sum(
        1
        for user in active
        if str(user["_id"]) in leave_by_user
        and not (attendance_by_user.get(str(user["_id"])) or {}).get("check_in")
    )

    pending_requests = 0
    if current_user.role == "admin":
        pending_requests = await db.leaves.count_documents(
            {"company_name": company, "status": "pending"}
        )

    return DirectoryStats(
        total=len(users),
        active=len(active),
        admins=sum(1 for user in users if user.get("role") == "admin"),
        present_today=present,
        on_leave_today=on_leave,
        absent_today=max(0, len(active) - present - on_leave),
        pending_leave_requests=pending_requests,
        new_this_month=sum(
            1 for user in users if (user.get("created_at") or day) >= month_start
        ),
        awaiting_activation=sum(1 for user in users if not user.get("is_verified", False)),
    )


@router.get("/departments", response_model=List[str])
async def list_departments(current_user: UserInDB = Depends(get_current_user)):
    """Distinct departments, for the directory filter."""
    db = get_database()
    values = await db.users.distinct(
        "job.department", {"company_name": current_user.company_name}
    )
    return sorted([value for value in values if value])


@router.get("/me", response_model=EmployeeDetail)
async def get_my_profile(current_user: UserInDB = Depends(get_current_user)):
    """The signed-in user's own profile — the "My Profile" form view."""
    db = get_database()
    user = await db.users.find_one({"_id": current_user.id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    attendance, leaves = await _today_context(db, current_user.company_name, [current_user.id])
    return employee_detail(
        user,
        user,
        attendance.get(str(current_user.id)),
        leaves.get(str(current_user.id)),
    )


@router.patch("/me", response_model=EmployeeDetail)
async def update_my_profile(
    payload: EmployeeSelfUpdate,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Self-service edit. Limited to phone, personal contact details and the resume
    blocks — job details, salary and the statutory fields stay with HR.
    """
    db = get_database()
    updates = _build_updates(payload, admin=False)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update"
        )

    updates["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": current_user.id}, {"$set": updates})

    user = await db.users.find_one({"_id": current_user.id})
    return employee_detail(user, user)


@router.post("/me/avatar", response_model=EmployeeDetail)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
):
    """Profile picture — the avatar shown on the directory card and topbar."""
    url = await _upload_avatar(file)

    db = get_database()
    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"avatar_url": url, "updated_at": datetime.utcnow()}},
    )

    user = await db.users.find_one({"_id": current_user.id})
    return employee_detail(user, user)


@router.get("/{employee_id}", response_model=EmployeeDetail)
async def get_employee(
    employee_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    One employee's profile. Colleagues see the public blocks only; the employee
    themselves and admins additionally see the private/statutory block.
    """
    db = get_database()
    user = await db.users.find_one(
        {"_id": _object_id(employee_id), "company_name": current_user.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    attendance, leaves = await _today_context(
        db, current_user.company_name, [user["_id"]]
    )
    viewer = current_user.model_dump(by_alias=True)
    viewer["_id"] = current_user.id

    return employee_detail(
        user,
        viewer,
        attendance.get(str(user["_id"])),
        leaves.get(str(user["_id"])),
    )


@router.patch("/{employee_id}", response_model=EmployeeDetail)
async def update_employee(
    employee_id: str,
    payload: EmployeeAdminUpdate,
    admin: UserInDB = Depends(get_current_admin),
):
    """Admin/HR edit of any employee in the company."""
    db = get_database()
    target_id = _object_id(employee_id)

    user = await db.users.find_one(
        {"_id": target_id, "company_name": admin.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Removing your own admin rights would lock you out of this very screen.
    if (
        payload.role
        and payload.role != "admin"
        and str(target_id) == str(admin.id)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own administrator role",
        )

    updates = _build_updates(payload, admin=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update"
        )

    updates["updated_at"] = datetime.utcnow()
    try:
        await db.users.update_one({"_id": target_id}, {"$set": updates})
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another account already uses that email address",
        )

    fresh = await db.users.find_one({"_id": target_id})
    viewer = admin.model_dump(by_alias=True)
    viewer["_id"] = admin.id
    return employee_detail(fresh, viewer)


@router.post("/{employee_id}/avatar", response_model=EmployeeDetail)
async def upload_employee_avatar(
    employee_id: str,
    file: UploadFile = File(...),
    admin: UserInDB = Depends(get_current_admin),
):
    """Admins can set a photo on behalf of an employee."""
    db = get_database()
    target_id = _object_id(employee_id)

    user = await db.users.find_one(
        {"_id": target_id, "company_name": admin.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    url = await _upload_avatar(file)
    await db.users.update_one(
        {"_id": target_id},
        {"$set": {"avatar_url": url, "updated_at": datetime.utcnow()}},
    )

    fresh = await db.users.find_one({"_id": target_id})
    viewer = admin.model_dump(by_alias=True)
    viewer["_id"] = admin.id
    return employee_detail(fresh, viewer)


@router.post("/{employee_id}/deactivate", response_model=MessageResponse)
async def deactivate_employee(
    employee_id: str,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Soft-deactivate. Attendance, leave and payroll history are preserved — the
    account simply stops appearing in the active directory and cannot sign in.
    """
    db = get_database()
    target_id = _object_id(employee_id)

    if str(target_id) == str(admin.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    result = await db.users.update_one(
        {"_id": target_id, "company_name": admin.company_name},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    return MessageResponse(message="Employee deactivated. Their history is preserved.")


@router.post("/{employee_id}/activate", response_model=MessageResponse)
async def activate_employee(
    employee_id: str,
    admin: UserInDB = Depends(get_current_admin),
):
    db = get_database()
    result = await db.users.update_one(
        {"_id": _object_id(employee_id), "company_name": admin.company_name},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    return MessageResponse(message="Employee reactivated.")


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _build_updates(payload: EmployeeSelfUpdate, admin: bool) -> Dict:
    """
    Flatten a partial profile update into dotted `$set` paths.

    Nested blocks are merged field-by-field (`private.bank_name`) rather than
    replaced wholesale, so a form that only submits one tab cannot wipe another.
    """
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    updates: Dict = {}

    for field in ("phone", "name", "email_id", "role", "is_active"):
        if field in data:
            updates[field] = data[field]

    if "date_of_joining" in data:
        joining: date = data["date_of_joining"]
        updates["date_of_joining"] = to_day(joining)

    nested_blocks = ["private", "resume"]
    if admin:
        nested_blocks += ["job", "schedule", "leave_allocation"]

    for block in nested_blocks:
        values = data.get(block) or {}
        for key, value in values.items():
            if isinstance(value, date) and not isinstance(value, datetime):
                value = to_day(value)
            updates[f"{block}.{key}"] = value

    # Statutory/bank details drive payroll, so only HR may write them.
    if not admin:
        protected = (
            "private.bank_name",
            "private.account_number",
            "private.ifsc_code",
            "private.pan_no",
            "private.uan_no",
            "private.esic_no",
        )
        for key in protected:
            updates.pop(key, None)

    return updates


async def _upload_avatar(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG and WEBP images are allowed",
        )

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile pictures must be 5 MB or smaller",
        )

    try:
        result = upload_image_to_cloudinary(content, folder="dayflow_hrms/avatars")
    except Exception as exc:  # Cloudinary raises plain Exceptions
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image upload failed: {exc}",
        )

    return result["url"]
