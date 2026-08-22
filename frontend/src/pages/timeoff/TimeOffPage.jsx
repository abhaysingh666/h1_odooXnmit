import { useCallback, useEffect, useState } from 'react';
import { Calendar, CalendarDays, CircleDot, Plane, Plus, RefreshCw } from 'lucide-react';

import { leaveAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn, errorMessage } from '@/lib/utils';
import { monthLabel, recentMonths } from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { EmptyState, PageHeader, StatCard } from '@/components/PageHeader';
import { LeaveCalendar } from '@/components/timeoff/LeaveCalendar';
import { LeaveRequestDialog } from '@/components/timeoff/LeaveRequestDialog';
import { LeaveReviewDialog } from '@/components/timeoff/LeaveReviewDialog';
import { LeaveTable } from '@/components/timeoff/LeaveTable';

/**
 * Time off management.
 *
 * Employees see their own requests + the company calendar to avoid collisions;
 * admins additionally get the review queue where pending requests are approved
 * or rejected with a comment.
 */
export default function TimeOffPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('my-requests');
  const [year, setYear] = useState(new Date().getFullYear());
  const [bumped, setBumped] = useState(0);

  const [myRequests, setMyRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [calendarData, setCalendarData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(null);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      try {
        const [mine, bal, cal] = await Promise.all([
          leaveAPI.mine({ year }),
          leaveAPI.balance({ year }),
          leaveAPI.calendar({ year }),
        ]);

        setMyRequests(mine.data);
        setBalance(bal.data);
        setCalendarData(cal.data);
        setError('');

        if (isAdmin) {
          const { data: pending } = await leaveAPI.list({ status: 'pending' });
          setPendingRequests(pending);
        }
      } catch (err) {
        setError(errorMessage(err, 'Could not load time-off data.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [year, isAdmin]
  );

  useEffect(() => {
    load();
  }, [load, bumped]);

  const handleCreateSuccess = () => {
    setCreateOpen(false);
    setBumped((n) => n + 1);
  };

  const handleReviewSuccess = () => {
    setReviewOpen(false);
    setReviewRequest(null);
    setBumped((n) => n + 1);
  };

  const openReview = (request) => {
    setReviewRequest(request);
    setReviewOpen(true);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <>
      <PageHeader
        title="Time Off"
        description={
          isAdmin
            ? 'Your own requests and balance, plus the approval queue and company calendar.'
            : 'Apply for time off, check your balance, and see when colleagues are away.'
        }
        icon={Plane}
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => load({ quiet: true })}
              disabled={refreshing}
              aria-label="Refresh"
            >
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} aria-hidden="true" />
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Request time off
            </Button>
          </>
        }
      />

      {balance && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Paid time off"
            value={balance.paid?.available ?? 0}
            hint={`${balance.paid?.used ?? 0} used, ${balance.paid?.pending ?? 0} pending`}
            icon={Calendar}
            tone="primary"
          />
          <StatCard
            label="Sick leave"
            value={balance.sick?.available ?? 0}
            hint={`${balance.sick?.used ?? 0} used, ${balance.sick?.pending ?? 0} pending`}
            icon={CircleDot}
            tone="accent"
            style={{ '--i': 1 }}
          />
          <StatCard
            label="Unpaid leave"
            value="Unlimited"
            hint={`${balance.unpaid?.used ?? 0} used, ${balance.unpaid?.pending ?? 0} pending`}
            icon={CalendarDays}
            tone="muted"
            style={{ '--i': 2 }}
          />
          {isAdmin && (
            <StatCard
              label="Pending reviews"
              value={pendingRequests.length}
              hint="Awaiting approval"
              icon={Plane}
              tone="warning"
              style={{ '--i': 3 }}
            />
          )}
        </div>
      )}

      {error && <Alert tone="error" title="Could not load time off">{error}</Alert>}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Year</h2>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          {isAdmin && <TabsTrigger value="review">Review Queue</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-requests">
          {loading ? (
            <TableSkeleton />
          ) : myRequests.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No time-off requests yet"
              description="Request time off and track your balance for the year."
              actionLabel="Request time off"
              onAction={() => setCreateOpen(true)}
            />
          ) : (
            <LeaveTable requests={myRequests} onReview={isAdmin ? openReview : undefined} />
          )}
        </TabsContent>

        <TabsContent value="calendar">
          {loading ? (
            <Skeleton className="h-96" />
          ) : (
            <LeaveCalendar data={calendarData} year={year} />
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="review">
            {loading ? (
              <TableSkeleton />
            ) : pendingRequests.length === 0 ? (
              <EmptyState
                icon={Plane}
                title="No pending requests"
                description="All time-off requests have been reviewed."
              />
            ) : (
              <LeaveTable requests={pendingRequests} onReview={openReview} />
            )}
          </TabsContent>
        )}
      </Tabs>

      <LeaveRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {reviewRequest && (
        <LeaveReviewDialog
          open={reviewOpen}
          onClose={() => {
            setReviewOpen(false);
            setReviewRequest(null);
          }}
          request={reviewRequest}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
