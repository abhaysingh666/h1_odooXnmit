import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Pages
import LoginPage from './pages/LoginPage';
import EmployeeRegistration from './pages/EmployeeRegistration';
import CompleteRegistration from './pages/CompleteRegistration';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateEmployee from './pages/admin/CreateEmployee';
import EmployeeList from './pages/admin/EmployeeList';
import CompanySettings from './pages/admin/CompanySettings';
import RolesAccess from './pages/admin/RolesAccess';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeDirectory from './pages/directory/EmployeeDirectory';
import EmployeeDetailPage from './pages/directory/EmployeeDetailPage';
import AttendancePage from './pages/attendance/AttendancePage';
import TimeOffPage from './pages/timeoff/TimeOffPage';
import PayrollPage from './pages/payroll/PayrollPage';
import MyProfile from './pages/profile/MyProfile';
import ChangePassword from './pages/ChangePassword';
import ReportsPage from './pages/reports/ReportsPage';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<EmployeeRegistration />} />
              <Route path="/complete-registration" element={<CompleteRegistration />} />

              {/* Protected Routes with AppShell */}
              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/employees" element={<ProtectedRoute requireAdmin><EmployeeList /></ProtectedRoute>} />
                <Route path="/admin/employees/create" element={<ProtectedRoute requireAdmin><CreateEmployee /></ProtectedRoute>} />
                <Route path="/admin/company" element={<ProtectedRoute requireAdmin><CompanySettings /></ProtectedRoute>} />
                <Route path="/admin/access" element={<ProtectedRoute requireAdmin><RolesAccess /></ProtectedRoute>} />
                
                {/* Employee Routes */}
                <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                
                {/* Shared Routes (Both Admin & Employee) */}
                <Route path="/employees" element={<EmployeeDirectory />} />
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/time-off" element={<TimeOffPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
