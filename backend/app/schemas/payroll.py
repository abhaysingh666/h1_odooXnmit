from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class SalaryStructure(BaseModel):
    basic: float
    hra: float
    allowances: float
    deductions: float
    gross_salary: Optional[float] = 0.0
    net_salary: Optional[float] = 0.0

class PayrollCreate(BaseModel):
    employeeId: str = Field(..., validation_alias="employeeId", serialization_alias="employeeId")
    month: str  # "YYYY-MM"
    salary_structure: SalaryStructure = Field(..., validation_alias="salaryStructure", serialization_alias="salaryStructure")
    payment_status: str = "pending"  # pending | paid

    model_config = ConfigDict(populate_by_name=True)

class PayrollUpdate(BaseModel):
    salary_structure: Optional[SalaryStructure] = Field(None, validation_alias="salaryStructure", serialization_alias="salaryStructure")
    payment_status: Optional[str] = None  # pending | paid

    model_config = ConfigDict(populate_by_name=True)

class PayrollResponse(BaseModel):
    id: str
    employeeId: str = Field(..., serialization_alias="employeeId", validation_alias="employeeId")
    month: str
    salaryStructure: SalaryStructure = Field(..., serialization_alias="salaryStructure", validation_alias="salaryStructure")
    paymentDate: Optional[str] = Field(None, serialization_alias="paymentDate", validation_alias="paymentDate")
    paymentStatus: str = Field(..., serialization_alias="paymentStatus", validation_alias="paymentStatus")
    created_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
