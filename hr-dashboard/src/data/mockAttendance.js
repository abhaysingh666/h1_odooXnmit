import { todayISO } from '../utils/formatters';

// Mock attendance records, keyed by employeeId + date.
// Replace `services/attendanceService.js` internals to point at a real API;
// nothing outside that file should import from here directly.

let records = [
  { employeeId: 'EMP001', date: todayISO(), checkIn: '09:12', checkOut: null, status: 'present' },
  { employeeId: 'EMP001', date: '2026-08-21', checkIn: '09:05', checkOut: '18:22', status: 'present' },
  { employeeId: 'EMP001', date: '2026-08-20', checkIn: '09:30', checkOut: '18:10', status: 'present' },
  { employeeId: 'EMP001', date: '2026-08-19', checkIn: '09:00', checkOut: '17:58', status: 'present' },
  { employeeId: 'EMP001', date: '2026-08-18', checkIn: null, checkOut: null, status: 'leave' },
];

export function _getAll() {
  return records;
}

export function _getByEmployee(employeeId) {
  return records
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function _getToday(employeeId) {
  return records.find((r) => r.employeeId === employeeId && r.date === todayISO()) || null;
}

export function _upsertToday(employeeId, patch) {
  const date = todayISO();
  const existing = records.find((r) => r.employeeId === employeeId && r.date === date);
  if (existing) {
    Object.assign(existing, patch);
    return { ...existing };
  }
  const created = { employeeId, date, checkIn: null, checkOut: null, status: 'absent', ...patch };
  records = [created, ...records];
  return created;
}
