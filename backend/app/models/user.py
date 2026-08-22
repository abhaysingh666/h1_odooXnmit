from datetime import datetime
from typing import Annotated, Any, List, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
from pydantic_core import core_schema


class _ObjectIdAnnotation:
    """
    Pydantic v2 support for BSON ObjectId.

    Values stay as `ObjectId` in Python (so they can be passed straight back
    into Motor queries) and serialise to `str` in JSON responses.
    """

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: Any):
        def validate(value: Any) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str) and ObjectId.is_valid(value):
                return ObjectId(value)
            raise ValueError("Invalid ObjectId")

        return core_schema.no_info_plain_validator_function(
            validate,
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, schema: Any, handler: Any):
        return {"type": "string"}


PyObjectId = Annotated[ObjectId, _ObjectIdAnnotation]


class JobInfo(BaseModel):
    """Employment details — editable by admins/HR only."""

    department: Optional[str] = None
    job_title: Optional[str] = None
    job_position: Optional[str] = None
    manager: Optional[str] = None
    work_location: Optional[str] = None
    employment_type: Optional[str] = None  # full_time | part_time | intern | contract


class PrivateInfo(BaseModel):
    """
    The "Private Info" tab. Employees may edit their own contact details; the
    bank/statutory block is admin-editable because payroll depends on it.
    """

    date_of_birth: Optional[datetime] = None
    residing_address: Optional[str] = None
    nationality: Optional[str] = None
    personal_email: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Bank / statutory details (drive payroll)
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_no: Optional[str] = None
    uan_no: Optional[str] = None
    esic_no: Optional[str] = None


class ResumeInfo(BaseModel):
    """The "Resume" tab — free-form, employee-editable."""

    about: Optional[str] = None
    love_about_job: Optional[str] = None
    interests: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)


class WorkSchedule(BaseModel):
    """
    Drives attendance expectations and the payable-day count used by payroll.
    `week_days` is 0=Monday … 6=Sunday, matching Python's `weekday()`.
    """

    hours_per_day: float = 8.0
    days_per_week: int = 5
    week_days: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4])
    break_minutes: int = 60


class LeaveAllocation(BaseModel):
    """Per-year entitlement. Unpaid leave is uncapped by design."""

    paid: int = 24
    sick: int = 5


class UserInDB(BaseModel):
    """User model as stored in MongoDB"""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    # Auto-generated, 14 characters: CCNNNNYYYYSSSS
    #   CC   company code (initial of each of the first two words)
    #   NNNN employee code (2 letters of first name + 2 of last name)
    #   YYYY year of joining
    #   SSSS joining serial for that company in that year
    login_id: str

    company_name: str
    company_logo_url: Optional[str] = None
    name: str
    email_id: EmailStr
    phone: str
    date_of_joining: Optional[datetime] = None  # Drives the YYYY in login_id
    password: str  # hashed (auto-generated when HR creates the account)
    is_first_login: bool = True  # True until the user changes their password
    role: str = "employee"  # default role
    is_verified: bool = False
    registration_token: Optional[str] = None  # Token for first-time registration
    token_expires_at: Optional[datetime] = None  # Token expiry

    # ---- HRMS profile ----------------------------------------------------
    avatar_url: Optional[str] = None
    is_active: bool = True  # Soft-deactivated employees keep their history
    job: JobInfo = Field(default_factory=JobInfo)
    private: PrivateInfo = Field(default_factory=PrivateInfo)
    resume: ResumeInfo = Field(default_factory=ResumeInfo)
    schedule: WorkSchedule = Field(default_factory=WorkSchedule)
    leave_allocation: LeaveAllocation = Field(default_factory=LeaveAllocation)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "login_id": "OIINWO20220001",
                "company_name": "Odoo India",
                "company_logo_url": "https://res.cloudinary.com/xyz/logo.png",
                "name": "Infamous Wolverine",
                "email_id": "infamous@odoo.com",
                "phone": "+919876543210",
                "date_of_joining": "2022-06-01T00:00:00Z",
                "password": "hashed_password",
                "is_first_login": True,
                "role": "employee",
                "is_verified": False,
                "registration_token": "abc123xyz",
                "token_expires_at": "2026-08-29T10:30:00Z",
            }
        }
