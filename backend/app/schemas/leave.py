from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class LeaveCreate(BaseModel):
    employeeId: str
    leave_type: str = Field(..., validation_alias="type", serialization_alias="type")
    startDate: str = Field(..., validation_alias="startDate", serialization_alias="startDate")
    endDate: str = Field(..., validation_alias="endDate", serialization_alias="endDate")
    reason: Optional[str] = ""

    model_config = ConfigDict(populate_by_name=True)

class LeaveAction(BaseModel):
    admin_comments: Optional[str] = ""

class LeaveResponse(BaseModel):
    id: str
    employeeId: str = Field(..., serialization_alias="employeeId", validation_alias="employeeId")
    type: str = Field(..., serialization_alias="type", validation_alias="type")
    startDate: str = Field(..., serialization_alias="startDate", validation_alias="startDate")
    endDate: str = Field(..., serialization_alias="endDate", validation_alias="endDate")
    totalDays: int = Field(..., serialization_alias="totalDays", validation_alias="totalDays")
    reason: Optional[str] = ""
    status: str
    approvedBy: Optional[str] = Field(None, serialization_alias="approvedBy", validation_alias="approvedBy")
    adminComments: Optional[str] = Field(None, serialization_alias="adminComments", validation_alias="adminComments")
    appliedOn: str = Field(..., serialization_alias="appliedOn", validation_alias="appliedOn")

    model_config = ConfigDict(populate_by_name=True)
