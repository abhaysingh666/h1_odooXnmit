"""Attendance, leave and payroll documents as stored in MongoDB."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .user import PyObjectId


# --------------------------------------------------------------------------- #
# Attendance
# --------------------------------------------------------------------------- #

class AttendanceStatus:
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    LEAVE = "leave"
    WEEKEND = "weekend"
    HOLIDAY = "holiday"

    ALL = [PRESENT, ABSENT, HALF_DAY, LEAVE, WEEKEND, HOLIDAY]


class AttendanceInDB(BaseModel):
    """
    One document per employee per calendar day. `day` is normalised to midnight
    UTC so a compound unique index on (user_id, day) keeps check-ins idempotent.
    """

    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    user_id: PyObjectId
    company_name: str
    day: datetime

    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None

    # Derived on check-out so reads stay cheap.
    work_minutes: float = 0.0
    extra_minutes: float = 0.0
    break_minutes: float = 0.0

    status: str = AttendanceStatus.PRESENT
    note: Optional[str] = None

    # "self" for employee check-in/out, "admin" when HR records it manually.
    source: str = "self"
    recorded_by: Optional[PyObjectId] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


# --------------------------------------------------------------------------- #
# Leave / time off
# --------------------------------------------------------------------------- #

class LeaveType:
    PAID = "paid"
    SICK = "sick"
    UNPAID = "unpaid"

    ALL = [PAID, SICK, UNPAID]


class LeaveStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

    ALL = [PENDING, APPROVED, REJECTED, CANCELLED]


class LeaveInDB(BaseModel):
    """A single time-off request covering an inclusive date range."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    user_id: PyObjectId
    company_name: str

    # Denormalised so the approvals table needs one query, not N+1.
    employee_name: str
    employee_login_id: str
    employee_avatar_url: Optional[str] = None

    leave_type: str = LeaveType.PAID
    start_date: datetime
    end_date: datetime
    days: float = 1.0  # Working days consumed, excluding weekends
    half_day: bool = False
    remarks: Optional[str] = None
    attachment_url: Optional[str] = None  # Sick-leave certificate

    status: str = LeaveStatus.PENDING
    reviewed_by: Optional[PyObjectId] = None
    reviewer_name: Optional[str] = None
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


# --------------------------------------------------------------------------- #
# Payroll
# --------------------------------------------------------------------------- #

class ComputationType:
    """How a salary component's amount is derived."""

    PERCENT_OF_WAGE = "percent_of_wage"
    PERCENT_OF_BASIC = "percent_of_basic"
    FIXED = "fixed"
    BALANCE = "balance"  # Wage minus every other component

    ALL = [PERCENT_OF_WAGE, PERCENT_OF_BASIC, FIXED, BALANCE]


class SalaryComponent(BaseModel):
    """
    A line in the salary structure. `amount` is always recomputed server-side
    from `computation` + `value`, so a stale client can never write a total that
    disagrees with the wage.
    """

    key: str
    label: str
    computation: str = ComputationType.PERCENT_OF_BASIC
    value: float = 0.0  # Percentage, or rupee amount when computation is FIXED
    amount: float = 0.0  # Derived
    percent_of_wage: float = 0.0  # Derived, for display
    description: Optional[str] = None


class PayrollInDB(BaseModel):
    """
    One salary structure per employee. Visible to the employee read-only;
    only admins/HR may write it.
    """

    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    user_id: PyObjectId
    company_name: str

    wage_type: str = "fixed"  # Only fixed wage is in scope
    monthly_wage: float = 0.0
    yearly_wage: float = 0.0

    working_days_per_week: int = 5
    hours_per_day: float = 8.0
    break_minutes: int = 60

    components: List[SalaryComponent] = Field(default_factory=list)

    # Provident fund is a percentage of basic on both sides.
    pf_employee_percent: float = 12.0
    pf_employer_percent: float = 12.0
    professional_tax: float = 200.0

    currency: str = "INR"

    updated_by: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
