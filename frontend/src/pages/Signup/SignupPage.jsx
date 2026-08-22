import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Upload } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField, { inputClasses } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';

import * as authService from '../../services/authService';

export default function SignupPage() {
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', password: '', confirm: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await authService.register(form);
      toast.success('Account created. Sign in to continue.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white">
            <Building2 size={22} />
          </span>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Set up your workspace</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">For HR administrators creating a new company account.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-card)]"
        >
          <FormField label="Company Name" htmlFor="company" required>
            <div className="flex items-center gap-2">
              <input
                id="company"
                value={form.company}
                onChange={set('company')}
                required
                className={inputClasses(false)}
              />
              <button
                type="button"
                aria-label="Upload logo"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-line-strong)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Upload size={15} />
              </button>
            </div>
          </FormField>

          <FormField label="Your Name" htmlFor="name" required>
            <input id="name" value={form.name} onChange={set('name')} required className={inputClasses(false)} />
          </FormField>

          <FormField label="Email" htmlFor="email" required>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              className={inputClasses(false)}
            />
          </FormField>

          <FormField label="Phone" htmlFor="phone">
            <input id="phone" value={form.phone} onChange={set('phone')} className={inputClasses(false)} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Password" htmlFor="password" required>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                className={inputClasses(false)}
              />
            </FormField>
            <FormField label="Confirm Password" htmlFor="confirm" required>
              <input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                required
                className={inputClasses(false)}
              />
            </FormField>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
            Sign Up
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-ink-soft)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
