import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';

import { EmployeeDashboard } from './pages/employee/Dashboard';
import { EmployeeProfile } from './pages/employee/Profile';
import { EmployeeAttendance } from './pages/employee/Attendance';
import { EmployeeLeave } from './pages/employee/Leave';
import { EmployeePayroll } from './pages/employee/Payroll';

import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminEmployees } from './pages/admin/Employees';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminLeaveApprovals } from './pages/admin/LeaveApprovals';
import { AdminPayroll } from './pages/admin/Payroll';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-purple-300 flex items-center justify-center font-medium">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07040d] text-gray-900 dark:text-white flex flex-col transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Employee Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><EmployeeAttendance /></ProtectedRoute>} />
            <Route path="/leave" element={<ProtectedRoute><EmployeeLeave /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute><EmployeePayroll /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/employees" element={<ProtectedRoute adminOnly><AdminEmployees /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute adminOnly><AdminAttendance /></ProtectedRoute>} />
            <Route path="/admin/leave" element={<ProtectedRoute adminOnly><AdminLeaveApprovals /></ProtectedRoute>} />
            <Route path="/admin/payroll" element={<ProtectedRoute adminOnly><AdminPayroll /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
