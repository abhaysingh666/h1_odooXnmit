import { Plane } from 'lucide-react';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABEL } from '../../utils/constants';

export default function StatusIndicator({ status, size = 'md' }) {
  const label = ATTENDANCE_STATUS_LABEL[status] || 'Unknown';
  const dim = size === 'sm' ? 8 : 10;

  if (status === ATTENDANCE_STATUS.LEAVE) {
    return (
      <span
        className="group relative flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-status-leave-soft)] text-[var(--color-status-leave)]"
        title={label}
      >
        <Plane size={13} strokeWidth={2.4} />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  const color =
    status === ATTENDANCE_STATUS.PRESENT ? 'var(--color-status-present)' : 'var(--color-status-absent)';

  return (
    <span className="group relative flex h-6 w-6 items-center justify-center" title={label}>
      <span
        className={`rounded-full ${status === ATTENDANCE_STATUS.PRESENT ? 'status-pulse' : ''}`}
        style={{ width: dim, height: dim, backgroundColor: color }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
