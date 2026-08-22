"""
Calendar helpers shared by attendance, leave and payroll.

Everything is stored as naive UTC datetimes; a "day" is that date at midnight so
records line up regardless of the client's timezone.
"""

from calendar import monthrange
from datetime import date, datetime, timedelta
from typing import Iterable, List, Optional, Sequence

DEFAULT_WEEK_DAYS = [0, 1, 2, 3, 4]  # Monday–Friday (Python weekday numbering)


def to_day(value: date | datetime) -> datetime:
    """Normalise any date/datetime to midnight of that calendar day."""
    if isinstance(value, datetime):
        return datetime(value.year, value.month, value.day)
    return datetime(value.year, value.month, value.day)


def today() -> datetime:
    return to_day(datetime.utcnow())


def month_bounds(year: int, month: int) -> tuple[datetime, datetime]:
    """Inclusive first day and last day of a month, at midnight."""
    last = monthrange(year, month)[1]
    return datetime(year, month, 1), datetime(year, month, last)


def date_range(start: date | datetime, end: date | datetime) -> List[datetime]:
    """Every day from `start` to `end` inclusive."""
    current, final = to_day(start), to_day(end)
    days: List[datetime] = []
    while current <= final:
        days.append(current)
        current += timedelta(days=1)
    return days


def is_working_day(day: datetime, week_days: Optional[Sequence[int]] = None) -> bool:
    return day.weekday() in (week_days if week_days is not None else DEFAULT_WEEK_DAYS)


def working_days(
    start: date | datetime,
    end: date | datetime,
    week_days: Optional[Sequence[int]] = None,
) -> List[datetime]:
    """Days in the range that fall on the employee's working week."""
    return [day for day in date_range(start, end) if is_working_day(day, week_days)]


def count_working_days(
    start: date | datetime,
    end: date | datetime,
    week_days: Optional[Sequence[int]] = None,
) -> int:
    return len(working_days(start, end, week_days))


def overlaps(
    a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime
) -> bool:
    """Inclusive overlap test for two date ranges."""
    return to_day(a_start) <= to_day(b_end) and to_day(b_start) <= to_day(a_end)


def minutes_between(start: datetime, end: datetime) -> float:
    return max(0.0, (end - start).total_seconds() / 60.0)


def split_hours(minutes: float) -> str:
    """Render a duration as HH:MM, the format the attendance table uses."""
    total = int(round(minutes))
    return f"{total // 60:02d}:{total % 60:02d}"


def month_label(year: int, month: int) -> str:
    return datetime(year, month, 1).strftime("%B %Y")


def resolve_period(
    year: Optional[int] = None, month: Optional[int] = None
) -> tuple[int, int]:
    """Default an optional year/month pair to the current month."""
    now = datetime.utcnow()
    resolved_year = year or now.year
    resolved_month = month or now.month
    if not 1 <= resolved_month <= 12:
        raise ValueError("Month must be between 1 and 12")
    return resolved_year, resolved_month


def unique_days(days: Iterable[datetime]) -> List[datetime]:
    seen: set[datetime] = set()
    ordered: List[datetime] = []
    for day in days:
        key = to_day(day)
        if key not in seen:
            seen.add(key)
            ordered.append(key)
    return ordered
