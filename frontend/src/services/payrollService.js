import api from '../lib/api';

export async function getMyPayroll() {
  const response = await api.get('/payroll/me');
  return response.data;
}

export async function getAllPayroll() {
  const response = await api.get('/payroll');
  return response.data;
}

export async function getEmployeePayroll(employeeId) {
  const response = await api.get(`/payroll/employee/${employeeId}`);
  return response.data;
}

export async function createPayroll(data) {
  const response = await api.post('/payroll', data);
  return response.data;
}

export async function updatePayroll(id, data) {
  const response = await api.put(`/payroll/${id}`, data);
  return response.data;
}
