"""Request/response schemas for attendance tracking."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class CheckInRequest(BaseModel):
    note: Optional[str] = Field(default=None, max_length=200)


class CheckOutRequest(BaseModel):
    note: Optional[str] = Field(default=None, max_length=200)
    break_minutes: Optional[float] = Field(default=None, ge=0, le=480)


class ManualAttendance(BaseModel):
    """Admin/HR recording or correcting a day for an employee."""

    employee_id: str
    day: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str = Field(default="present", pattern="^(present|absent|half_day|leave|holiday)$")
    note: Optional[str] = Field(default=None, max_length=200)
    break_minutes: Optional[float] = Field(default=None, ge=0, le=480)

    @field_validator("check_out")
    @classmethod
    def validate_window(cls, v: Optional[datetime], values) -> Optional[datetime]:
        check_in = values.data.get("check_in")
        if v and check_in and v <= check_in:
            raise ValueError("Check-out must be after check-in")
        return v


class AttendanceRecord(BaseModel):
    """One row of the attendance table."""

    id: Optional[str] = Field(default=None, alias="_id")
    employee_id: str
    employee_name: Optional[str] = None
    employee_login_id: Optional[str] = None
    employee_avatar_url: Optional[str] = None

    day: datetime
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None

    work_minutes: float = 0.0
    extra_minutes: float = 0.0
    break_minutes: float = 0.0

    # HH:MM strings so every client renders the same thing.
    work_hours: str = "00:00"
    extra_hours: str = "00:00"

    status: str = "absent"
    is_working_day: bool = True
    note: Optional[str] = None
    source: str = "self"

    class Config:
        populate_by_name = True


class AttendanceSummary(BaseModel):
    """The counters above the attendance table."""

    period: str
    year: int
    month: int
    total_working_days: int = 0
    days_present: int = 0
    days_absent: int = 0
    half_days: int = 0
    leave_days: float = 0.0
    unpaid_leave_days: float = 0.0
    payable_days: float = 0.0
    total_work_hours: str = "00:00"
    total_extra_hours: str = "00:00"
    average_work_hours: str = "00:00"


class MyAttendanceResponse(BaseModel):
    summary: AttendanceSummary
    records: List[AttendanceRecord] = Field(default_factory=list)


class TodayStatus(BaseModel):
    """Powers the check-in / check-out systray widget."""

    day: datetime
    status: str = "absent"
    checked_in: bool = False
    checked_out: bool = False
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    work_minutes: float = 0.0
    work_hours: str = "00:00"
    extra_hours: str = "00:00"
    is_working_day: bool = True
    on_leave: bool = False
    leave_type: Optional[str] = None
    can_check_in: bool = True
    can_check_out: bool = False


class DayAttendanceResponse(BaseModel):
    """Admin view: every employee's record for one calendar day."""

    day: datetime
    is_working_day: bool = True
    total_employees: int = 0
    present: int = 0
    absent: int = 0
    on_leave: int = 0
    records: List[AttendanceRecord] = Field(default_factory=list)
