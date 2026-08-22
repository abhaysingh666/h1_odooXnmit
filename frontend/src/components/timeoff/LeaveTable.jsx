import { Check, CircleSlash, Paperclip, Plane, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn, relativeTime } from '@/lib/utils';
import { leaveStatus, leaveType, plainDate } from '@/lib/hrms';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { EmptyState } from '@/components/PageHeader';

/**
 * The time-off table. HR sees the whole company with Approve/Reject on every
 * pending row; an employee sees only their own requests and can withdraw the
 * ones that have not been decided yet.
 */
export function LeaveTable({
  requests,
  loading,
  showEmployee = false,
  onReview,
  onCancel,
  busyId,
  emptyTitle = 'No requests yet',
  emptyDescription,
}) {
  const columns = showEmployee ? 7 : 6;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showEmployee && <TableHead>Name</TableHead>}
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Time off Type</TableHead>
          <TableHead className="text-right">Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 5 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((__, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : !requests?.length ? (
          <TableRow>
            <TableCell colSpan={columns} className="p-0">
              <EmptyState icon={Plane} title={emptyTitle} description={emptyDescription} />
            </TableCell>
          </TableRow>
        ) : (
          requests.map((request) => {
            const type = leaveType(request.leave_type);
            const status = leaveStatus(request.status);
            const busy = busyId === request._id;

            return (
              <TableRow key={request._id}>
                {showEmployee && (
                  <TableCell>
                    <Link
                      to={`/employees/${request.employee_id}`}
                      className="flex items-center gap-3 hover:text-primary"
                    >
                      <Avatar
                        src={request.employee_avatar_url}
                        name={request.employee_name}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {request.employee_name}
                        </span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {request.employee_login_id}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">{plainDate(request.start_date)}</TableCell>
                <TableCell className="whitespace-nowrap">{plainDate(request.end_date)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Badge variant={type.badge}>{type.label}</Badge>
                    {request.attachment_url && (
                      <a
                        href={request.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        title="View attachment"
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Paperclip className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">View attachment</span>
                      </a>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {request.days}
                  {request.half_day && (
                    <span className="ml-1 text-xs text-muted-foreground">½</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="space-y-1">
                    <Badge variant={status.badge}>{status.label}</Badge>
                    {request.reviewer_name && (
                      <span className="block text-xs text-muted-foreground">
                        by {request.reviewer_name} · {relativeTime(request.reviewed_at)}
                      </span>
                    )}
                    {request.review_comment && (
                      <span className="block max-w-56 truncate text-xs italic text-muted-foreground">
                        “{request.review_comment}”
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onReview && request.status === 'pending' && (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => onReview(request, 'reject')}
                        >
                          <X />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => onReview(request, 'approve')}
                          className={cn(
                            'bg-chart-3 text-white shadow-sm',
                            'hover:bg-[color-mix(in_oklab,var(--chart-3)_88%,black)]'
                          )}
                        >
                          <Check />
                          Approve
                        </Button>
                      </>
                    )}
                    {onCancel && request.can_cancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busy}
                        onClick={() => onCancel(request)}
                      >
                        <CircleSlash />
                        Withdraw
                      </Button>
                    )}
                    {!request.can_cancel && request.status !== 'pending' && !onReview && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
