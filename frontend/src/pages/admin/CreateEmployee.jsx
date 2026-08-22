import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  Info,
  Link2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/services/api';
import { addToRoster } from '@/lib/roster';
import { copyText, errorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { CopyField } from '@/components/ui/CopyField';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Label';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const EMPTY = {
  name: '',
  email_id: '',
  phone: '',
  date_of_joining: '',
  role: 'employee',
};

const today = () => new Date().toISOString().slice(0, 10);

export default function CreateEmployee() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  // Mirror the backend validators so the form fails fast and locally.
  const validation = useMemo(() => {
    const issues = {};
    const name = form.name.trim();
    const phoneDigits = form.phone.replace(/[\s\-()]/g, '');

    if (name && name.length < 2) issues.name = 'Name must be at least 2 characters.';
    if (form.email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email_id)) {
      issues.email_id = 'Enter a valid email address.';
    }
    if (phoneDigits && !/^\+?[0-9]{10,15}$/.test(phoneDigits)) {
      issues.phone = 'Use 10–15 digits, optionally starting with +.';
    }
    if (form.date_of_joining && form.date_of_joining > today()) {
      issues.date_of_joining = 'Joining date cannot be in the future.';
    }
    return issues;
  }, [form]);

  const complete =
    form.name.trim().length >= 2 && form.email_id.length > 0 && form.phone.length > 0;
  const canSubmit = complete && Object.keys(validation).length === 0 && !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    try {
      // company_name / company_logo_url are intentionally omitted — the backend
      // takes the employer from the authenticated admin's own record.
      const payload = {
        name: form.name.trim(),
        email_id: form.email_id.trim(),
        phone: form.phone.replace(/[\s\-()]/g, ''),
        role: form.role,
      };
      if (form.date_of_joining) payload.date_of_joining = form.date_of_joining;

      const { data } = await adminAPI.createEmployee(payload);

      setResult({ ...data, name: payload.name, email_id: payload.email_id, role: payload.role });

      // Remember the account locally so the admin can find the Login ID and
      // re-copy the registration link later. The temporary password is NOT
      // stored — it is shown once, here.
      addToRoster({
        loginId: data.login_id,
        name: payload.name,
        email: payload.email_id,
        phone: payload.phone,
        role: payload.role,
        dateOfJoining: form.date_of_joining || null,
        registrationLink: data.registration_link,
      });

      setForm(EMPTY);
      toast.success('Employee created', `${payload.name} · ${data.login_id}`);
    } catch (err) {
      setError(errorMessage(err, 'Could not create this employee.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={UserPlus}
        title="Add employee"
        description="Dayflow generates the Login ID and a temporary password, plus a 7-day registration link you share with the new hire."
        actions={
          <Button variant="outline" onClick={() => navigate('/admin/employees')}>
            View employees
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Employee details</CardTitle>
            <CardDescription>
              Everything marked required feeds the generated Login ID or the employee's sign-in.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-5">
              <Field
                label="Full name"
                htmlFor="name"
                required
                hint="Initials feed the Login ID"
                error={validation.name}
              >
                <Input
                  id="name"
                  name="name"
                  icon={User}
                  placeholder="Infamous Wolverine"
                  autoComplete="off"
                  value={form.name}
                  onChange={update('name')}
                  invalid={!!validation.name}
                  disabled={loading}
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" htmlFor="email_id" required error={validation.email_id}>
                  <Input
                    id="email_id"
                    name="email_id"
                    type="email"
                    icon={Mail}
                    placeholder="infamous@odoo.com"
                    autoComplete="off"
                    value={form.email_id}
                    onChange={update('email_id')}
                    invalid={!!validation.email_id}
                    disabled={loading}
                    required
                  />
                </Field>

                <Field label="Phone" htmlFor="phone" required error={validation.phone}>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    icon={Phone}
                    placeholder="+919876543210"
                    autoComplete="off"
                    value={form.phone}
                    onChange={update('phone')}
                    invalid={!!validation.phone}
                    disabled={loading}
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Date of joining"
                  htmlFor="date_of_joining"
                  hint="Optional — defaults to today"
                  error={validation.date_of_joining}
                >
                  <Input
                    id="date_of_joining"
                    name="date_of_joining"
                    type="date"
                    icon={CalendarDays}
                    max={today()}
                    value={form.date_of_joining}
                    onChange={update('date_of_joining')}
                    invalid={!!validation.date_of_joining}
                    disabled={loading}
                  />
                </Field>

                <Field label="Role" htmlFor="role" required hint="Determines access">
                  <Select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={update('role')}
                    disabled={loading}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Administrator</option>
                  </Select>
                </Field>
              </div>

              {form.role === 'admin' && (
                <Alert tone="warning" title="Creating another administrator" icon={ShieldCheck}>
                  Administrators can create accounts, promote others and see every generated
                  credential for your company.
                </Alert>
              )}

              {error && (
                <Alert tone="error" title="Could not create employee">
                  {error}
                </Alert>
              )}
            </CardContent>

            <CardFooter className="justify-end border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(EMPTY);
                  setError('');
                }}
                disabled={loading}
              >
                Reset
              </Button>
              <Button type="submit" loading={loading} disabled={!canSubmit}>
                {loading ? 'Generating credentials…' : 'Create employee'}
                {!loading && <Sparkles />}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Context rail */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Employer</CardTitle>
              <CardDescription className="text-xs">
                Taken from your own account — not editable here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/35 p-3">
                <Avatar
                  src={user?.company_logo_url}
                  name={user?.company_name}
                  size="default"
                  className="rounded-md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.company_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Created by {user?.name}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Every employee you create shares this company name, so all your Login IDs share the
                same prefix.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="size-3.5 text-primary" aria-hidden="true" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  'A Login ID is reserved for your company and the joining year.',
                  'A temporary password is generated — shown once, so copy it.',
                  'A registration link valid for 7 days is created.',
                  'You share both with the employee; they set their own password.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-2.5 text-xs leading-relaxed">
                    <span className="grid size-4.5 size-[1.125rem] shrink-0 place-items-center rounded-full bg-primary/12 text-[0.625rem] font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <CredentialsDialog
        result={result}
        onClose={() => setResult(null)}
        onCreateAnother={() => setResult(null)}
        onViewAll={() => {
          setResult(null);
          navigate('/admin/employees');
        }}
      />
    </>
  );
}

/**
 * Shown once per created employee. The temporary password is only ever
 * available here — it is never persisted client-side and the API won't return
 * it again.
 */
function CredentialsDialog({ result, onClose, onCreateAnother, onViewAll }) {
  const toast = useToast();
  const [acknowledged, setAcknowledged] = useState(false);

  if (!result) return null;

  const summary = [
    `Employee: ${result.name}`,
    `Login ID: ${result.login_id}`,
    `Temporary password: ${result.temp_password}`,
    `Registration link: ${result.registration_link}`,
    '',
    'This link expires in 7 days. Set your own password to activate the account.',
  ].join('\n');

  const handleCopyAll = async () => {
    const ok = await copyText(summary);
    if (ok) {
      setAcknowledged(true);
      toast.success('Credentials copied', 'Paste them into your message to the employee.');
    } else {
      toast.error('Copy failed', 'Select the fields and copy them manually.');
    }
  };

  return (
    <Dialog
      open={!!result}
      onClose={onClose}
      size="lg"
      title="Credentials generated"
      description={`Share these with ${result.name} now — the temporary password cannot be retrieved again.`}
      footer={
        <>
          <Button variant="outline" onClick={onViewAll}>
            View employees
          </Button>
          <Button variant="outline" onClick={onCreateAnother}>
            Create another
          </Button>
          <Button onClick={onClose} variant={acknowledged ? 'default' : 'secondary'}>
            <CheckCircle2 />
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Alert tone="warning" title="Shown only once" icon={TriangleAlert}>
          Dayflow stores only the hash of this password. If you close this dialog without copying
          it, you'll need to create the account again.
        </Alert>

        <div className="space-y-4">
          <CopyField label="Login ID" value={result.login_id} />
          <CopyField label="Temporary password" value={result.temp_password} />
          <CopyField
            label="Registration link"
            value={result.registration_link}
            hint="Expires in 7 days"
            truncate={false}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <p className="flex items-center gap-2 text-xs font-medium">
              <Link2 className="size-3.5 text-primary" aria-hidden="true" />
              Copy everything at once
            </p>
            <p className="text-xs text-muted-foreground">
              Grabs the ID, password and link as a ready-to-send message.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopyAll} className="shrink-0">
            Copy all details
          </Button>
        </div>

        <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border p-4 text-xs sm:grid-cols-2">
          <Row icon={User} label="Name" value={result.name} />
          <Row icon={AtSign} label="Email" value={result.email_id} />
          <Row icon={ShieldCheck} label="Role" value={result.role === 'admin' ? 'Administrator' : 'Employee'} />
          <Row icon={Building2} label="Status" value="Awaiting activation" />
        </dl>
      </div>
    </Dialog>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 sm:justify-start">
      <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="min-w-0 truncate font-medium sm:ml-auto">{value}</dd>
    </div>
  );
}
