import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';
import AppLayout from './components/Navbar/AppLayout';

import LoginPage from './pages/Login/LoginPage';
import SignupPage from './pages/Signup/SignupPage';
import EmployeesPage from './pages/Employees/EmployeesPage';
import EmployeeDetailsPage from './pages/EmployeeDetails/EmployeeDetailsPage';
import NewEmployeePage from './pages/NewEmployee/NewEmployeePage';
import ProfilePage from './pages/Profile/ProfilePage';
import AttendancePage from './pages/Attendance/AttendancePage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Phase 5, 6, 7 page imports
import Leave from './pages/employee/Leave';
import LeaveApprovals from './pages/admin/LeaveApprovals';
import Payroll from './pages/employee/Payroll';
import AdminPayroll from './pages/admin/Payroll';
import Dashboard from './pages/admin/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Default: send everyone to the Employees dashboard, which
                  itself redirects to /login if not authenticated. */}
              <Route path="/" element={<Navigate to="/employees" replace />} />

              {/* Guest-only routes: authenticated users are bounced to /employees */}
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              {/* Protected routes: unauthenticated users are bounced to /login */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/employees/new" element={<NewEmployeePage />} />
                  <Route path="/employees/:employeeId" element={<EmployeeDetailsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  
                  {/* Phase 5 - Leave Management */}
                  <Route path="/leave" element={<Leave />} />
                  <Route path="/admin/leave-approvals" element={<LeaveApprovals />} />
                  
                  {/* Phase 6 - Payroll Module */}
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/admin/payroll" element={<AdminPayroll />} />
                  
                  {/* Phase 7 - Admin Dashboard */}
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
