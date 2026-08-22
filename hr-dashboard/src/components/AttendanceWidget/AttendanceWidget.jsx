import { useEffect, useState } from 'react';
import { LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import * as attendanceService from '../../services/attendanceService';

function formatHHMM(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function AttendanceWidget() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    attendanceService.getTodayAttendance(user.id).then((r) => {
      if (mounted) {
        setRecord(r);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return null;

  const hasCheckedIn = Boolean(record?.checkIn);
  const hasCheckedOut = Boolean(record?.checkOut);

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const updated = await attendanceService.checkIn(user.id);
      setRecord(updated);
      updateUser({ status: 'present' });
      toast.success(`Successfully checked in at ${formatHHMM(updated.checkIn)}.`);
    } catch {
      toast.error('Unable to check in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const updated = await attendanceService.checkOut(user.id);
      setRecord(updated);
      toast.success(`Successfully checked out at ${formatHHMM(updated.checkOut)}.`);
    } catch {
      toast.error('Unable to check out. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            hasCheckedOut
              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
              : hasCheckedIn
              ? 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]'
              : 'bg-[var(--color-surface-2)] text-[var(--color-ink-faint)]'
          }`}
        >
          {hasCheckedOut ? <CheckCircle2 size={18} /> : hasCheckedIn ? <LogOut size={18} /> : <LogIn size={18} />}
        </span>
        <div>
          {isLoading ? (
            <div className="skeleton h-4 w-40 rounded" />
          ) : (
            <>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {hasCheckedOut ? 'Attendance Completed' : hasCheckedIn ? 'Status: Present' : 'Status: Not Checked In'}
              </p>
              <p className="mt-0.5 font-mono text-xs text-[var(--color-ink-soft)]">
                {hasCheckedOut
                  ? `Check-in ${formatHHMM(record.checkIn)} · Check-out ${formatHHMM(record.checkOut)}`
                  : hasCheckedIn
                  ? `Since ${formatHHMM(record.checkIn)}`
                  : 'Mark your attendance for today'}
              </p>
            </>
          )}
        </div>
      </div>

      {!isLoading && !hasCheckedOut && (
        <Button
          variant={hasCheckedIn ? 'outline' : 'secondary'}
          isLoading={isSubmitting}
          onClick={hasCheckedIn ? handleCheckOut : handleCheckIn}
          className="sm:w-auto"
        >
          {hasCheckedIn ? 'Check Out' : 'Check In'}
        </Button>
      )}
    </div>
  );
}
