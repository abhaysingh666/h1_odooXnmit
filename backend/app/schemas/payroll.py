"""Request/response schemas for payroll and payslips."""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class SalaryComponentInput(BaseModel):
    key: str = Field(..., min_length=1, max_length=40, pattern="^[a-z0-9_]+$")
    label: str = Field(..., min_length=1, max_length=60)
    computation: str = Field(
        default="percent_of_basic",
        pattern="^(percent_of_wage|percent_of_basic|fixed|balance)$",
    )
    value: float = Field(default=0.0, ge=0)
    description: Optional[str] = Field(default=None, max_length=300)


class PayrollUpdate(BaseModel):
    """
    Admin-only write. Amounts are never accepted from the client — they are
    recomputed from `monthly_wage` plus each component's computation rule.
    """

    monthly_wage: float = Field(..., ge=0, le=100_000_000)
    working_days_per_week: Optional[int] = Field(default=None, ge=1, le=7)
    hours_per_day: Optional[float] = Field(default=None, ge=1, le=24)
    break_minutes: Optional[int] = Field(default=None, ge=0, le=480)
    components: Optional[List[SalaryComponentInput]] = Field(default=None, max_length=25)
    pf_employee_percent: Optional[float] = Field(default=None, ge=0, le=100)
    pf_employer_percent: Optional[float] = Field(default=None, ge=0, le=100)
    professional_tax: Optional[float] = Field(default=None, ge=0, le=100_000)

    @field_validator("components")
    @classmethod
    def validate_components(
        cls, v: Optional[List[SalaryComponentInput]]
    ) -> Optional[List[SalaryComponentInput]]:
        if v is None:
            return None
        if not v:
            raise ValueError("At least one salary component is required")

        keys = [component.key for component in v]
        if len(keys) != len(set(keys)):
            raise ValueError("Salary component keys must be unique")
        if "basic" not in keys:
            raise ValueError("A component with key 'basic' is required")
        if sum(1 for c in v if c.computation == "balance") > 1:
            raise ValueError("Only one component can be the balancing figure")

        # Percentages above 100 are almost always a typo, and a wage-percentage
        # over 100 would make the balance component negative.
        for component in v:
            if component.computation in ("percent_of_wage", "percent_of_basic") and component.value > 100:
                raise ValueError(f"{component.label}: percentage cannot exceed 100")
        return v


class SalaryComponentOut(BaseModel):
    key: str
    label: str
    computation: str
    value: float
    amount: float
    percent_of_wage: float = 0.0
    description: Optional[str] = None


class PayrollResponse(BaseModel):
    employee_id: str
    employee_name: str
    employee_login_id: str
    currency: str = "INR"

    wage_type: str = "fixed"
    monthly_wage: float = 0.0
    yearly_wage: float = 0.0
    working_days_per_week: int = 5
    hours_per_day: float = 8.0
    break_minutes: int = 60

    components: List[SalaryComponentOut] = Field(default_factory=list)
    basic: float = 0.0

    pf_employee_percent: float = 12.0
    pf_employer_percent: float = 12.0
    pf_employee_amount: float = 0.0
    pf_employer_amount: float = 0.0
    professional_tax: float = 200.0

    gross_monthly: float = 0.0
    total_deductions: float = 0.0
    net_monthly: float = 0.0
    cost_to_company: float = 0.0

    is_configured: bool = False
    can_edit: bool = False


class PayslipLine(BaseModel):
    key: str
    label: str
    full_amount: float
    amount: float


class PayslipResponse(BaseModel):
    employee_id: str
    employee_name: str
    employee_login_id: str
    label: str
    year: int
    month: int

    payable_days: float = 0.0
    total_working_days: int = 0
    unpaid_days: float = 0.0
    payable_ratio: float = 0.0

    lines: List[PayslipLine] = Field(default_factory=list)
    gross: float = 0.0
    pf_employee: float = 0.0
    pf_employer: float = 0.0
    professional_tax: float = 0.0
    total_deductions: float = 0.0
    net_pay: float = 0.0
    currency: str = "INR"


class PayrollSummaryRow(BaseModel):
    """One line of the admin payroll register."""

    employee_id: str
    employee_name: str
    employee_login_id: str
    department: Optional[str] = None
    job_title: Optional[str] = None
    avatar_url: Optional[str] = None
    monthly_wage: float = 0.0
    gross_monthly: float = 0.0
    net_monthly: float = 0.0
    is_configured: bool = False


class PayrollRegisterResponse(BaseModel):
    total_employees: int = 0
    configured: int = 0
    monthly_gross_total: float = 0.0
    monthly_net_total: float = 0.0
    average_wage: float = 0.0
    rows: List[PayrollSummaryRow] = Field(default_factory=list)
