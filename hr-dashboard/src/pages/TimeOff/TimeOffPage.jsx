import { useEffect, useState } from 'react';
import { Plus, CalendarClock, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import TimeOffRequestModal from '../../components/TimeOff/TimeOffRequestModal';
import { formatDate } from '../../utils/formatters';
import { TIME_OFF_STATUS_LABEL } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import * as timeOffService from '../../services/timeOffService';

const STATUS_STYLE = {
  pending: { badge: 'bg-[var(--color-status-absent-soft)] text-[var(--color-status-absent)]', Icon: Clock3 },
  approved: { badge: 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]', Icon: CheckCircle2 },
  rejected: { badge: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]', Icon: XCircle },
};

export default function TimeOffPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    timeOffService
      .getTimeOffRequests(user.id)
      .then((data) => setRequests(data))
      .catch(() => setError('We ran into a problem loading your time-off requests.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadRequests, [user]);

  const handleSubmit = async (form) => {
    setIsSubmitting(true);
    try {
      await timeOffService.createTimeOffRequest({ ...form, employeeId: user.id, appliedOn: new Date().toISOString().slice(0, 10) });
      toast.success('Time-off request submitted.');
      setIsModalOpen(false);
      loadRequests();
    } catch {
      toast.error('Unable to submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Time Off</h1>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">View and request time off.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
          <Plus size={16} />
          Request Time Off
        </Button>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={loadRequests} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No time-off requests yet."
          action={
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              Request Time Off
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => {
            const { badge, Icon } = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
            return (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-ink)]">{r.type}</p>
                    <span className="font-mono text-xs text-[var(--color-ink-faint)]">{r.id}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
                    {formatDate(r.startDate)} — {formatDate(r.endDate)}
                  </p>
                  {r.reason && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{r.reason}</p>}
                </div>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${badge}`}>
                  <Icon size={13} />
                  {TIME_OFF_STATUS_LABEL[r.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {isModalOpen && (
        <TimeOffRequestModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
