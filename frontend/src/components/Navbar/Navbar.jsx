import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { Users, Clock4, CalendarClock, Menu, X, Building2 } from 'lucide-react';
import ProfileDropdown from '../ProfileDropdown/ProfileDropdown';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, ReceiptText, ClipboardList } from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [];
  if (user) {
    if (user.role === 'admin') {
      navItems.push(
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/employees', label: 'Employees', icon: Users },
        { to: '/admin/leave-approvals', label: 'Leave Approvals', icon: ClipboardList },
        { to: '/admin/payroll', label: 'Payroll', icon: ReceiptText },
      );
    } else {
      navItems.push(
        { to: '/employees', label: 'Employees', icon: Users },
        { to: '/attendance', label: 'Attendance', icon: Clock4 },
        { to: '/leave', label: 'Leave', icon: CalendarClock },
        { to: '/payroll', label: 'Payroll', icon: ReceiptText },
      );
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/employees" className="flex items-center gap-2" aria-label="Go to Employees">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
              <Building2 size={17} />
            </span>
            <span className="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
              Northgate HR
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ProfileDropdown />
          <button
            type="button"
            className="rounded-[var(--radius-control)] p-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="animate-fade-in border-t border-[var(--color-line)] px-4 pb-3 pt-2 md:hidden" aria-label="Primary mobile">
          <div className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
