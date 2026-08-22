"""Request/response schemas for the employee directory and profile tabs."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


# --------------------------------------------------------------------------- #
# Profile blocks
# --------------------------------------------------------------------------- #

class JobInfoSchema(BaseModel):
    department: Optional[str] = Field(default=None, max_length=80)
    job_title: Optional[str] = Field(default=None, max_length=80)
    job_position: Optional[str] = Field(default=None, max_length=80)
    manager: Optional[str] = Field(default=None, max_length=100)
    work_location: Optional[str] = Field(default=None, max_length=100)
    employment_type: Optional[str] = Field(
        default=None, pattern="^(full_time|part_time|intern|contract)$"
    )


class PrivateInfoSchema(BaseModel):
    date_of_birth: Optional[date] = None
    residing_address: Optional[str] = Field(default=None, max_length=300)
    nationality: Optional[str] = Field(default=None, max_length=60)
    personal_email: Optional[EmailStr] = None
    gender: Optional[str] = Field(default=None, pattern="^(male|female|other|undisclosed)$")
    marital_status: Optional[str] = Field(
        default=None, pattern="^(single|married|divorced|widowed|undisclosed)$"
    )
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)

    bank_name: Optional[str] = Field(default=None, max_length=100)
    account_number: Optional[str] = Field(default=None, max_length=30)
    ifsc_code: Optional[str] = Field(default=None, max_length=20)
    pan_no: Optional[str] = Field(default=None, max_length=20)
    uan_no: Optional[str] = Field(default=None, max_length=20)
    esic_no: Optional[str] = Field(default=None, max_length=20)

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v and v >= date.today():
            raise ValueError("Date of birth must be in the past")
        return v


class ResumeInfoSchema(BaseModel):
    about: Optional[str] = Field(default=None, max_length=2000)
    love_about_job: Optional[str] = Field(default=None, max_length=2000)
    interests: Optional[str] = Field(default=None, max_length=2000)
    skills: Optional[List[str]] = Field(default=None, max_length=40)
    certifications: Optional[List[str]] = Field(default=None, max_length=40)

    @field_validator("skills", "certifications")
    @classmethod
    def clean_list(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        cleaned = [item.strip() for item in v if item and item.strip()]
        # De-duplicate while preserving the order the user typed them in.
        seen, unique = set(), []
        for item in cleaned:
            if item.lower() not in seen:
                seen.add(item.lower())
                unique.append(item[:60])
        return unique


class WorkScheduleSchema(BaseModel):
    hours_per_day: Optional[float] = Field(default=None, ge=1, le=24)
    days_per_week: Optional[int] = Field(default=None, ge=1, le=7)
    week_days: Optional[List[int]] = None
    break_minutes: Optional[int] = Field(default=None, ge=0, le=480)

    @field_validator("week_days")
    @classmethod
    def validate_week_days(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is None:
            return None
        if not v:
            raise ValueError("At least one working day is required")
        if any(day < 0 or day > 6 for day in v):
            raise ValueError("Week days must be between 0 (Monday) and 6 (Sunday)")
        return sorted(set(v))


class LeaveAllocationSchema(BaseModel):
    paid: Optional[int] = Field(default=None, ge=0, le=365)
    sick: Optional[int] = Field(default=None, ge=0, le=365)


# --------------------------------------------------------------------------- #
# Updates
# --------------------------------------------------------------------------- #

class EmployeeSelfUpdate(BaseModel):
    """
    What an employee may change on their own record.

    Deliberately narrow: name, role, company and the statutory/bank block stay
    admin-only because payroll and the Login ID depend on them.
    """

    phone: Optional[str] = Field(default=None, min_length=10, max_length=15)
    private: Optional[PrivateInfoSchema] = None
    resume: Optional[ResumeInfoSchema] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?[0-9]{10,15}$", clean):
            raise ValueError("Invalid phone number format")
        return clean


class EmployeeAdminUpdate(EmployeeSelfUpdate):
    """Everything an admin/HR officer may change on any employee."""

    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email_id: Optional[EmailStr] = None
    date_of_joining: Optional[date] = None
    role: Optional[str] = Field(default=None, pattern="^(employee|admin)$")
    is_active: Optional[bool] = None
    job: Optional[JobInfoSchema] = None
    schedule: Optional[WorkScheduleSchema] = None
    leave_allocation: Optional[LeaveAllocationSchema] = None

    @field_validator("date_of_joining")
    @classmethod
    def validate_doj(cls, v: Optional[date]) -> Optional[date]:
        if v and v > date.today():
            raise ValueError("Date of joining cannot be in the future")
        return v


# --------------------------------------------------------------------------- #
# Responses
# --------------------------------------------------------------------------- #

class EmployeeCard(BaseModel):
    """Directory grid card — the minimum the tile needs, plus today's status."""

    id: str = Field(..., alias="_id")
    login_id: str
    name: str
    email_id: EmailStr
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    date_of_joining: Optional[datetime] = None

    # present | checked_out | leave | absent — drives the status dot/icon.
    today_status: str = "absent"
    checked_in_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None
    leave_type: Optional[str] = None

    class Config:
        populate_by_name = True


class EmployeeDetail(BaseModel):
    """
    Full profile. `private` and `salary_visible` are gated by the caller's role —
    an employee reading someone else's profile gets the public blocks only.
    """

    id: str = Field(..., alias="_id")
    login_id: str
    company_name: str
    company_logo_url: Optional[str] = None
    name: str
    email_id: EmailStr
    phone: str
    role: str
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    is_first_login: bool = False
    date_of_joining: Optional[datetime] = None
    created_at: Optional[datetime] = None

    job: dict = Field(default_factory=dict)
    resume: dict = Field(default_factory=dict)
    schedule: dict = Field(default_factory=dict)
    leave_allocation: dict = Field(default_factory=dict)

    private: Optional[dict] = None  # Omitted unless self or admin

    # Capability flags so the client doesn't re-implement the rules.
    can_edit: bool = False
    can_edit_all: bool = False
    can_view_salary: bool = False

    today_status: str = "absent"

    class Config:
        populate_by_name = True


class DirectoryStats(BaseModel):
    """Headline numbers for the directory and admin dashboard."""

    total: int = 0
    active: int = 0
    admins: int = 0
    present_today: int = 0
    on_leave_today: int = 0
    absent_today: int = 0
    pending_leave_requests: int = 0
    new_this_month: int = 0
    awaiting_activation: int = 0


class MessageResponse(BaseModel):
    message: str
