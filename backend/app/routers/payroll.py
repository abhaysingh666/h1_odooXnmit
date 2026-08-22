"""
Payroll and payslips.

Employees get a read-only view of their own salary structure and payslips.
Admins/HR define the structure: they set the monthly wage and each component's
computation rule, and the server derives every rupee figure — the total of the
components always equals the wage, with Fixed Allowance absorbing the remainder.

Payslips are computed from attendance: payable days come from the month's
attendance summary, so absences and unpaid leave reduce net pay automatically.
"""

from datetime import datetime
from typing import Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..core import get_database
from ..models import UserInDB
from ..schemas.payroll import (
    PayrollRegisterResponse,
    PayrollResponse,
    PayrollSummaryRow,
    PayrollUpdate,
    PayslipResponse,
    SalaryComponentInput,
)
from ..utils import get_current_admin, get_current_user
from ..utils.dates import month_label, resolve_period
from ..utils.payroll import build_payslip, build_structure, default_components
from .attendance import monthly_attendance

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])


def _object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid employee id"
        )
    return ObjectId(value)


async def _load_payroll(db, user: Dict) -> tuple[Dict, bool]:
    """
    The employee's stored payroll settings, or a zero-wage placeholder.

    Returns `(doc, is_configured)`. An unconfigured employee still gets the
    default component template so the editor opens pre-filled.
    """
    doc = await db.payroll.find_one({"user_id": user["_id"]})
    if doc:
        return doc, True

    schedule = user.get("schedule") or {}
    return (
        {
            "user_id": user["_id"],
            "company_name": user.get("company_name"),
            "wage_type": "fixed",
            "monthly_wage": 0.0,
            "working_days_per_week": int(schedule.get("days_per_week", 5) or 5),
            "hours_per_day": float(schedule.get("hours_per_day", 8.0) or 8.0),
            "break_minutes": int(schedule.get("break_minutes", 60) or 0),
            "components": default_components(),
            "pf_employee_percent": 12.0,
            "pf_employer_percent": 12.0,
            "professional_tax": 200.0,
            "currency": "INR",
        },
        False,
    )


def _to_response(
    user: Dict, doc: Dict, is_configured: bool, can_edit: bool
) -> PayrollResponse:
    structure = build_structure(
        monthly_wage=doc.get("monthly_wage", 0.0),
        components=doc.get("components"),
        pf_employee_percent=doc.get("pf_employee_percent", 12.0),
        pf_employer_percent=doc.get("pf_employer_percent", 12.0),
        professional_tax=doc.get("professional_tax", 200.0),
    )

    return PayrollResponse(
        employee_id=str(user["_id"]),
        employee_name=user.get("name", ""),
        employee_login_id=user.get("login_id", ""),
        currency=doc.get("currency", "INR"),
        wage_type=doc.get("wage_type", "fixed"),
        working_days_per_week=int(doc.get("working_days_per_week", 5) or 5),
        hours_per_day=float(doc.get("hours_per_day", 8.0) or 8.0),
        break_minutes=int(doc.get("break_minutes", 60) or 0),
        is_configured=is_configured,
        can_edit=can_edit,
        **structure,
    )


# --------------------------------------------------------------------------- #
# Employee: read-only
# --------------------------------------------------------------------------- #

@router.get("/me", response_model=PayrollResponse)
async def my_payroll(current_user: UserInDB = Depends(get_current_user)):
    """Your own salary structure. Read-only — only HR can change the numbers."""
    db = get_database()
    user = await db.users.find_one({"_id": current_user.id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    doc, is_configured = await _load_payroll(db, user)
    return _to_response(user, doc, is_configured, can_edit=False)


@router.get("/me/payslip", response_model=PayslipResponse)
async def my_payslip(
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    current_user: UserInDB = Depends(get_current_user),
):
    """Your payslip for a month, pro-rated by that month's attendance."""
    db = get_database()
    user = await db.users.find_one({"_id": current_user.id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return await _payslip_for(db, user, year, month)


@router.get("/defaults", response_model=List[SalaryComponentInput])
async def component_defaults(admin: UserInDB = Depends(get_current_admin)):
    """The default component template, for resetting the structure editor."""
    return [SalaryComponentInput(**component) for component in default_components()]


# --------------------------------------------------------------------------- #
# Admin: register and structure editing
# --------------------------------------------------------------------------- #

@router.get("/register", response_model=PayrollRegisterResponse)
async def payroll_register(
    q: Optional[str] = Query(default=None, description="Search name or Login ID"),
    department: Optional[str] = Query(default=None),
    admin: UserInDB = Depends(get_current_admin),
):
    """Every employee's wage in one table, with company-wide monthly totals."""
    db = get_database()

    query: Dict = {"company_name": admin.company_name, "is_active": {"$ne": False}}
    if department:
        query["job.department"] = department
    if q:
        needle = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [{"name": needle}, {"login_id": needle}]

    users = await db.users.find(query).sort("name", 1).to_list(length=500)
    user_ids = [user["_id"] for user in users]

    payroll_by_user: Dict[str, Dict] = {}
    if user_ids:
        cursor = db.payroll.find({"user_id": {"$in": user_ids}})
        async for doc in cursor:
            payroll_by_user[str(doc["user_id"])] = doc

    rows: List[PayrollSummaryRow] = []
    gross_total = net_total = wage_total = 0.0
    configured = 0

    for user in users:
        doc = payroll_by_user.get(str(user["_id"]))
        is_configured = doc is not None
        if is_configured:
            configured += 1
        else:
            doc, _ = await _load_payroll(db, user)

        structure = build_structure(
            monthly_wage=doc.get("monthly_wage", 0.0),
            components=doc.get("components"),
            pf_employee_percent=doc.get("pf_employee_percent", 12.0),
            pf_employer_percent=doc.get("pf_employer_percent", 12.0),
            professional_tax=doc.get("professional_tax", 200.0),
        )

        gross_total += structure["gross_monthly"]
        net_total += structure["net_monthly"]
        wage_total += structure["monthly_wage"]

        job = user.get("job") or {}
        rows.append(
            PayrollSummaryRow(
                employee_id=str(user["_id"]),
                employee_name=user.get("name", ""),
                employee_login_id=user.get("login_id", ""),
                department=job.get("department"),
                job_title=job.get("job_title"),
                avatar_url=user.get("avatar_url"),
                monthly_wage=structure["monthly_wage"],
                gross_monthly=structure["gross_monthly"],
                net_monthly=structure["net_monthly"],
                is_configured=is_configured,
            )
        )

    return PayrollRegisterResponse(
        total_employees=len(users),
        configured=configured,
        monthly_gross_total=round(gross_total, 2),
        monthly_net_total=round(net_total, 2),
        average_wage=round(wage_total / len(users), 2) if users else 0.0,
        rows=rows,
    )


@router.get("/{employee_id}", response_model=PayrollResponse)
async def get_employee_payroll(
    employee_id: str,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    One employee's structure. Admins may read anyone's; employees only their own
    (the Salary Info tab is hidden from colleagues entirely).
    """
    db = get_database()
    target_id = _object_id(employee_id)

    if current_user.role != "admin" and str(target_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Salary information is only visible to HR and the employee",
        )

    user = await db.users.find_one(
        {"_id": target_id, "company_name": current_user.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    doc, is_configured = await _load_payroll(db, user)
    return _to_response(
        user, doc, is_configured, can_edit=current_user.role == "admin"
    )


@router.put("/{employee_id}", response_model=PayrollResponse)
async def update_employee_payroll(
    employee_id: str,
    payload: PayrollUpdate,
    admin: UserInDB = Depends(get_current_admin),
):
    """
    Set the wage and salary structure.

    Component amounts are recomputed from the wage on every save, so changing the
    wage alone re-derives all of them. If the fixed/percentage lines already add
    up to more than the wage the save is refused rather than silently clipped.
    """
    db = get_database()
    target_id = _object_id(employee_id)

    user = await db.users.find_one(
        {"_id": target_id, "company_name": admin.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    existing = await db.payroll.find_one({"user_id": target_id})
    components = (
        [component.model_dump() for component in payload.components]
        if payload.components is not None
        else (existing or {}).get("components") or default_components()
    )

    structure = build_structure(
        monthly_wage=payload.monthly_wage,
        components=components,
        pf_employee_percent=(
            payload.pf_employee_percent
            if payload.pf_employee_percent is not None
            else (existing or {}).get("pf_employee_percent", 12.0)
        ),
        pf_employer_percent=(
            payload.pf_employer_percent
            if payload.pf_employer_percent is not None
            else (existing or {}).get("pf_employer_percent", 12.0)
        ),
        professional_tax=(
            payload.professional_tax
            if payload.professional_tax is not None
            else (existing or {}).get("professional_tax", 200.0)
        ),
    )

    # The spec is explicit: components must never total more than the wage.
    non_balance = sum(
        component["amount"]
        for component in structure["components"]
        if component.get("computation") != "balance"
    )
    if non_balance > structure["monthly_wage"] + 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Components total ₹{non_balance:,.2f}, which exceeds the wage of "
                f"₹{structure['monthly_wage']:,.2f}. Reduce a component or raise the wage."
            ),
        )

    now = datetime.utcnow()
    doc = {
        "user_id": target_id,
        "company_name": admin.company_name,
        "wage_type": "fixed",
        "monthly_wage": structure["monthly_wage"],
        "yearly_wage": structure["yearly_wage"],
        "working_days_per_week": (
            payload.working_days_per_week
            if payload.working_days_per_week is not None
            else (existing or {}).get("working_days_per_week", 5)
        ),
        "hours_per_day": (
            payload.hours_per_day
            if payload.hours_per_day is not None
            else (existing or {}).get("hours_per_day", 8.0)
        ),
        "break_minutes": (
            payload.break_minutes
            if payload.break_minutes is not None
            else (existing or {}).get("break_minutes", 60)
        ),
        # Amounts are stored alongside the rules so historical payslips stay
        # reproducible without re-deriving them.
        "components": structure["components"],
        "pf_employee_percent": structure["pf_employee_percent"],
        "pf_employer_percent": structure["pf_employer_percent"],
        "professional_tax": structure["professional_tax"],
        "currency": (existing or {}).get("currency", "INR"),
        "updated_by": admin.id,
        "updated_at": now,
    }

    await db.payroll.update_one(
        {"user_id": target_id},
        {"$set": doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    # Keep the working-time fields on the profile in step with payroll.
    await db.users.update_one(
        {"_id": target_id},
        {
            "$set": {
                "schedule.days_per_week": doc["working_days_per_week"],
                "schedule.hours_per_day": doc["hours_per_day"],
                "schedule.break_minutes": doc["break_minutes"],
                "updated_at": now,
            }
        },
    )

    fresh = await db.payroll.find_one({"user_id": target_id})
    return _to_response(user, fresh, True, can_edit=True)


@router.get("/{employee_id}/payslip", response_model=PayslipResponse)
async def employee_payslip(
    employee_id: str,
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    current_user: UserInDB = Depends(get_current_user),
):
    """A month's payslip for one employee. Admins, or the employee themselves."""
    db = get_database()
    target_id = _object_id(employee_id)

    if current_user.role != "admin" and str(target_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payslips are only visible to HR and the employee",
        )

    user = await db.users.find_one(
        {"_id": target_id, "company_name": current_user.company_name}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    return await _payslip_for(db, user, year, month)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

async def _payslip_for(
    db, user: Dict, year: Optional[int], month: Optional[int]
) -> PayslipResponse:
    """Join the salary structure with the month's attendance summary."""
    try:
        resolved_year, resolved_month = resolve_period(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    doc, is_configured = await _load_payroll(db, user)
    if not is_configured:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No salary structure has been set up for this employee yet",
        )

    structure = build_structure(
        monthly_wage=doc.get("monthly_wage", 0.0),
        components=doc.get("components"),
        pf_employee_percent=doc.get("pf_employee_percent", 12.0),
        pf_employer_percent=doc.get("pf_employer_percent", 12.0),
        professional_tax=doc.get("professional_tax", 200.0),
    )
    structure["currency"] = doc.get("currency", "INR")

    attendance = await monthly_attendance(db, user, resolved_year, resolved_month)
    summary = attendance.summary

    payslip = build_payslip(
        structure,
        payable_days=summary.payable_days,
        total_working_days=summary.total_working_days,
        unpaid_days=summary.unpaid_leave_days,
        label=month_label(resolved_year, resolved_month),
    )

    return PayslipResponse(
        employee_id=str(user["_id"]),
        employee_name=user.get("name", ""),
        employee_login_id=user.get("login_id", ""),
        year=resolved_year,
        month=resolved_month,
        **payslip,
    )
