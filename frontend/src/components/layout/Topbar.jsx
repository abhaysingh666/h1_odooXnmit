import { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  KeyRound,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { ThemeToggle } from '../ThemeToggle';

/** Route segment -> human label for the breadcrumb. */
const CRUMBS = {
  admin: 'Admin',
  employee: 'Workspace',
  dashboard: 'Dashboard',
  employees: 'Employees',
  create: 'Add employee',
  access: 'Roles & access',
  company: 'Company logo',
  profile: 'My profile',
  'change-password': 'Password',
};

export function Topbar({ onOpenMobileNav }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const segments = location.pathname.split('/').filter(Boolean);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out', 'Your session token has been revoked.');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border glass px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="lg:hidden"
      >
        <Menu />
      </Button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm sm:flex">
        {segments.length === 0 ? (
          <span className="font-medium">Dashboard</span>
        ) : (
          segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const label = CRUMBS[segment] ?? segment;

            return (
              <Fragment key={`${segment}-${index}`}>
                {index > 0 && (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    'truncate',
                    isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {label}
                </span>
              </Fragment>
            );
          })
        )}
      </nav>

      <div className="flex-1 sm:hidden" />

      <div className="flex shrink-0 items-center gap-1.5">
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/employees/create')}
            className="hidden sm:inline-flex"
          >
            <UserPlus />
            Add employee
          </Button>
        )}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-accent/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Avatar name={user?.name} size="sm" />
            <span className="hidden min-w-0 text-left md:block">
              <span className="block max-w-[10rem] truncate text-sm font-medium leading-tight">
                {user?.name}
              </span>
              <span className="block max-w-[10rem] truncate font-mono text-[0.6875rem] leading-tight text-muted-foreground">
                {user?.login_id}
              </span>
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent width="w-64">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5">
                <Avatar name={user?.name} size="default" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email_id}</p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={isAdmin ? 'subtle' : 'outline'} className="text-[0.625rem]">
                  {isAdmin ? <ShieldCheck /> : <User />}
                  {isAdmin ? 'Admin' : 'Employee'}
                </Badge>
                {user?.is_verified ? (
                  <Badge variant="success" className="text-[0.625rem]">
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[0.625rem]">
                    Unverified
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-mono text-[0.6875rem] text-muted-foreground">
                {user?.login_id}
              </p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuItem icon={User} onSelect={() => navigate('/profile')}>
              My profile
            </DropdownMenuItem>
            <DropdownMenuItem icon={KeyRound} onSelect={() => navigate('/change-password')}>
              Change password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={LogOut} destructive onSelect={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
