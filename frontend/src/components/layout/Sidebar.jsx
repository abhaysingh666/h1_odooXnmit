import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronsLeft,
  Clock,
  DollarSign,
  Image,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo, LogoMark } from '../Logo';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

/**
 * Navigation is derived from the roles the backend actually enforces:
 * `get_current_admin` gates the admin-only routes, `get_current_user` the rest.
 */
const NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, admin: true },
      { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard, employee: true },
    ],
  },
  {
    section: 'People',
    items: [
      { to: '/employees', label: 'Directory', icon: Users },
      { to: '/admin/employees/create', label: 'Add employee', icon: UserPlus, admin: true },
      { to: '/admin/access', label: 'Roles & access', icon: ShieldCheck, admin: true },
    ],
  },
  {
    section: 'Time & Attendance',
    items: [
      { to: '/attendance', label: 'Attendance', icon: Clock },
      { to: '/time-off', label: 'Time Off', icon: Calendar },
    ],
  },
  {
    section: 'Payroll & Reports',
    items: [
      { to: '/payroll', label: 'Payroll', icon: DollarSign },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    section: 'Company',
    admin: true,
    items: [{ to: '/admin/company', label: 'Company logo', icon: Image, admin: true }],
  },
  {
    section: 'Account',
    items: [
      { to: '/profile', label: 'My profile', icon: Building2 },
      { to: '/change-password', label: 'Password', icon: KeyRound },
    ],
  },
];

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, isAdmin } = useAuth();

  const visibleSections = NAV.filter((section) => !section.admin || isAdmin).map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.admin) return isAdmin;
      if (item.employee) return !isAdmin;
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Scrim for the mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-foreground/35 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar',
          'text-sidebar-foreground transition-[width,transform] duration-300 ease-out',
          collapsed ? 'lg:w-[4.5rem]' : 'lg:w-64',
          'w-72 lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-sidebar-border',
            collapsed ? 'lg:justify-center lg:px-0' : 'px-4'
          )}
        >
          {collapsed ? (
            <>
              <span className="lg:hidden">
                <Logo size="sm" />
              </span>
              <LogoMark size="default" className="hidden lg:grid" />
            </>
          ) : (
            <Logo size="sm" />
          )}

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Company context — every Login ID is prefixed from this name. */}
        {user?.company_name && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4 py-3',
              collapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <Avatar
              src={user.company_logo_url}
              name={user.company_name}
              size="sm"
              className="rounded-md"
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight">{user.company_name}</p>
                <p className="truncate text-[0.6875rem] leading-tight text-muted-foreground">
                  {isAdmin ? 'Administrator' : 'Employee'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
          {visibleSections.map((section) => (
            <div key={section.section} className="space-y-1">
              <p
                className={cn(
                  'px-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground/80',
                  collapsed && 'lg:sr-only'
                )}
              >
                {section.section}
              </p>
              {section.items.map((item) => (
                <SidebarLink
                  key={item.to + item.label}
                  {...item}
                  collapsed={collapsed}
                  onNavigate={onCloseMobile}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: collapse toggle + role badge */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          {!collapsed && (
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <span className="text-[0.6875rem] text-muted-foreground">Signed in as</span>
              <Badge variant={isAdmin ? 'subtle' : 'outline'} className="text-[0.625rem]">
                {isAdmin ? 'Admin' : 'Employee'}
              </Badge>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'hidden w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground',
              'transition-colors hover:bg-accent/40 hover:text-foreground lg:flex',
              collapsed && 'lg:justify-center lg:px-0'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronsLeft
              className={cn('size-4 shrink-0 transition-transform duration-300', collapsed && 'rotate-180')}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ to, label, icon: Icon, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium',
          'transition-[background-color,color] duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          collapsed && 'lg:justify-center lg:px-0',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/35 hover:text-sidebar-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active rail — reads at a glance even when collapsed. */}
          <span
            className={cn(
              'absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden="true"
          />
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className={cn('truncate', collapsed && 'lg:sr-only')}>{label}</span>
        </>
      )}
    </NavLink>
  );
}
