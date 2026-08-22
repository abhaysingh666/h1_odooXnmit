import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, User, Clock, CalendarDays, CreditCard, Users, CheckSquare } from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const links = isAdmin ? [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Attendance', path: '/admin/attendance', icon: Clock },
    { name: 'Leave Approvals', path: '/admin/leave', icon: CheckSquare },
    { name: 'Payroll', path: '/admin/payroll', icon: CreditCard },
  ] : [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Leave Requests', path: '/leave', icon: CalendarDays },
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
  ];

  return (
    <aside className="w-60 border-r flex flex-col justify-between py-5 px-3 shrink-0 hidden md:flex transition-colors duration-300"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-main)', minHeight: 'calc(100vh - 4rem)' }}>
      <div className="space-y-5">
        <div className="px-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? 'Management' : 'Workplace'}
          </p>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.path} to={link.path}
                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200`}
                style={({ isActive }) => isActive ? {
                  background: 'var(--accent)', color: 'white', boxShadow: '0 4px 20px var(--accent-glow)'
                } : {
                  color: 'var(--text-secondary)'
                }}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 rounded-2xl border" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}>
        <p className="text-[11px] font-extrabold" style={{ color: 'var(--text-primary)' }}>Dayflow v2.0</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Amethyst Haze Design System</p>
      </div>
    </aside>
  );
};
