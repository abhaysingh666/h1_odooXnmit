from pydantic import BaseModel, EmailStr
from typing import Optional, List

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    department: str
    designation: str
    joiningDate: str
    location: Optional[str] = ""
    manager: Optional[str] = ""
    employmentStatus: str = "Active"

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    avatar: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joiningDate: Optional[str] = None
    location: Optional[str] = None
    manager: Optional[str] = None
    employmentStatus: Optional[str] = None
    status: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: str  # This maps to employee_id
    user_id: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    dob: Optional[str] = ""
    address: Optional[str] = ""
    avatar: Optional[str] = None
    designation: str
    department: str
    joiningDate: str
    location: Optional[str] = ""
    manager: Optional[str] = ""
    employmentStatus: str
    status: str = "absent"
