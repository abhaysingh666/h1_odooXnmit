import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-canvas)] px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-faint)]">
        <Compass size={26} />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Page Not Found</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">The page you're looking for doesn't exist.</p>
      </div>
      <Link to="/employees">
        <Button size="sm">Back to Employees</Button>
      </Link>
    </div>
  );
}
