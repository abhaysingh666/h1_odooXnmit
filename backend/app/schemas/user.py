from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    employee_id: Optional[str] = ""
    email: EmailStr
    role: str = "employee"

class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(UserBase):
    id: str
    is_verified: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
