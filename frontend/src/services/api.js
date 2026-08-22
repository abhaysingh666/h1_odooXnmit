import axios from 'axios';

/**
 * In dev we deliberately go through the Vite proxy (relative baseURL) so the
 * browser treats API calls as same-origin. That matters because the backend
 * authenticates via an httpOnly `token` cookie (see
 * backend/app/utils/dependencies.py) rather than the Authorization header —
 * same-origin requests avoid every third-party-cookie and CORS pitfall.
 *
 * Set VITE_API_URL to point at an absolute backend URL in production.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * The cookie is the real credential. We also mirror the `access_token` from the
 * login response into a Bearer header so the API stays usable if the cookie is
 * ever blocked (e.g. a cross-site deployment without SameSite=None).
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Endpoints where a 401 is an expected answer, not a session expiry. */
const SILENT_401 = ['/api/auth/me', '/api/auth/login', '/api/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const isSilent = SILENT_401.some((path) => url.includes(path));

    if (error.response?.status === 401 && !isSilent) {
      // Session expired mid-session — clear it and bounce to login, preserving
      // where the user was so they land back there after signing in.
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const next = encodeURIComponent(window.location.pathname + window.location.search);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace(`/login?expired=1&next=${next}`);
      }
    }
    return Promise.reject(error);
  }
);

// ── Authentication ────────────────────────────────────────────────────────────

export const authAPI = {
  /** `login_id` accepts either the generated Login ID or the user's email. */
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  changePassword: (data) => api.post('/api/auth/change-password', data),
  completeRegistration: (data) => api.post('/api/auth/complete-registration', data),
  bootstrapAdmin: () => api.post('/api/auth/bootstrap-admin'),
  deleteProfile: () => api.delete('/api/auth/delete-profile'),
};

// ── Admin-only ────────────────────────────────────────────────────────────────

export const adminAPI = {
  createEmployee: (data) => api.post('/api/auth/admin/create-employee', data),

  /**
   * The backend declares `employee_email` as a bare string parameter, which
   * FastAPI reads from the query string — not the JSON body.
   */
  promoteToAdmin: (employeeEmail) =>
    api.post('/api/auth/admin/promote-to-admin', null, {
      params: { employee_email: employeeEmail },
    }),

  uploadLogo: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/api/auth/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
  },
};

export const systemAPI = {
  health: () => api.get('/health'),
};

// ── Employees & profiles ──────────────────────────────────────────────────────

/**
 * The directory is readable by every authenticated user (cards open in
 * view-only mode); writes are split between `/me` for self-service and
 * `/:id` for admins. See backend/app/routers/employees.py.
 */
export const employeeAPI = {
  list: (params) => api.get('/api/employees', { params }),
  stats: () => api.get('/api/employees/stats'),
  departments: () => api.get('/api/employees/departments'),

  me: () => api.get('/api/employees/me'),
  updateMe: (data) => api.patch('/api/employees/me', data),
  uploadMyAvatar: (file) => uploadFile('/api/employees/me/avatar', file),

  get: (id) => api.get(`/api/employees/${id}`),
  update: (id, data) => api.patch(`/api/employees/${id}`, data),
  uploadAvatar: (id, file) => uploadFile(`/api/employees/${id}/avatar`, file),
  deactivate: (id) => api.post(`/api/employees/${id}/deactivate`),
  activate: (id) => api.post(`/api/employees/${id}/activate`),
};

// ── Attendance ────────────────────────────────────────────────────────────────

export const attendanceAPI = {
  today: () => api.get('/api/attendance/today'),
  checkIn: (data = {}) => api.post('/api/attendance/check-in', data),
  checkOut: (data = {}) => api.post('/api/attendance/check-out', data),

  /** Omit year/month for the current month. */
  mine: (params) => api.get('/api/attendance/me', { params }),
  forEmployee: (id, params) => api.get(`/api/attendance/employee/${id}`, { params }),

  /** Admin day view — `date` is an ISO `YYYY-MM-DD` string. */
  day: (params) => api.get('/api/attendance/day', { params }),
  record: (data) => api.post('/api/attendance/manual', data),
};

// ── Time off ──────────────────────────────────────────────────────────────────

export const leaveAPI = {
  apply: (data) => api.post('/api/leaves', data),
  mine: (params) => api.get('/api/leaves/me', { params }),
  balance: (params) => api.get('/api/leaves/balance', { params }),
  calendar: (params) => api.get('/api/leaves/calendar', { params }),

  /** Admin/HR approvals queue. */
  list: (params) => api.get('/api/leaves', { params }),
  get: (id) => api.get(`/api/leaves/${id}`),
  review: (id, data) => api.post(`/api/leaves/${id}/review`, data),
  cancel: (id) => api.post(`/api/leaves/${id}/cancel`),

  /** Sick-note or other supporting document; returns `{ url }`. */
  uploadAttachment: (file, onProgress) =>
    uploadFile('/api/leaves/attachment', file, onProgress),
};

// ── Payroll ───────────────────────────────────────────────────────────────────

export const payrollAPI = {
  mine: () => api.get('/api/payroll/me'),
  myPayslip: (params) => api.get('/api/payroll/me/payslip', { params }),

  defaults: () => api.get('/api/payroll/defaults'),
  register: (params) => api.get('/api/payroll/register', { params }),

  forEmployee: (id) => api.get(`/api/payroll/${id}`),
  update: (id, data) => api.put(`/api/payroll/${id}`, data),
  payslip: (id, params) => api.get(`/api/payroll/${id}/payslip`, { params }),
};

/** Shared multipart helper — axios sets the boundary itself. */
function uploadFile(url, file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
}

export default api;
