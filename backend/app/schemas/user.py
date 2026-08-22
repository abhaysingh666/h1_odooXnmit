from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    employee_id: str
    email: EmailStr
    role: str = "employee"

class UserCreate(BaseModel):
    employee_id: str
    email: EmailStr
    password: str
    role: str = "employee"

class UserLogin(BaseModel):
    loginId: str  # Can be employee_id or email
    password: str

class UserResponse(BaseModel):
    id: str
    employee_id: str
    email: EmailStr
    role: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
