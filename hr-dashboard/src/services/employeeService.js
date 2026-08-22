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
import { _getAll, _getById, _create, _updateById, _nextSerial } from '../data/mockEmployees';
import { generateLoginId } from '../utils/formatters';

const LATENCY = 380;

function delay(value, ms = LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getEmployees() {
  // return (await fetch('/api/employees')).json();
  return delay(_getAll());
}

export async function getEmployeeById(id) {
  // return (await fetch(`/api/employees/${id}`)).json();
  const employee = _getById(id);
  return delay(employee);
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
  return delay(_updateById(id, data), 450);
}
