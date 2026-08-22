// ---------------------------------------------------------------------------
// Time-off service
//
//   GET  /time-off              -> getTimeOffRequests(employeeId)
//   POST /time-off              -> createTimeOffRequest(data)
// ---------------------------------------------------------------------------
import { _getByEmployee, _create } from '../data/mockTimeOff';

const LATENCY = 400;

function delay(value, ms = LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getTimeOffRequests(employeeId) {
  // return (await fetch(`/api/time-off?employeeId=${employeeId}`)).json();
  return delay(_getByEmployee(employeeId));
}

export async function createTimeOffRequest(data) {
  // return (await fetch('/api/time-off', { method: 'POST', body: JSON.stringify(data) })).json();
  return delay(_create(data), 500);
}
