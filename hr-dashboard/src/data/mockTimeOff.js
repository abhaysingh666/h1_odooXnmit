// Mock time-off requests.
// Replace `services/timeOffService.js` internals to point at a real API;
// nothing outside that file should import from here directly.

let requests = [
  {
    id: 'TO001',
    employeeId: 'EMP001',
    type: 'Vacation',
    startDate: '2026-09-02',
    endDate: '2026-09-05',
    reason: 'Family trip',
    status: 'approved',
    appliedOn: '2026-08-10',
  },
  {
    id: 'TO002',
    employeeId: 'EMP001',
    type: 'Sick Leave',
    startDate: '2026-08-14',
    endDate: '2026-08-14',
    reason: 'Fever',
    status: 'approved',
    appliedOn: '2026-08-14',
  },
  {
    id: 'TO003',
    employeeId: 'EMP001',
    type: 'Personal',
    startDate: '2026-08-29',
    endDate: '2026-08-29',
    reason: 'Personal errand',
    status: 'pending',
    appliedOn: '2026-08-20',
  },
];

let nextId = 4;

export function _getAll() {
  return requests;
}

export function _getByEmployee(employeeId) {
  return requests
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => (a.appliedOn < b.appliedOn ? 1 : -1));
}

export function _create(request) {
  const created = { id: `TO${String(nextId++).padStart(3, '0')}`, status: 'pending', ...request };
  requests = [created, ...requests];
  return created;
}
