import api from '../lib/api';

export async function getTimeOffRequests(employeeId) {
  // If employeeId is passed, we fetch leaves for that employee, otherwise own leaves.
  // Note: /leaves/me is safer for employees.
  const response = await api.get('/leaves/me');
  return response.data;
}

export async function createTimeOffRequest(data) {
  const response = await api.post('/leaves', data);
  return response.data;
}

// Admin leave management functions
export async function getAllLeaves() {
  const response = await api.get('/leaves');
  return response.data;
}

export async function getPendingLeaves() {
  const response = await api.get('/leaves/pending');
  return response.data;
}

export async function approveLeave(id, comment = '') {
  const response = await api.put(`/leaves/${id}/approve`, { admin_comments: comment });
  return response.data;
}

export async function rejectLeave(id, comment = '') {
  const response = await api.put(`/leaves/${id}/reject`, { admin_comments: comment });
  return response.data;
}
