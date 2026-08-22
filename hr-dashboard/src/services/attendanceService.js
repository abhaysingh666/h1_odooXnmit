// ---------------------------------------------------------------------------
// Attendance service
//
//   GET  /attendance                 -> getAttendance({ employeeId })
//   GET  /attendance/today/{empId}   -> getTodayAttendance(employeeId)
//   POST /attendance/check-in        -> checkIn(employeeId)
//   POST /attendance/check-out       -> checkOut(employeeId)
// ---------------------------------------------------------------------------
import { _getAll, _getByEmployee, _getToday, _upsertToday } from '../data/mockAttendance';
import { _updateById } from '../data/mockEmployees';

const LATENCY = 420;

function delay(value, ms = LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export async function getAttendance({ employeeId } = {}) {
  // return (await fetch(`/api/attendance?employeeId=${employeeId}`)).json();
  const records = employeeId ? _getByEmployee(employeeId) : _getAll();
  return delay(records);
}

export async function getTodayAttendance(employeeId) {
  // return (await fetch(`/api/attendance/today/${employeeId}`)).json();
  return delay(_getToday(employeeId));
}

export async function checkIn(employeeId) {
  // return (await fetch('/api/attendance/check-in', { method: 'POST', body: JSON.stringify({ employeeId }) })).json();
  const record = _upsertToday(employeeId, { checkIn: nowHHMM(), checkOut: null, status: 'present' });
  _updateById(employeeId, { status: 'present' });
  return delay(record, 550);
}

export async function checkOut(employeeId) {
  // return (await fetch('/api/attendance/check-out', { method: 'POST', body: JSON.stringify({ employeeId }) })).json();
  const record = _upsertToday(employeeId, { checkOut: nowHHMM() });
  return delay(record, 550);
}
