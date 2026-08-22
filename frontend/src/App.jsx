import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import TimeOffPage from './pages/TimeOff/TimeOffPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

export default function App() {
  return (
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
                <Route path="/time-off" element={<TimeOffPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
