import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
  Users,
} from 'lucide-react';

import { employeeAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn, errorMessage } from '@/lib/utils';
import { labelizeEnum } from '@/lib/hrms';
import { PageHeader, EmptyState, StatCard } from '@/components/PageHeader';
import { PresenceDot, PresenceLegend } from '@/components/PresenceIndicator';
import { CheckInWidget } from '@/components/CheckInWidget';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

const PRESENCE_FILTERS = [
  { value: '', label: 'Everyone' },
  { value: 'present', label: 'In office' },
  { value: 'leave', label: 'On time off' },
  { value: 'absent', label: 'Absent' },
];

/**
 * The landing screen after sign-in: the company directory as a grid of clickable
 * cards. Everyone can browse it — a colleague's card opens read-only, while an
 * admin lands on the same profile with the fields unlocked.
 */
export default function EmployeeDirectory() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [presenceFilter, setPresenceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [cards, setCards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      try {
        const { data } = await employeeAPI.list({
          q: query || undefined,
          department: department || undefined,
          presence: presenceFilter || undefined,
        });
        setCards(data);
        setError('');
      } catch (err) {
        setError(errorMessage(err, 'Could not load the employee directory.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query, department, presenceFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Filter options and headline counters don't change with the search box.
  useEffect(() => {
    let cancelled = false;
    Promise.all([employeeAPI.departments(), employeeAPI.stats()])
      .then(([deps, s]) => {
        if (cancelled) return;
        setDepartments(deps.data);
        setStats(s.data);
      })
      .catch(() => {
        /* Filters and counters are enhancements — the grid still works. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilters = (department ? 1 : 0) + (presenceFilter ? 1 : 0);

  return (
    <>
      <PageHeader
        icon={Users}
        title="Employees"
        description="Everyone at the company, with today's presence at a glance. Open a card to see the full profile."
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => load({ quiet: true })}
              disabled={refreshing}
              aria-label="Refresh directory"
            >
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden="true" />
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate('/admin/employees/new')}>
                <Plus className="size-4" aria-hidden="true" />
                New
              </Button>
            )}
          </>
        }
      />

      <CheckInWidget onChange={() => load({ quiet: true })} />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Headcount" value={stats.active} hint={`${stats.admins} with HR access`} icon={Users} />
          <StatCard
            label="In office today"
            value={stats.present_today}
            hint="Checked in"
            icon={UserRound}
            tone="success"
            style={{ '--stagger': 1 }}
          />
          <StatCard
            label="On time off"
            value={stats.on_leave_today}
            hint="Approved requests"
            icon={Building2}
            tone="accent"
            style={{ '--stagger': 2 }}
          />
          <StatCard
            label="Absent"
            value={stats.absent_today}
            hint="No check-in, no request"
            icon={SlidersHorizontal}
            tone="warning"
            style={{ '--stagger': 3 }}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <Input
              icon={Search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, Login ID, email or role…"
              aria-label="Search employees"
            />
          </div>

          <Button
            variant={activeFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters((open) => !open)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {activeFilters > 0 && (
              <Badge variant="default" className="ml-1 px-1.5">
                {activeFilters}
              </Badge>
            )}
          </Button>

          <span className="ml-auto text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${cards.length} ${cards.length === 1 ? 'person' : 'people'}`}
          </span>
        </div>

        {showFilters && (
          <Card className="animate-fade-up">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">Department</span>
                <Select value={department} onChange={(event) => setDepartment(event.target.value)}>
                  <option value="">All departments</option>
                  {departments.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="font-medium">Today</span>
                <Select
                  value={presenceFilter}
                  onChange={(event) => setPresenceFilter(event.target.value)}
                >
                  {PRESENCE_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDepartment('');
                    setPresenceFilter('');
                  }}
                  disabled={!activeFilters}
                >
                  Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <PresenceLegend />
      </div>

      {error && <Alert tone="error" title="Directory unavailable">{error}</Alert>}

      {loading ? (
        <DirectorySkeleton />
      ) : cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No one matches that search"
            description="Try a different name, clear the filters, or add a new employee to the company."
            actionLabel={isAdmin ? 'Add an employee' : undefined}
            onAction={isAdmin ? () => navigate('/admin/employees/new') : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((person, index) => (
            <EmployeeCardTile key={person._id} person={person} index={index} />
          ))}
        </div>
      )}
    </>
  );
}

function EmployeeCardTile({ person, index }) {
  return (
    <Link
      to={`/employees/${person._id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ '--stagger': index % 9 }}
    >
      <Card
        hoverable
        className={cn(
          'animate-fade-up stagger h-full transition-colors group-hover:border-primary/40',
          !person.is_active && 'opacity-70'
        )}
      >
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3.5">
            <Avatar src={person.avatar_url} name={person.name} size="lg" ring />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold leading-snug">{person.name}</p>
                <PresenceDot
                  status={person.today_status}
                  className="mt-0.5 shrink-0"
                  title={
                    person.today_status === 'leave' && person.leave_type
                      ? `On ${labelizeEnum(person.leave_type)} leave`
                      : undefined
                  }
                />
              </div>

              <p className="truncate text-sm text-muted-foreground">
                {person.job_title || 'Role not set'}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {person.department && (
                  <Badge variant="subtle" className="font-normal">
                    {person.department}
                  </Badge>
                )}
                {person.role === 'admin' && <Badge variant="accent">HR</Badge>}
                {!person.is_active && <Badge variant="outline">Inactive</Badge>}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border/60 pt-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{person.email_id}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{person.phone || '—'}</span>
            </p>
            <p className="flex items-center gap-2 font-mono text-xs">
              <span className="grid size-3.5 shrink-0 place-items-center text-[0.6rem] font-semibold">
                ID
              </span>
              <span className="truncate">{person.login_id}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3.5">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2 border-t border-border/60 pt-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
