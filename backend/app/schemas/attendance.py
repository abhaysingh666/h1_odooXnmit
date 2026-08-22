from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class AttendanceBase(BaseModel):
    employeeId: str = Field(..., serialization_alias="employeeId", validation_alias="employeeId")
    date: str
    checkIn: Optional[str] = Field(None, serialization_alias="checkIn", validation_alias="checkIn")
    checkOut: Optional[str] = Field(None, serialization_alias="checkOut", validation_alias="checkOut")
    status: str
    working_hours: Optional[float] = None
    remarks: Optional[str] = ""

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

class AttendanceCreate(BaseModel):
    employeeId: str
    date: str
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    status: str = "present"
    working_hours: Optional[float] = None
    remarks: Optional[str] = ""

    model_config = ConfigDict(populate_by_name=True)

class AttendanceResponse(AttendanceBase):
    id: str
