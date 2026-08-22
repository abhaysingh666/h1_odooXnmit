import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField, { inputClasses } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/employees';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(loginId, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white">
            <Building2 size={22} />
          </span>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Northgate HR</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">Sign in to your workspace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-card)]"
        >
          <FormField label="Login ID / Email" htmlFor="loginId" required>
            <input
              id="loginId"
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="OIJODO20220001"
              className={inputClasses(Boolean(error))}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" required>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClasses(Boolean(error))} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          {error && (
            <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
            Sign In
          </Button>

          <p className="text-center text-xs text-[var(--color-ink-faint)]">
            Any password works in this demo. Try <span className="font-medium">EMP008</span> for the Admin view, or
            leave the fields as-is for a regular employee.
          </p>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-ink-soft)]">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-[var(--color-primary)] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
