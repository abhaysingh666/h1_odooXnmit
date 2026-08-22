// ---------------------------------------------------------------------------
// Auth service — PLACEHOLDER ONLY.
//
// The brief states an authentication flow already exists in the host
// project. This file exists only so /login and /signup are wireable and the
// rest of the app (protected routes, "logged-in user" state, logout) has
// something real to call. Delete this file and point `AuthContext` at the
// existing project's auth implementation:
//
//   GET  /users/me          -> getCurrentUser()
//   POST /auth/login        -> login(loginId, password)
//   POST /auth/logout       -> logout()
// ---------------------------------------------------------------------------
import { _getAll } from '../data/mockEmployees';

const SESSION_KEY = 'hr_dashboard_session_employee_id';
const LATENCY = 500;

function delay(value, ms = LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// The session user is used all over the UI (navbar, greetings, role checks),
// so it never carries salary — that stays behind the dedicated, admin-gated
// employeeService.getEmployeeSalary() call.
function omitSalary(employee) {
  if (!employee) return employee;
  const { salary: _salary, ...rest } = employee;
  return rest;
}

export async function login(loginId, password) {
  if (!loginId || !password) {
    return delay(Promise.reject(new Error('Enter your Login ID and password.')));
  }
  // Any password "works" in this placeholder — real validation happens server-side.
  // Match on employee ID or email (case-insensitive) so the demo can log in as
  // different roles; unrecognized input falls back to the first employee.
  const needle = loginId.trim().toLowerCase();
  const employee =
    _getAll().find((e) => e.id.toLowerCase() === needle || e.email.toLowerCase() === needle) || _getAll()[0];
  sessionStorage.setItem(SESSION_KEY, employee.id);
  return delay(omitSalary(employee));
}

export async function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  return delay(true, 150);
}

export async function getCurrentUser() {
  const id = sessionStorage.getItem(SESSION_KEY);
  if (!id) return delay(null, 120);
  const employee = _getAll().find((e) => e.id === id) || null;
  return delay(omitSalary(employee), 200);
}
