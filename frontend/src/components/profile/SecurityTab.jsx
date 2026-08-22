import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ShieldAlert, ShieldCheck, UserCog, UserMinus, UserPlus } from 'lucide-react';

import { employeeAPI } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { plainDate } from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { CopyField } from '@/components/ui/CopyField';
import { Select } from '@/components/ui/Input';
import { DetailRow } from '@/components/PageHeader';
import { useToast } from '@/components/ui/Toast';

/**
 * Security tab: credentials for the employee themselves, and account controls
 * (role, activation) for HR. Passwords are only ever changed by their owner.
 */
export function SecurityTab({ detail, isSelf, canEditAll, onChanged }) {
  const { success, error: notifyError } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [role, setRole] = useState(detail.role);

  const isOwnAdminRecord = isSelf && canEditAll;

  async function toggleActive() {
    setBusy(true);
    try {
      const { data } = detail.is_active
        ? await employeeAPI.deactivate(detail._id)
        : await employeeAPI.activate(detail._id);
      success(detail.is_active ? 'Access revoked' : 'Access restored', data.message);
      setConfirming(false);
      onChanged?.();
    } catch (err) {
      notifyError('Could not update the account', errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveRole(nextRole) {
    setRole(nextRole);
    setBusy(true);
    try {
      await employeeAPI.update(detail._id, { role: nextRole });
      success(
        nextRole === 'admin' ? 'HR access granted' : 'HR access removed',
        `${detail.name} is now ${nextRole === 'admin' ? 'an HR officer' : 'a standard employee'}.`
      );
      onChanged?.();
    } catch (err) {
      setRole(detail.role);
      notifyError('Could not change the role', errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-primary" aria-hidden="true" />
            Credentials
          </CardTitle>
          <CardDescription>
            The Login ID is generated from the company, name and joining year — it never changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CopyField label="Login ID" value={detail.login_id} />
          <CopyField label="Work email" value={detail.email_id} mono={false} />

          <div className="divide-y divide-border/60">
            <DetailRow
              label="Account status"
              children={
                detail.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="destructive">Deactivated</Badge>
                )
              }
            />
            <DetailRow
              label="Password"
              children={
                detail.is_first_login ? (
                  <Badge variant="warning">Still the temporary one</Badge>
                ) : (
                  <Badge variant="subtle">Set by the employee</Badge>
                )
              }
            />
            <DetailRow label="Member since" value={plainDate(detail.created_at)} />
          </div>

          {isSelf ? (
            <Link
              to="/change-password"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <KeyRound className="size-4" aria-hidden="true" />
              Change my password
            </Link>
          ) : (
            <Alert tone="info" title="Passwords are private">
              Only {detail.name.split(' ')[0]} can change their own password. If they are locked out,
              deactivate and re-invite the account.
            </Alert>
          )}
        </CardContent>
      </Card>

      {canEditAll && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="size-4 text-primary" aria-hidden="true" />
              Access control
            </CardTitle>
            <CardDescription>What this account is allowed to do in Dayflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Role</span>
              <Select
                value={role}
                onChange={(event) => saveRole(event.target.value)}
                disabled={busy || isOwnAdminRecord}
              >
                <option value="employee">Employee — own profile, attendance and requests</option>
                <option value="admin">HR officer — full company access</option>
              </Select>
              <span className="block text-xs text-muted-foreground">
                {isOwnAdminRecord
                  ? 'You cannot remove your own HR access.'
                  : 'HR officers can see salaries, approve time off and edit every profile.'}
              </span>
            </label>

            <div className="rounded-lg border border-border/70 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                {detail.is_active ? (
                  <ShieldCheck className="size-4 text-chart-3" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
                )}
                {detail.is_active ? 'Account is active' : 'Account is deactivated'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Deactivating blocks sign-in and hides the card from the directory. Attendance, time
                off and payroll history are preserved.
              </p>

              <Button
                variant={detail.is_active ? 'destructive' : 'default'}
                size="sm"
                className="mt-3"
                onClick={() => setConfirming(true)}
                disabled={busy || isSelf}
              >
                {detail.is_active ? (
                  <>
                    <UserMinus className="size-4" aria-hidden="true" />
                    Deactivate account
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" aria-hidden="true" />
                    Reactivate account
                  </>
                )}
              </Button>
              {isSelf && (
                <p className="mt-2 text-xs text-muted-foreground">
                  You cannot deactivate your own account.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={toggleActive}
        loading={busy}
        title={detail.is_active ? `Deactivate ${detail.name}?` : `Reactivate ${detail.name}?`}
        description={
          detail.is_active
            ? 'They will be signed out and unable to log in. Their records stay intact and you can reactivate at any time.'
            : 'They will be able to sign in again with their existing credentials.'
        }
        confirmLabel={detail.is_active ? 'Deactivate' : 'Reactivate'}
        tone={detail.is_active ? 'destructive' : 'default'}
      />
    </div>
  );
}
