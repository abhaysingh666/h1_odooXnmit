import api from '../lib/api';

const SESSION_KEY = 'hr_dashboard_session_employee_id';
const TOKEN_KEY = 'hr_dashboard_token';

export async function login(loginId, password) {
  const response = await api.post('/auth/login', { loginId, password });
  const user = response.data;
  sessionStorage.setItem(SESSION_KEY, user.id);
  sessionStorage.setItem(TOKEN_KEY, user.token);
  return user;
}

export async function register(data) {
  const prefix = (data.company || 'CMP').trim().slice(0, 3).toUpperCase().padEnd(3, 'X');
  const employeeId = `${prefix}ADM0001`;
  const response = await api.post('/auth/register', {
    employee_id: employeeId,
    email: data.email,
    password: data.password,
    role: 'admin'
  });
  return response.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // Ignore logout error if token expired
  }
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  return true;
}

export async function getCurrentUser() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    return null;
  }
}
