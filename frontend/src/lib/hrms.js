import { Plane } from 'lucide-react';

/**
 * Presence vocabulary, shared by the directory grid, the attendance tables and
 * the check-in widget. The visual language comes straight from the spec:
 *
 *   green dot     -> present in office
 *   airplane      -> on approved time off
 *   yellow dot    -> absent without an approved request
 */
export const PRESENCE = {
  present: {
    label: 'Present',
    hint: 'In office',
    tone: 'success',
    dot: 'bg-chart-3',
    badge: 'success',
  },
  checked_out: {
    label: 'Checked out',
    hint: 'Worked today',
    tone: 'success',
    dot: 'bg-chart-3/60',
    badge: 'success',
  },
  half_day: {
    label: 'Half day',
    hint: 'Part of the day worked',
    tone: 'warning',
    dot: 'bg-chart-4',
    badge: 'warning',
  },
  leave: {
    label: 'On leave',
    hint: 'Approved time off',
    tone: 'primary',
    dot: 'bg-primary',
    badge: 'accent',
    icon: Plane,
  },
  absent: {
    label: 'Absent',
    hint: 'No check-in and no approved time off',
    tone: 'warning',
    dot: 'bg-chart-4',
    badge: 'warning',
  },
  weekend: {
    label: 'Non-working day',
    hint: 'Outside the working week',
    tone: 'muted',
    dot: 'bg-muted-foreground/40',
    badge: 'outline',
  },
  holiday: {
    label: 'Holiday',
    hint: 'Company holiday',
    tone: 'muted',
    dot: 'bg-muted-foreground/40',
    badge: 'outline',
  },
};

export function presence(status) {
  return PRESENCE[status] ?? PRESENCE.absent;
}

/**
 * The statuses HR may set by hand — mirrors the `status` pattern on
 * `ManualAttendance` in `backend/app/schemas/attendance.py`.
 */
export const ATTENDANCE_STATUSES = ['present', 'half_day', 'absent', 'leave', 'holiday'].map(
  (value) => ({ value, label: PRESENCE[value].label })
);

export const LEAVE_TYPES = {
  paid: {
    label: 'Paid Time Off',
    short: 'Paid',
    badge: 'success',
    swatch: 'bg-chart-3',
    description: 'Counts against your annual paid allocation.',
  },
  sick: {
    label: 'Sick Time Off',
    short: 'Sick',
    badge: 'accent',
    swatch: 'bg-accent',
    description: 'Attach a medical certificate for anything over two days.',
  },
  unpaid: {
    label: 'Unpaid Leave',
    short: 'Unpaid',
    badge: 'warning',
    swatch: 'bg-chart-4',
    description: 'Uncapped, but reduces payable days on your payslip.',
  },
};

export function leaveType(key) {
  return LEAVE_TYPES[key] ?? { label: key ?? 'Leave', short: key ?? '—', badge: 'outline', swatch: 'bg-muted' };
}

export const LEAVE_STATUS = {
  pending: { label: 'Pending', badge: 'warning' },
  approved: { label: 'Approved', badge: 'success' },
  rejected: { label: 'Rejected', badge: 'destructive' },
  cancelled: { label: 'Withdrawn', badge: 'outline' },
};

export function leaveStatus(key) {
  return LEAVE_STATUS[key] ?? { label: key ?? '—', badge: 'outline' };
}

// ── Parsing ───────────────────────────────────────────────────────────────────

/**
 * The API stores naive UTC datetimes, so Pydantic serialises them without a
 * timezone designator ("2026-08-22T09:30:00"). `new Date()` would read that as
 * local time and shift every timestamp by the UTC offset, so instants get an
 * explicit `Z` before parsing.
 */
export function parseInstant(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const raw = String(value);
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  const d = new Date(hasZone ? raw : `${raw}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * `day`, `start_date`, `date_of_joining` and friends are calendar dates stored
 * at midnight — they must never be timezone-shifted, or a user west of UTC would
 * see every date a day early. Only the YYYY-MM-DD part is used.
 */
export function parseCalendarDay(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// ── Formatting ────────────────────────────────────────────────────────────────

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const rupeesExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹50,000 — or ₹50,000.00 when the paise matter (payslips, components). */
export function money(value, exact = false) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '—';
  return (exact ? rupeesExact : rupees).format(n);
}

/** The API already returns HH:MM strings; this is for raw minute counts. */
export function hoursFromMinutes(minutes) {
  const total = Math.round(Number(minutes ?? 0));
  if (!Number.isFinite(total) || total <= 0) return '00:00';
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "09:42" wall-clock time from an API timestamp. */
export function clockTime(value) {
  const d = parseInstant(value);
  if (!d) return '—';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "Fri 22" — the day column in the attendance table. */
export function shortDay(value) {
  const d = parseCalendarDay(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' });
}

export function dayName(value) {
  const d = parseCalendarDay(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

export function longDate(value) {
  const d = parseCalendarDay(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "22 Aug 2026" — no weekday, for dense tables and detail rows. */
export function plainDate(value) {
  const d = parseCalendarDay(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `YYYY-MM-DD` in local time — what the API's date query params expect. */
export function toISODate(value) {
  const d = value instanceof Date ? value : parseCalendarDay(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function shiftMonth(year, month, delta) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function shiftDate(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * A Monday-first 6×7 grid for the time-off calendar. Leading and trailing cells
 * from the neighbouring months are returned with `outside: true` so the grid
 * always keeps its shape.
 */
export function monthGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  // JS weeks start on Sunday; shift so Monday is column 0.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      date,
      iso: toISODate(date),
      day: date.getDate(),
      outside: date.getMonth() !== month - 1,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: toISODate(date) === toISODate(new Date()),
    };
  });
}

export const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Last N months, newest first — powers the month <select> on every report. */
export function recentMonths(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: monthLabel(d.getFullYear(), d.getMonth() + 1),
    };
  });
}

export const COMPUTATION_LABELS = {
  percent_of_wage: '% of wage',
  percent_of_basic: '% of basic',
  fixed: 'Fixed amount',
  balance: 'Balance of wage',
};

/**
 * Option lists for the profile form. The `value`s are the lowercase enums the
 * backend validators accept (see `backend/app/schemas/employee.py`); only the
 * labels are for humans.
 */
export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'undisclosed', label: 'Prefer not to say' },
];

export const MARITAL_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'undisclosed', label: 'Prefer not to say' },
];

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

/** Turn any of the option lists above back into a label. */
export function optionLabel(options, value) {
  if (!value) return '—';
  return options.find((option) => option.value === value)?.label ?? labelizeEnum(value);
}

/** "full_time" -> "Full time", for values that predate the option lists. */
export function labelizeEnum(value) {
  if (!value) return '—';
  return String(value).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
