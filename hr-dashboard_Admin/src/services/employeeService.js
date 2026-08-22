// ---------------------------------------------------------------------------
// Employee service
//
// Every function here returns a Promise, matching what `fetch`/`axios` would
// return. Swap the body of each function for a real HTTP call once the
// backend is ready — nothing in `pages/` or `components/` needs to change.
//
//   GET    /employees            -> getEmployees()
//   GET    /employees/{id}       -> getEmployeeById(id)
//   POST   /employees            -> createEmployee(data)
//   PUT    /employees/{id}       -> updateEmployee(id, data)
// ---------------------------------------------------------------------------
import { _getAll, _getById, _create, _updateById, _updateSalaryById, _nextSerial } from '../data/mockEmployees';
import { generateLoginId } from '../utils/formatters';
import { ROLES } from '../utils/constants';

const LATENCY = 380;

function delay(value, ms = LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// Salary data is sensitive. In a real backend this check lives on the
// server (the API route/handler), never just in the UI — a request without
// admin privileges should never even receive the data. This function is the
// stand-in for that server-side check: every salary read/write in this
// service goes through it first, so a non-admin can't reach salary data no
// matter how the UI is driven (including a manually-typed URL, since the
// page itself calls these same functions to fetch data for the tab).
// ---------------------------------------------------------------------------
function assertAdmin(currentUser) {
  if (!currentUser || currentUser.role !== ROLES.ADMIN) {
    const err = new Error('You do not have permission to view or edit salary information.');
    err.code = 'FORBIDDEN';
    throw err;
  }
}

// Salary is stripped from every general-purpose employee response. It is
// only ever returned by getEmployeeSalary(), which is gated by assertAdmin
// above — that keeps the sensitive data out of the payload for non-admin
// callers instead of relying on the UI to just not display it.
function omitSalary(employee) {
  if (!employee) return employee;
  const { salary: _salary, ...rest } = employee;
  return rest;
}

export async function getEmployees() {
  // return (await fetch('/api/employees')).json();
  return delay(_getAll().map(omitSalary));
}

export async function getEmployeeById(id) {
  // return (await fetch(`/api/employees/${id}`)).json();
  const employee = _getById(id);
  return delay(omitSalary(employee));
}

export async function createEmployee(data) {
  // return (await fetch('/api/employees', { method: 'POST', body: JSON.stringify(data) })).json();
  const serial = _nextSerial();
  const [firstName, ...rest] = data.name.trim().split(' ');
  const lastName = rest.join(' ') || firstName;
  const year = new Date(data.joiningDate || Date.now()).getFullYear();

  const employee = {
    id: data.id || generateLoginId({ firstName, lastName, year, serial }),
    status: 'absent',
    avatar: null,
    ...data,
  };
  return delay(_create(employee), 500);
}

export async function updateEmployee(id, data) {
  // return (await fetch(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) })).json();
  // Salary can only be changed via updateEmployeeSalary(), never through this
  // general-purpose update.
  const { salary: _salary, ...safeData } = data;
  return delay(omitSalary(_updateById(id, safeData)), 450);
}

// ---------------------------------------------------------------------------
// Salary — Admin-only. Both functions require the caller's currentUser and
// reject anyone who isn't ROLES.ADMIN before touching the data.
//   GET /employees/{id}/salary        -> getEmployeeSalary(id, currentUser)
//   PUT /employees/{id}/salary        -> updateEmployeeSalary(id, data, currentUser)
// ---------------------------------------------------------------------------
export async function getEmployeeSalary(id, currentUser) {
  assertAdmin(currentUser);
  const employee = _getById(id);
  return delay(employee?.salary || null);
}

export async function updateEmployeeSalary(id, salaryData, currentUser) {
  assertAdmin(currentUser);
  const updated = _updateSalaryById(id, salaryData);
  return delay(updated?.salary || null, 450);
}
