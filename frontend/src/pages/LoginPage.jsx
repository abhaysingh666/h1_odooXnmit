import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AtSign,
  BadgeCheck,
  Fingerprint,
  KeyRound,
  LogIn,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/utils';
import { AuthHeading, AuthLayout } from '@/components/layout/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { cn } from "../lib/utils";

const HIGHLIGHTS = [
  {
    icon: Fingerprint,
    title: 'Deterministic Login IDs',
    description:
      'Each account gets an ID built from your company, name and joining year — unique per company, per year.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-scoped access',
    description:
      'Administrators provision accounts and manage roles. Employees only ever see their own workspace.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified onboarding',
    description:
      'Temporary credentials expire in seven days and must be replaced before the app unlocks.',
  },
];

export default function LoginPage() {
  const [form, setForm] = useState({ login_id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const next = params.get('next');

  useEffect(() => {
    if (params.get('expired')) {
      setNotice('Your session expired. Please sign in again.');
    } else if (params.get('registered')) {
      setNotice('Registration complete. Sign in with your new password.');
    }
  }, [params]);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({
        login_id: form.login_id.trim(),
        password: form.password,
      });

      // A first-login user still holds the password their admin generated —
      // the route guard will hold them at /change-password until it's replaced.
      if (user.is_first_login) {
        navigate('/change-password', { replace: true, state: { forced: true } });
        return;
      }

      const home = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      navigate(next && next.startsWith('/') ? next : home, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      panelTitle="Every workday, perfectly aligned."
      panelSubtitle="Sign in to manage onboarding, credentials and access for your team — all in one place."
      highlights={HIGHLIGHTS}
      footer={
        <p className={cn('text-xs', 'text-muted-foreground')}>
          First run and no admin yet?{' '}
          <Link
            to="/setup"
            className={cn('font-medium', 'text-primary', 'underline-offset-4', 'transition-colors', 'hover:underline')}
          >
            Create the first administrator
          </Link>
        </p>
      }
    >
      <AuthHeading
        icon={LogIn}
        title="Welcome back"
        description="Use the Login ID your administrator issued, or the email on your account."
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Login ID or email" htmlFor="login_id" required>
          <Input
            id="login_id"
            name="login_id"
            icon={AtSign}
            autoComplete="username"
            autoFocus
            placeholder="OIINWO20220001"
            value={form.login_id}
            onChange={update('login_id')}
            invalid={!!error}
            disabled={loading}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <PasswordInput
            id="password"
            name="password"
            icon={KeyRound}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            onChange={update('password')}
            invalid={!!error}
            disabled={loading}
            required
          />
        </Field>

        {notice && !error && (
          <Alert tone="info" onDismiss={() => setNotice('')}>
            {notice}
          </Alert>
        )}

        {error && <Alert tone="error" title="Could not sign you in">{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <LogIn />}
        </Button>
      </form>

      <div className={cn('mt-7', 'space-y-3', 'rounded-lg', 'border', 'border-border', 'bg-muted/35', 'p-4')}>
        <p className={cn('flex', 'items-center', 'gap-2', 'text-xs', 'font-medium')}>
          <Sparkles className={cn('size-3.5', 'text-primary')} aria-hidden="true" />
          Where does my Login ID come from?
        </p>
        <p className={cn('text-xs', 'leading-relaxed', 'text-muted-foreground')}>
          It is generated when your account is created — company initials, your initials, joining
          year and a serial number, for example{' '}
          <code className={cn('rounded', 'bg-card', 'px-1.5', 'py-0.5', 'font-mono', 'text-[0.6875rem]')}>
            OIINWO20220001
          </code>
          . Lost it? Ask your HR administrator; you can also sign in with your email address.
        </p>
      </div>
    </AuthLayout>
  );
}
