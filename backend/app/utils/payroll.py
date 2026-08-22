"""
Salary structure computation.

The rules come straight from the spec: every component is either a percentage of
the monthly wage, a percentage of Basic, a fixed rupee amount, or the balancing
figure that makes the components add up to exactly the wage. Amounts are always
derived here — never trusted from the client — so a structure can't drift out of
sync with the wage it belongs to.

    Wage ₹50,000, Basic 50% of wage      → Basic ₹25,000
    HRA 50% of Basic                     → HRA   ₹12,500
    Fixed Allowance = wage − everything else
"""

from typing import Dict, Iterable, List, Optional

# The default structure a new employee gets. Percentages match the spec's
# worked example; admins can edit any of them per employee.
DEFAULT_COMPONENTS: List[Dict] = [
    {
        "key": "basic",
        "label": "Basic Salary",
        "computation": "percent_of_wage",
        "value": 50.0,
        "description": "Basic salary from company cost, computed on the monthly wage.",
    },
    {
        "key": "hra",
        "label": "House Rent Allowance",
        "computation": "percent_of_basic",
        "value": 50.0,
        "description": "HRA provided to employees, 50% of the basic salary.",
    },
    {
        "key": "standard_allowance",
        "label": "Standard Allowance",
        "computation": "percent_of_basic",
        "value": 16.67,
        "description": "A predetermined allowance provided to employees as part of their salary.",
    },
    {
        "key": "performance_bonus",
        "label": "Performance Bonus",
        "computation": "percent_of_basic",
        "value": 8.33,
        "description": "Variable amount paid during payroll, defined as a percentage of the basic salary.",
    },
    {
        "key": "lta",
        "label": "Leave Travel Allowance",
        "computation": "percent_of_basic",
        "value": 8.33,
        "description": "Paid by the company to cover the employee's travel expenses.",
    },
    {
        "key": "fixed_allowance",
        "label": "Fixed Allowance",
        "computation": "balance",
        "value": 0.0,
        "description": "The balancing portion of the wage, left after every other component.",
    },
]

PERCENT_OF_WAGE = "percent_of_wage"
PERCENT_OF_BASIC = "percent_of_basic"
FIXED = "fixed"
BALANCE = "balance"

BASIC_KEY = "basic"


def _money(value: float) -> float:
    """Two-decimal rupees — avoids float dust accumulating in totals."""
    return round(float(value or 0.0) + 0.0, 2)


def default_components() -> List[Dict]:
    """A fresh copy of the default structure (callers mutate their own list)."""
    return [dict(component) for component in DEFAULT_COMPONENTS]


def compute_components(
    monthly_wage: float, components: Optional[Iterable[Dict]] = None
) -> List[Dict]:
    """
    Resolve each component's rupee amount for a given wage.

    Evaluation order matters: Basic first (other components are percentages of
    it), then everything fixed or percentage-based, then the balance component
    last so it can absorb the remainder.
    """
    wage = max(0.0, float(monthly_wage or 0.0))
    raw = [dict(component) for component in (components or default_components())]

    # --- Basic -------------------------------------------------------------
    basic = 0.0
    for component in raw:
        if component.get("key") != BASIC_KEY:
            continue
        basic = _resolve_amount(component, wage=wage, basic=0.0)
        component["amount"] = _money(basic)

    # --- Everything except the balancing component -------------------------
    for component in raw:
        if component.get("key") == BASIC_KEY:
            continue
        if component.get("computation") == BALANCE:
            continue
        component["amount"] = _money(_resolve_amount(component, wage=wage, basic=basic))

    # --- Balance -----------------------------------------------------------
    allocated = sum(
        component.get("amount", 0.0)
        for component in raw
        if component.get("computation") != BALANCE
    )
    for component in raw:
        if component.get("computation") == BALANCE:
            component["amount"] = _money(max(0.0, wage - allocated))
            # Show it as a percentage of Basic, like the other lines.
            component["value"] = _money((component["amount"] / basic * 100) if basic else 0.0)

    # --- Display percentages ----------------------------------------------
    for component in raw:
        component["percent_of_wage"] = _money(
            (component.get("amount", 0.0) / wage * 100) if wage else 0.0
        )
        component.setdefault("description", None)

    return raw


def _resolve_amount(component: Dict, wage: float, basic: float) -> float:
    computation = component.get("computation") or PERCENT_OF_BASIC
    value = float(component.get("value") or 0.0)

    if computation == PERCENT_OF_WAGE:
        return wage * value / 100.0
    if computation == PERCENT_OF_BASIC:
        return basic * value / 100.0
    if computation == FIXED:
        return value
    return 0.0  # BALANCE is resolved separately


def build_structure(
    monthly_wage: float,
    components: Optional[Iterable[Dict]] = None,
    pf_employee_percent: float = 12.0,
    pf_employer_percent: float = 12.0,
    professional_tax: float = 200.0,
) -> Dict:
    """
    A complete, self-consistent salary structure: components with amounts, PF on
    both sides, deductions, gross and net.
    """
    wage = _money(monthly_wage)
    resolved = compute_components(wage, components)

    basic = next(
        (c["amount"] for c in resolved if c.get("key") == BASIC_KEY),
        0.0,
    )

    pf_employee = _money(basic * float(pf_employee_percent or 0.0) / 100.0)
    pf_employer = _money(basic * float(pf_employer_percent or 0.0) / 100.0)
    prof_tax = _money(professional_tax)

    gross = _money(sum(c["amount"] for c in resolved))
    deductions = _money(pf_employee + prof_tax)

    return {
        "monthly_wage": wage,
        "yearly_wage": _money(wage * 12),
        "components": resolved,
        "basic": _money(basic),
        "pf_employee_percent": _money(pf_employee_percent),
        "pf_employer_percent": _money(pf_employer_percent),
        "pf_employee_amount": pf_employee,
        "pf_employer_amount": pf_employer,
        "professional_tax": prof_tax,
        "gross_monthly": gross,
        "total_deductions": deductions,
        "net_monthly": _money(gross - deductions),
        "cost_to_company": _money(gross + pf_employer),
    }


def build_payslip(
    structure: Dict,
    payable_days: float,
    total_working_days: int,
    unpaid_days: float = 0.0,
    label: Optional[str] = None,
) -> Dict:
    """
    Pro-rate a structure over the days actually payable in a period.

    Attendance is the source of truth: unpaid leave and days with no attendance
    record reduce `payable_days`, which scales every earning line. Professional
    tax is a flat statutory deduction and is not pro-rated.
    """
    ratio = (payable_days / total_working_days) if total_working_days else 0.0
    ratio = max(0.0, min(1.0, ratio))

    lines = [
        {
            "key": component["key"],
            "label": component["label"],
            "full_amount": component["amount"],
            "amount": _money(component["amount"] * ratio),
        }
        for component in structure.get("components", [])
    ]

    gross = _money(sum(line["amount"] for line in lines))
    pf_employee = _money(structure.get("pf_employee_amount", 0.0) * ratio)
    prof_tax = _money(structure.get("professional_tax", 0.0)) if payable_days else 0.0
    deductions = _money(pf_employee + prof_tax)

    return {
        "label": label,
        "payable_days": _money(payable_days),
        "total_working_days": total_working_days,
        "unpaid_days": _money(unpaid_days),
        "payable_ratio": _money(ratio * 100),
        "lines": lines,
        "gross": gross,
        "pf_employee": pf_employee,
        "pf_employer": _money(structure.get("pf_employer_amount", 0.0) * ratio),
        "professional_tax": prof_tax,
        "total_deductions": deductions,
        "net_pay": _money(gross - deductions),
        "currency": structure.get("currency", "INR"),
    }
