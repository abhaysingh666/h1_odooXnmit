import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, XCircle, Plus, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import FormField, { inputClasses } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import * as timeOffService from '../../services/timeOffService';

const STATUS_STYLE = {
  pending: { badge: 'bg-[var(--color-status-absent-soft)] text-[var(--color-status-absent)]', Icon: Clock3 },
  approved: { badge: 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]', Icon: CheckCircle2 },
  rejected: { badge: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]', Icon: XCircle },
};

export default function Leave() {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ type: 'paid', startDate: '', endDate: '', reason: '' });
  
  const loadRequests = () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    timeOffService
      .getTimeOffRequests(user.id)
      .then((data) => setRequests(data))
      .catch(() => setError('Failed to load your leave history.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadRequests, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await timeOffService.createTimeOffRequest({
        employeeId: user.id,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason
      });
      toast.success('Leave application submitted successfully.');
      setShowForm(false);
      setForm({ type: 'paid', startDate: '', endDate: '', reason: '' });
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to submit leave request. Overlapping requests are not allowed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate leave summary balances
  const balances = {
    paid: { used: 0, max: 15 },
    sick: { used: 0, max: 8 },
    unpaid: { used: 0 }
  };
  
  requests.forEach(r => {
    if (r.status === 'approved') {
      if (r.type === 'paid') balances.paid.used += r.totalDays || 0;
      else if (r.type === 'sick') balances.sick.used += r.totalDays || 0;
      else if (r.type === 'unpaid') balances.unpaid.used += r.totalDays || 0;
    }
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Leave Management</h1>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Apply for time off and view leave history.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="shrink-0">
            <Plus size={16} />
            Apply for Leave
          </Button>
        )}
      </div>

      {/* Leave Balance Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Paid Leaves</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--color-primary)]">{balances.paid.max - balances.paid.used}</span>
            <span className="text-sm text-[var(--color-ink-soft)]">days remaining</span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Total limit: {balances.paid.max} days | Used: {balances.paid.used} days</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Sick Leaves</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--color-accent)]">{balances.sick.max - balances.sick.used}</span>
            <span className="text-sm text-[var(--color-ink-soft)]">days remaining</span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Total limit: {balances.sick.max} days | Used: {balances.sick.used} days</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Unpaid Leaves</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--color-danger)]">{balances.unpaid.used}</span>
            <span className="text-sm text-[var(--color-ink-soft)]">days taken</span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">No explicit limit defined for unpaid leaves.</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-card)] flex flex-col gap-4 max-w-xl animate-pop-in">
          <h2 className="font-semibold text-lg text-[var(--color-ink)]">Leave Application Form</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Leave Type" htmlFor="type" required>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                className={inputClasses(false)}
              >
                <option value="paid">Paid Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </FormField>
            <FormField label="Start Date" htmlFor="startDate" required>
              <input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={inputClasses(false)}
                required
              />
            </FormField>
            <FormField label="End Date" htmlFor="endDate" required>
              <input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                className={inputClasses(false)}
                required
              />
            </FormField>
          </div>
          
          <FormField label="Remarks / Reason" htmlFor="reason" required>
            <textarea
              id="reason"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Provide a reason for leave application..."
              className={`${inputClasses(false)} py-2`}
              required
            />
          </FormField>
          
          <div className="flex items-center justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Apply Leave
            </Button>
          </div>
        </form>
      )}

      {/* History */}
      <div>
        <h2 className="font-semibold text-lg text-[var(--color-ink)] mb-3">Leave History</h2>
        
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
            title="No leave requests yet."
            description="You haven't requested any leaves. Click 'Apply for Leave' to get started."
          />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface-2)] font-medium text-[var(--color-ink-soft)]">
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5">Total Days</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Admin Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {requests.map((r) => {
                    const { badge, Icon } = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
                    return (
                      <tr key={r.id} className="hover:bg-[var(--color-surface-2)]/50">
                        <td className="px-6 py-4 font-medium text-[var(--color-ink)] capitalize">{r.type} Leave</td>
                        <td className="px-6 py-4 text-[var(--color-ink-soft)]">
                          {formatDate(r.startDate)} - {formatDate(r.endDate)}
                        </td>
                        <td className="px-6 py-4 font-mono text-[var(--color-ink)]">{r.totalDays}</td>
                        <td className="px-6 py-4 text-[var(--color-ink-soft)] truncate max-w-xs">{r.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>
                            <Icon size={12} />
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--color-ink-soft)]">{r.adminComments || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
