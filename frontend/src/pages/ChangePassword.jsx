import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage, passwordStrength } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Field } from '@/components/ui/Label';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { useToast } from '@/components/ui/Toast';

const EMPTY = { old_password: '', new_password: '', confirm_new_password: '' };

/**
 * Doubles as the forced first-login gate. When `mustChangePassword` is true the
 * route guard sends everyone here and there is no way back into the app until
 * the admin-issued temporary password has been replaced.
 */
export default function ChangePassword() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { changePassword, mustChangePassword, homePath, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const forced = mustChangePassword || location.state?.forced;

  const strength = useMemo(() => passwordStrength(form.new_password), [form.new_password]);
  const mismatch =
    form.confirm_new_password.length > 0 && form.confirm_new_password !== form.new_password;
  const reused =
    form.new_password.length > 0 && form.new_password === form.old_password;

  const canSubmit =
    form.old_password.length > 0 &&
    strength.valid &&
    !mismatch &&
    !reused &&
    form.confirm_new_password.length > 0;

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    try {
      await changePassword(form);
      setForm(EMPTY);

      toast.success(
        'Password updated',
        forced ? 'Your account is now fully activated.' : 'Use your new password next time you sign in.'
      );
      navigate(homePath, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not change your password.'));
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4 text-primary" aria-hidden="true" />
          {forced ? 'Choose your own password' : 'Change password'}
        </CardTitle>
        <CardDescription>
          {forced
            ? 'Your administrator can see the temporary password they generated for you. Replacing it is what marks your account verified.'
            : 'Enter your current password, then choose a new one.'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-5">
          {forced && (
            <Alert tone="warning" title="Action required" icon={ShieldAlert}>
              You are signed in with a temporary password. The rest of Dayflow stays locked until
              you set your own.
            </Alert>
          )}

          <Field
            label={forced ? 'Temporary password' : 'Current password'}
            htmlFor="old_password"
            required
            hint={forced ? 'The one HR gave you' : undefined}
          >
            <PasswordInput
              id="old_password"
              name="old_password"
              autoComplete="current-password"
              placeholder={forced ? 'Paste the temporary password' : 'Your current password'}
              autoFocus
              value={form.old_password}
              onChange={update('old_password')}
              disabled={loading}
              required
            />
          </Field>

          <div className="h-px bg-border" role="separator" />

          <Field
            label="New password"
            htmlFor="new_password"
            required
            error={reused ? 'Your new password must be different from the current one.' : undefined}
          >
            <PasswordInput
              id="new_password"
              name="new_password"
              autoComplete="new-password"
              placeholder="Choose a strong password"
              value={form.new_password}
              onChange={update('new_password')}
              invalid={reused}
              disabled={loading}
              required
            />
          </Field>

          <PasswordStrength value={form.new_password} />

          <Field
            label="Confirm new password"
            htmlFor="confirm_new_password"
            required
            error={mismatch ? 'Passwords do not match.' : undefined}
          >
            <PasswordInput
              id="confirm_new_password"
              name="confirm_new_password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={form.confirm_new_password}
              onChange={update('confirm_new_password')}
              invalid={mismatch}
              disabled={loading}
              required
            />
          </Field>

          {error && (
            <Alert tone="error" title="Could not update password">
              {error}
            </Alert>
          )}
        </CardContent>

        <CardFooter className="justify-end">
          {!forced && (
            <Button type="button" variant="outline" onClick={() => navigate(homePath)} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={loading} disabled={!canSubmit}>
            {loading ? 'Updating…' : 'Update password'}
            {!loading && <ShieldCheck />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );

  // When forced, the app shell is not rendered around this page — present it as
  // a standalone screen instead.
  if (forced) {
    return (
      <div className="min-h-dvh bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-xl animate-fade-up space-y-6">
          <PageHeader
            icon={KeyRound}
            title={`One more step, ${user?.name?.split(' ')[0] ?? 'there'}`}
            description="Set a password you control to finish activating your account."
          />
          {body}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        icon={KeyRound}
        title="Password"
        description="Keep your account secure. Passwords must be at least 8 characters with upper case, lower case and a number."
      />
      {body}
    </>
  );
}
