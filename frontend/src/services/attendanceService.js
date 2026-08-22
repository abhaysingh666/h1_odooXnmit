import api from '../lib/api';

export async function getAttendance({ employeeId } = {}) {
  const params = {};
  if (employeeId) {
    params.employeeId = employeeId;
  }
  const response = await api.get('/attendance', { params });
  return response.data;
}

export async function getTodayAttendance(employeeId) {
  const response = await api.get(`/attendance/today/${employeeId}`);
  return response.data;
}

export async function checkIn(employeeId) {
  const response = await api.post('/attendance/check-in', { employeeId });
  return response.data;
}

export async function checkOut(employeeId) {
  const response = await api.post('/attendance/check-out', { employeeId });
  return response.data;
}
