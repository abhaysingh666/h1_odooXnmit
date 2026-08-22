"""Request/response schemas for leave / time-off management."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class LeaveCreate(BaseModel):
    leave_type: str = Field(default="paid", pattern="^(paid|sick|unpaid)$")
    start_date: date
    end_date: date
    half_day: bool = False
    remarks: Optional[str] = Field(default=None, max_length=500)
    attachment_url: Optional[str] = None

    # Admins may file leave on someone else's behalf.
    employee_id: Optional[str] = None

    @field_validator("end_date")
    @classmethod
    def validate_range(cls, v: date, values) -> date:
        start = values.data.get("start_date")
        if start and v < start:
            raise ValueError("End date cannot be before the start date")
        if start and (v - start).days > 365:
            raise ValueError("A single request cannot span more than a year")
        return v


class LeaveReview(BaseModel):
    """Approve or reject, optionally with a comment for the employee."""

    action: str = Field(..., pattern="^(approve|reject)$")
    comment: Optional[str] = Field(default=None, max_length=500)


class LeaveRecord(BaseModel):
    id: str = Field(..., alias="_id")
    employee_id: str
    employee_name: str
    employee_login_id: str
    employee_avatar_url: Optional[str] = None

    leave_type: str
    start_date: datetime
    end_date: datetime
    days: float
    half_day: bool = False
    remarks: Optional[str] = None
    attachment_url: Optional[str] = None

    status: str
    reviewer_name: Optional[str] = None
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    # True when the signed-in user may still withdraw this request.
    can_cancel: bool = False

    class Config:
        populate_by_name = True


class LeaveTypeBalance(BaseModel):
    leave_type: str
    label: str
    allocated: Optional[int] = None  # None means uncapped (unpaid leave)
    used: float = 0.0
    pending: float = 0.0
    available: Optional[float] = None


class LeaveBalanceResponse(BaseModel):
    year: int
    balances: List[LeaveTypeBalance] = Field(default_factory=list)
    pending_requests: int = 0
    approved_requests: int = 0
    rejected_requests: int = 0


class LeaveListResponse(BaseModel):
    total: int = 0
    pending: int = 0
    approved: int = 0
    rejected: int = 0
    requests: List[LeaveRecord] = Field(default_factory=list)


class LeaveCalendarDay(BaseModel):
    """One day in the time-off calendar grid."""

    day: datetime
    leave_type: Optional[str] = None
    status: Optional[str] = None
    is_working_day: bool = True


class LeaveCalendarResponse(BaseModel):
    year: int
    days: List[LeaveCalendarDay] = Field(default_factory=list)


class LeaveAllocationRow(BaseModel):
    """One employee's yearly allocation and how much of it is spoken for."""

    employee_id: str
    employee_name: str
    employee_login_id: str
    employee_avatar_url: Optional[str] = None
    department: Optional[str] = None

    paid_allocated: int = 24
    paid_used: float = 0.0
    paid_pending: float = 0.0
    paid_available: float = 24.0

    sick_allocated: int = 5
    sick_used: float = 0.0
    sick_pending: float = 0.0
    sick_available: float = 5.0

    unpaid_used: float = 0.0


class LeaveAllocationResponse(BaseModel):
    """
    The Allocation tab. Computed for the whole company in two queries so HR does
    not have to fetch a balance per employee.
    """

    year: int
    total_employees: int = 0
    rows: List[LeaveAllocationRow] = Field(default_factory=list)
