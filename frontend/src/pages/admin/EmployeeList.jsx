import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Ellipsis,
  Eraser,
  HardDrive,
  Link2,
  Mail,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { clearRoster, getRoster, removeFromRoster, tokenDaysLeft } from '@/lib/roster';
import { copyText, formatDate, relativeTime } from '@/lib/utils';
import { EmptyState, PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Input, Select } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';

const FILTERS = [
  { value: 'all', label: 'All accounts' },
  { value: 'employee', label: 'Employees only' },
  { value: 'admin', label: 'Administrators only' },
  { value: 'live', label: 'Invitation still valid' },
  { value: 'expired', label: 'Invitation expired' },
];

export default function EmployeeList() {
  const [roster, setRoster] = useState(() => getRoster());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [clearing, setClearing] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return roster.filter((entry) => {
      const days = tokenDaysLeft(entry.createdAt);

      if (filter === 'admin' && entry.role !== 'admin') return false;
      if (filter === 'employee' && entry.role !== 'employee') return false;
      if (filter === 'live' && days <= 0) return false;
      if (filter === 'expired' && days > 0) return false;

      if (!needle) return true;
      return [entry.name, entry.email, entry.loginId, entry.phone]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [roster, query, filter]);

  const copy = async (value, label) => {
    const ok = await copyText(value);
    if (ok) toast.success(`${label} copied`);
    else toast.error('Copy failed', 'Your browser blocked clipboard access.');
  };

  const handleRemove = () => {
    setRoster(removeFromRoster(pendingRemoval.loginId));
    toast.info('Removed from this list', 'The account itself still exists on the server.');
    setPendingRemoval(null);
  };

  const handleClear = () => {
    setRoster(clearRoster());
    setClearing(false);
    toast.info('Local list cleared', 'No accounts were deleted.');
  };

  return (
    <>
      <PageHeader
        icon={Users}
        title="Employees"
        description="Accounts you provisioned from this browser, with their Login IDs and invitation status."
        actions={
          <>
            {roster.length > 0 && (
              <Button variant="outline" onClick={() => setClearing(true)}>
                <Eraser />
                Clear list
              </Button>
            )}
            <Button onClick={() => navigate('/admin/employees/create')}>
              <UserPlus />
              Add employee
            </Button>
          </>
        }
      />

      <Alert tone="info" title="This list lives on this device" icon={HardDrive}>
        The authentication API exposes account creation but no directory endpoint, so Dayflow keeps a
        local record of what you created here. Signing in from another browser will show an empty
        list — the accounts themselves are unaffected.
      </Alert>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>
              {rows.length} of {roster.length} account{roster.length === 1 ? '' : 's'}
            </CardTitle>
            <CardDescription>Search by name, email, phone or Login ID.</CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              icon={Search}
              placeholder="Search accounts…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:w-56"
              aria-label="Search accounts"
            />
            <Select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="sm:w-48"
              aria-label="Filter accounts"
            >
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {roster.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No accounts created here yet"
              description="Once you provision an employee, their Login ID and invitation link show up in this table."
              actionLabel="Add your first employee"
              onAction={() => navigate('/admin/employees/create')}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description="Nothing here matches that search or filter. Try a different Login ID or clear the filter."
            >
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
              >
                Reset filters
              </Button>
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Employee</TableHead>
                  <TableHead>Login ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Invitation</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((entry, index) => {
                  const days = tokenDaysLeft(entry.createdAt);
                  return (
                    <TableRow
                      key={entry.loginId}
                      className="animate-fade-up stagger"
                      style={{ '--i': index }}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={entry.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{entry.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <button
                          type="button"
                          onClick={() => copy(entry.loginId, 'Login ID')}
                          className="group flex items-center gap-1.5 rounded font-mono text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          title="Copy Login ID"
                        >
                          {entry.loginId}
                          <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      </TableCell>

                      <TableCell>
                        {entry.role === 'admin' ? (
                          <Badge variant="subtle">
                            <ShieldCheck />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">Employee</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <p className="text-sm">{formatDate(entry.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {relativeTime(entry.createdAt)}
                        </p>
                      </TableCell>

                      <TableCell>
                        {days > 0 ? (
                          <Badge variant={days <= 2 ? 'warning' : 'success'}>
                            {days} day{days === 1 ? '' : 's'} left
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <DropdownMenu className="inline-block">
                          <DropdownMenuTrigger
                            className="inline-grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            aria-label={`Actions for ${entry.name}`}
                          >
                            <Ellipsis className="size-4" />
                          </DropdownMenuTrigger>

                          <DropdownMenuContent>
                            <DropdownMenuItem
                              icon={Copy}
                              onSelect={() => copy(entry.loginId, 'Login ID')}
                            >
                              Copy Login ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              icon={Link2}
                              disabled={!entry.registrationLink}
                              onSelect={() => copy(entry.registrationLink, 'Registration link')}
                            >
                              Copy invitation link
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={Mail} onSelect={() => copy(entry.email, 'Email')}>
                              Copy email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              icon={Trash2}
                              destructive
                              onSelect={() => setPendingRemoval(entry)}
                            >
                              Remove from list
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingRemoval}
        onClose={() => setPendingRemoval(null)}
        onConfirm={handleRemove}
        title="Remove from this list?"
        description={`${pendingRemoval?.name ?? 'This entry'} disappears from your local record. Their account and Login ID keep working — only your copy of the invitation link is lost.`}
        confirmLabel="Remove entry"
      />

      <ConfirmDialog
        open={clearing}
        onClose={() => setClearing(false)}
        onConfirm={handleClear}
        title="Clear the local list?"
        description="Every entry stored in this browser is forgotten, including saved invitation links. No accounts are deleted on the server."
        confirmLabel="Clear list"
      />
    </>
  );
}
