from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class AdminCreateEmployee(BaseModel):
    """
    Schema for an admin/HR officer creating a new employee.

    The employer is *not* supplied by the client — company name and logo are
    taken from the authenticated admin's own record, so every employee of a
    company is guaranteed to share the same Login ID prefix.
    """

    name: str = Field(..., min_length=2, max_length=100)
    email_id: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    date_of_joining: Optional[date] = Field(
        default=None,
        description="Year of joining feeds the Login ID. Defaults to today.",
    )
    role: str = Field(default="employee", pattern="^(employee|admin)$")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format"""
        clean_phone = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?[0-9]{10,15}$', clean_phone):
            raise ValueError("Invalid phone number format")
        return clean_phone

    @field_validator("date_of_joining")
    @classmethod
    def validate_date_of_joining(cls, v: Optional[date]) -> Optional[date]:
        """Joining dates may be backdated but not set in the future."""
        if v is not None and v > date.today():
            raise ValueError("Date of joining cannot be in the future")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Infamous Wolverine",
                "email_id": "infamous@odoo.com",
                "phone": "+919876543210",
                "date_of_joining": "2022-06-01",
                "role": "employee",
            }
        }


class EmployeeCreatedResponse(BaseModel):
    """Response after employee is created by admin"""
    login_id: str
    temp_password: str
    registration_link: str
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "login_id": "OIINWO20220001",
                "temp_password": "Temp@123Abc",
                "registration_link": "http://localhost:5173/complete-registration?token=abc123xyz",
                "message": "Employee created successfully. Share these credentials with the employee."
            }
        }


class CompleteRegistration(BaseModel):
    """Schema for employee completing registration with token"""
    token: str
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, values) -> str:
        """Validate passwords match"""
        password = values.data.get('password')
        if password and v != password:
            raise ValueError("Passwords do not match")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "token": "abc123xyz456",
                "password": "MyNewPass@123",
                "confirm_password": "MyNewPass@123"
            }
        }


class UserRegister(BaseModel):
    """Schema for user registration (Sign Up)"""
    company_name: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=100)
    email_id: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)
    company_logo_url: Optional[str] = None  # Will be uploaded separately

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, values) -> str:
        """Validate passwords match"""
        password = values.data.get('password')
        if password and v != password:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format"""
        # Remove spaces and dashes
        clean_phone = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?[0-9]{10,15}$', clean_phone):
            raise ValueError("Invalid phone number format")
        return clean_phone

    class Config:
        json_schema_extra = {
            "example": {
                "company_name": "Acme Corporation",
                "name": "John Doe",
                "email_id": "john@acme.com",
                "phone": "+1234567890",
                "password": "SecurePass123",
                "confirm_password": "SecurePass123",
                "company_logo_url": "https://example.com/logo.png"
            }
        }


class UserLogin(BaseModel):
    """Schema for user login (Sign In)"""
    login_id: str  # Can be login_id or email
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "login_id": "OIINWO20220001",
                "password": "SecurePass123"
            }
        }


class ChangePassword(BaseModel):
    """Schema for changing password"""
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("confirm_new_password")
    @classmethod
    def passwords_match(cls, v: str, values) -> str:
        """Validate passwords match"""
        new_password = values.data.get('new_password')
        if new_password and v != new_password:
            raise ValueError("Passwords do not match")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "old_password": "OldPass123",
                "new_password": "NewSecurePass456",
                "confirm_new_password": "NewSecurePass456"
            }
        }


class UserResponse(BaseModel):
    """Schema for user response (without password)"""
    id: str = Field(..., alias="_id")
    login_id: str
    company_name: str
    company_logo_url: Optional[str] = None
    name: str
    email_id: EmailStr
    phone: str
    role: str
    is_first_login: bool
    is_verified: bool

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "login_id": "OIINWO20220001",
                "company_name": "Acme Corp",
                "company_logo_url": "https://example.com/logo.png",
                "name": "John Doe",
                "email_id": "john@example.com",
                "phone": "+1234567890",
                "role": "employee",
                "is_first_login": True,
                "is_verified": False
            }
        }


class AuthResponse(BaseModel):
    """Schema for authentication response"""
    user: UserResponse
    message: str
    access_token: Optional[str] = None
    token_type: str = "bearer"

    class Config:
        json_schema_extra = {
            "example": {
                "user": {
                    "_id": "507f1f77bcf86cd799439011",
                    "login_id": "OIINWO20220001",
                    "company_name": "Acme Corp",
                    "company_logo_url": "https://example.com/logo.png",
                    "name": "John Doe",
                    "email_id": "john@example.com",
                    "phone": "+1234567890",
                    "role": "employee",
                    "is_first_login": True,
                    "is_verified": False
                },
                "message": "User Registered Successfully"
            }
        }
