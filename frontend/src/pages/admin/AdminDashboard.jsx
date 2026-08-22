import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Clock,
  Fingerprint,
  Image,
  KeyRound,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRoster, rosterStats, tokenDaysLeft } from '@/lib/roster';
import { copyText, firstName, relativeTime } from '@/lib/utils';
import { EmptyState, PageHeader, StatCard } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Progress, Separator } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const QUICK_ACTIONS = [
  {
    to: '/admin/employees/create',
    icon: UserPlus,
    title: 'Add an employee',
    description: 'Generate a Login ID, temporary password and invitation link.',
  },
  {
    to: '/admin/access',
    icon: UserCog,
    title: 'Grant admin access',
    description: 'Promote an existing employee to administrator by email.',
  },
  {
    to: '/admin/company',
    icon: Image,
    title: 'Update company logo',
    description: 'Upload a logo that appears on every account you create.',
  },
  {
    to: '/change-password',
    icon: KeyRound,
    title: 'Change your password',
    description: 'Rotate your own credentials at any time.',
  },
];

// What the backend actually enforces, per role — worth surfacing since
// authorization is the whole product surface right now.
const CAPABILITIES = [
  { label: 'Sign in and out', admin: true, employee: true },
  { label: 'View own profile', admin: true, employee: true },
  { label: 'Change own password', admin: true, employee: true },
  { label: 'Delete own account', admin: true, employee: true },
  { label: 'Create employee accounts', admin: true, employee: false },
  { label: 'Promote others to admin', admin: true, employee: false },
  { label: 'Upload the company logo', admin: true, employee: false },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [roster] = useState(() => getRoster());
  const stats = useMemo(() => rosterStats(roster), [roster]);
  const recent = roster.slice(0, 5);

  const pending = roster.filter((entry) => tokenDaysLeft(entry.createdAt) > 0).length;

  const handleCopyLink = async (entry) => {
    const ok = await copyText(entry.registrationLink);
    if (ok) toast.success('Link copied', entry.name);
    else toast.error('Copy failed', 'Copy the link from the employees table instead.');
  };

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title={`Good to see you, ${firstName(user?.name) || 'admin'}`}
        description={`You're signed in as an administrator for ${user?.company_name ?? 'your company'}. Provision accounts, manage roles and keep credentials tidy.`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/admin/employees')}>
              <Users />
              Employees
            </Button>
            <Button onClick={() => navigate('/admin/employees/create')}>
              <UserPlus />
              Add employee
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Created here"
          value={stats.total}
          hint="Accounts made on this device"
          icon={Users}
          style={{ '--i': 0 }}
        />
        <StatCard
          label="This month"
          value={stats.thisMonth}
          hint={`${stats.thisWeek} in the last 7 days`}
          icon={Sparkles}
          tone="accent"
          style={{ '--i': 1 }}
        />
        <StatCard
          label="Invitations live"
          value={pending}
          hint={stats.expired ? `${stats.expired} expired` : 'All within 7 days'}
          icon={Clock}
          tone={stats.expired ? 'warning' : 'success'}
          style={{ '--i': 2 }}
        />
        <StatCard
          label="Administrators"
          value={stats.admins}
          hint="Created by you, plus yourself"
          icon={ShieldCheck}
          tone="primary"
          style={{ '--i': 3 }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="space-y-6">
          {/* Recent activity */}
          <Card className="animate-fade-up stagger" style={{ '--i': 4 }}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Recently provisioned</CardTitle>
                <CardDescription>
                  Accounts created from this browser. The API has no directory endpoint yet, so this
                  list is device-local.
                </CardDescription>
              </div>
              {roster.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/employees')}>
                  View all
                  <ArrowUpRight />
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {recent.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No accounts yet"
                  description="Create your first employee and Dayflow will generate their Login ID, a temporary password and a 7-day invitation link."
                  actionLabel="Add your first employee"
                  onAction={() => navigate('/admin/employees/create')}
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((entry, index) => {
                    const days = tokenDaysLeft(entry.createdAt);
                    return (
                      <li
                        key={entry.loginId}
                        className="animate-fade-up stagger flex flex-wrap items-center gap-3 px-6 py-3.5"
                        style={{ '--i': index + 5 }}
                      >
                        <Avatar name={entry.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-medium">
                            {entry.name}
                            {entry.role === 'admin' && (
                              <Badge variant="subtle">
                                <ShieldCheck />
                                Admin
                              </Badge>
                            )}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {entry.loginId}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden text-right sm:block">
                            <p className="text-xs text-muted-foreground">
                              {relativeTime(entry.createdAt)}
                            </p>
                            <p className="text-xs">
                              {days > 0 ? (
                                <span className="text-muted-foreground">
                                  Invite expires in {days}d
                                </span>
                              ) : (
                                <span className="text-destructive">Invite expired</span>
                              )}
                            </p>
                          </div>
                          {entry.registrationLink && days > 0 && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Copy registration link"
                              aria-label={`Copy registration link for ${entry.name}`}
                              onClick={() => handleCopyLink(entry)}
                            >
                              <Link2 />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action, index) => (
              <Link
                key={action.to}
                to={action.to}
                className="group animate-fade-up stagger rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                style={{ '--i': index + 6 }}
              >
                <Card hoverable className="h-full">
                  <CardContent className="flex items-start gap-3.5 p-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <action.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        {action.title}
                        <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card className="animate-fade-up stagger overflow-hidden" style={{ '--i': 5 }}>
            <div className="h-20 bg-gradient-to-br from-primary/25 via-accent to-secondary" />
            <CardContent className="-mt-9 space-y-4">
              <Avatar name={user?.name} size="xl" className="ring-4 ring-card" />
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {user?.name}
                  {user?.is_verified && (
                    <BadgeCheck className="size-4 text-primary" aria-label="Verified" />
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user?.email_id}</p>
              </div>

              <Separator />

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Fingerprint className="size-3.5" aria-hidden="true" />
                    Login ID
                  </dt>
                  <dd className="truncate font-mono font-medium">{user?.login_id}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="size-3.5" aria-hidden="true" />
                    Company
                  </dt>
                  <dd className="truncate font-medium">{user?.company_name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Role
                  </dt>
                  <dd>
                    <Badge variant="subtle">Administrator</Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <StatusDot tone={user?.is_verified ? 'success' : 'warning'} pulse />
                    Status
                  </dt>
                  <dd className="font-medium">
                    {user?.is_verified ? 'Verified' : 'Pending verification'}
                  </dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter className="border-t border-border pt-5">
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/profile')}>
                View full profile
              </Button>
            </CardFooter>
          </Card>

          <Card className="animate-fade-up stagger" style={{ '--i': 6 }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Who can do what</CardTitle>
              <CardDescription className="text-xs">
                Enforced server-side on every request.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-end gap-4 pb-1 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="w-10 text-center">Admin</span>
                <span className="w-10 text-center">Staff</span>
              </div>
              {CAPABILITIES.map((cap) => (
                <div key={cap.label} className="flex items-center gap-4 text-xs">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{cap.label}</span>
                  <span className="w-10 text-center">
                    <Mark on={cap.admin} />
                  </span>
                  <span className="w-10 text-center">
                    <Mark on={cap.employee} />
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-fade-up stagger" style={{ '--i': 7 }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Onboarding funnel</CardTitle>
              <CardDescription className="text-xs">
                Based on the {stats.total} account{stats.total === 1 ? '' : 's'} you created here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FunnelRow
                label="Invitations sent"
                value={stats.total}
                total={stats.total || 1}
                tone="bg-primary"
              />
              <FunnelRow
                label="Still within 7 days"
                value={pending}
                total={stats.total || 1}
                tone="bg-chart-3"
              />
              <FunnelRow
                label="Expired invitations"
                value={stats.expired}
                total={stats.total || 1}
                tone="bg-chart-4"
              />
              {stats.expired > 0 && (
                <Alert tone="warning" title={`${stats.expired} invitation${stats.expired === 1 ? '' : 's'} expired`}>
                  Registration tokens last 7 days. Create a fresh account for anyone who never
                  activated.
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Mark({ on }) {
  return on ? (
    <span className="inline-grid size-5 place-items-center rounded-full bg-primary/12 text-primary">
      <ShieldCheck className="size-3" aria-label="Allowed" />
    </span>
  ) : (
    <span className="inline-grid size-5 place-items-center rounded-full bg-muted text-muted-foreground/60">
      <span className="h-px w-2 bg-current" aria-label="Not allowed" />
    </span>
  );
}

function FunnelRow({ label, value, total, tone }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <Progress value={pct} indicatorClassName={tone} />
    </div>
  );
}
