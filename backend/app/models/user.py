from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema):
        schema.update(type="string")
        return schema


class UserInDB(BaseModel):
    """User model as stored in MongoDB"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    login_id: str  # Auto-generated format: CIYYYYQQQSSSSS
    company_name: str
    company_logo_url: Optional[str] = None
    name: str
    email_id: EmailStr
    phone: str
    password: str  # hashed (auto-generated on first signup)
    is_first_login: bool = True  # True until user changes password
    role: str = "employee"  # default role
    is_verified: bool = False
    registration_token: Optional[str] = None  # Token for first-time registration
    token_expires_at: Optional[datetime] = None  # Token expiry
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "login_id": "CI20240020001",
                "company_name": "Acme Corp",
                "company_logo_url": "https://res.cloudinary.com/xyz/logo.png",
                "name": "John Doe",
                "email_id": "john@example.com",
                "phone": "+1234567890",
                "password": "hashed_password",
                "is_first_login": True,
                "role": "employee",
                "is_verified": False,
                "registration_token": "abc123xyz",
                "token_expires_at": "2024-08-25T10:30:00Z"
            }
        }
