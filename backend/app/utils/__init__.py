from .dependencies import get_current_user, get_current_admin, get_current_employee
from .generators import (
    build_company_prefix,
    build_name_code,
    company_counter_key,
    generate_login_id,
    generate_random_password,
    get_next_serial_number,
)
from .dates import (
    DEFAULT_WEEK_DAYS,
    count_working_days,
    date_range,
    is_working_day,
    minutes_between,
    month_bounds,
    month_label,
    overlaps,
    resolve_period,
    split_hours,
    to_day,
    today,
    unique_days,
    working_days,
)
from .payroll import (
    DEFAULT_COMPONENTS,
    build_payslip,
    build_structure,
    compute_components,
    default_components,
)
from .presenters import (
    attendance_record,
    employee_card,
    employee_detail,
    leave_record,
    status_for_day,
)

__all__ = [
    # Auth dependencies
    "get_current_user",
    "get_current_admin",
    "get_current_employee",
    # Login ID / password generation
    "build_company_prefix",
    "build_name_code",
    "company_counter_key",
    "generate_login_id",
    "generate_random_password",
    "get_next_serial_number",
    # Calendar helpers
    "DEFAULT_WEEK_DAYS",
    "count_working_days",
    "date_range",
    "is_working_day",
    "minutes_between",
    "month_bounds",
    "month_label",
    "overlaps",
    "resolve_period",
    "split_hours",
    "to_day",
    "today",
    "unique_days",
    "working_days",
    # Salary engine
    "DEFAULT_COMPONENTS",
    "build_payslip",
    "build_structure",
    "compute_components",
    "default_components",
    # Document -> payload shaping
    "attendance_record",
    "employee_card",
    "employee_detail",
    "leave_record",
    "status_for_day",
]
