import { ShieldCheck, KeyRound } from 'lucide-react';
import { InfoSection, InfoItem } from '../InfoSection';
import Button from '../../../components/ui/Button';

export default function SecurityTab({ employee }) {
  return (
    <div className="flex flex-col gap-5">
      <InfoSection title="Account">
        <InfoItem label="Login ID" value={employee.id} mono />
        <InfoItem label="Account Status" value={employee.employmentStatus} />
      </InfoSection>

      <section className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <KeyRound size={18} />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">Password</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Password management is not available yet.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          Change Password
        </Button>
      </section>

      <section className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">Two-Factor Authentication</p>
          <p className="text-xs text-[var(--color-ink-faint)]">Coming soon.</p>
        </div>
      </section>
    </div>
  );
}
