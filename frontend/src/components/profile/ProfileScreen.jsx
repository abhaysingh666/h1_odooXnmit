import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Eye,
  FileText,
  Lock,
  Pencil,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';

import { employeeAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn, errorMessage } from '@/lib/utils';
import { EMPLOYMENT_TYPES, toISODate } from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { PresenceBadge } from '@/components/PresenceIndicator';
import { FormRow, SelectRow, TextRow } from './FormRow';
import { PrivateInfoTab } from './PrivateInfoTab';
import { ResumeTab } from './ResumeTab';
import { SalaryTab } from './SalaryTab';
import { SecurityTab } from './SecurityTab';

/**
 * The profile screen behind both "My Profile" and any card in the directory.
 *
 * One component covers all three cases because the server already tells us what
 * the viewer may do (`can_edit`, `can_edit_all`, `can_view_salary`): the layout
 * never changes, only whether the controls are live.
 */
export function ProfileScreen({ employeeId, isSelf = false }) {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const { success, error: notifyError } = useToast();
  const fileInput = useRef(null);

  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState('');
  const [tab, setTab] = useState('resume');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  /** Adopt a fresh API document as both the display record and the form draft. */
  const absorb = useCallback((data) => {
    const seeded = seedForm(data);
    setDetail(data);
    setForm(seeded);
    setBaseline(JSON.stringify(seeded));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = isSelf ? await employeeAPI.me() : await employeeAPI.get(employeeId);
      absorb(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load this profile.'));
    } finally {
      setLoading(false);
    }
  }, [absorb, employeeId, isSelf]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => form && JSON.stringify(form) !== baseline, [form, baseline]);

  /** `setField('private.gender', 'male')` — dotted paths keep the tabs terse. */
  const setField = useCallback((path, value) => {
    setForm((current) => {
      const [head, tail] = path.split('.');
      if (!tail) return { ...current, [head]: value };
      return { ...current, [head]: { ...(current[head] ?? {}), [tail]: value } };
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const payload = buildProfilePayload(form, { admin: Boolean(detail.can_edit_all) });
      const { data } = isSelf
        ? await employeeAPI.updateMe(payload)
        : await employeeAPI.update(detail._id, payload);

      absorb(data);
      success('Profile updated', isSelf ? 'Your details are saved.' : `${data.name}’s details are saved.`);
      if (isSelf) refreshUser();
    } catch (err) {
      notifyError('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const { data } = isSelf
        ? await employeeAPI.uploadMyAvatar(file)
        : await employeeAPI.uploadAvatar(detail._id, file);
      absorb(data);
      success('Photo updated');
      if (isSelf) refreshUser();
    } catch (err) {
      notifyError('Upload failed', errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (!detail) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Alert tone="error" title="Profile unavailable">
          {error || 'This employee could not be found.'}
        </Alert>
      </>
    );
  }

  const canEdit = Boolean(detail.can_edit);
  const canEditAll = Boolean(detail.can_edit_all);
  const showSalary = Boolean(detail.can_view_salary);
  // An admin can reach their own record through the directory, so identity is by
  // id rather than by which route we came in on.
  const viewingSelf = isSelf || detail._id === user?._id;

  return (
    <>
      {error && (
        <Alert tone="error" title="Could not refresh" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {!isSelf && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            All employees
          </Button>
          {!canEdit && (
            <Badge variant="subtle" className="gap-1.5">
              <Eye className="size-3" aria-hidden="true" />
              View only
            </Badge>
          )}
        </div>
      )}

      {/* ── Identity header ─────────────────────────────────────────────── */}
      <Card className="relative overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]"
        />
        <CardContent className="relative space-y-6 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Avatar src={detail.avatar_url} name={detail.name} size="xl" ring />
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      disabled={uploading}
                      className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-primary disabled:opacity-60"
                      aria-label="Change profile picture"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={pickAvatar}
                    />
                  </>
                )}
              </div>

              <div className="min-w-0 space-y-1.5">
                <h1 className="truncate text-xl font-semibold tracking-tight">{detail.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {detail.job?.job_title || 'Role not set'}
                  {detail.job?.department ? ` · ${detail.job.department}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <PresenceBadge status={detail.today_status} />
                  {detail.role === 'admin' && <Badge variant="accent">HR officer</Badge>}
                  {!detail.is_active && <Badge variant="destructive">Deactivated</Badge>}
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="flex shrink-0 items-center gap-2">
                {dirty && (
                  <Button
                    variant="ghost"
                    onClick={() => setForm(JSON.parse(baseline))}
                    disabled={saving}
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Discard
                  </Button>
                )}
                <Button onClick={save} loading={saving} disabled={!dirty}>
                  <Save className="size-4" aria-hidden="true" />
                  {dirty ? 'Save changes' : 'Saved'}
                </Button>
              </div>
            )}
          </div>

          {/* The wireframe's two-column identity form. */}
          <div className="grid gap-x-8 gap-y-4 border-t border-border/60 pt-5 lg:grid-cols-2">
            <div className="space-y-4">
              <TextRow
                label="My Name"
                name="name"
                value={form.name}
                onChange={setField}
                editable={canEditAll}
                maxLength={100}
              />
              <FormRow label="Login ID" htmlFor="field-login_id">
                <div className="flex h-10 items-center rounded-lg border border-input bg-muted/50 px-3 font-mono text-sm text-muted-foreground">
                  {detail.login_id}
                </div>
              </FormRow>
              <TextRow
                label="Email"
                name="email_id"
                type="email"
                value={form.email_id}
                onChange={setField}
                editable={canEditAll}
              />
              <TextRow
                label="Mobile"
                name="phone"
                value={form.phone}
                onChange={setField}
                editable={canEdit}
                maxLength={15}
              />
            </div>

            <div className="space-y-4">
              <FormRow label="Company" htmlFor="field-company">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                  <Building2 className="size-4 shrink-0" aria-hidden="true" />
                  {detail.company_name}
                </div>
              </FormRow>
              <TextRow
                label="Department"
                name="job.department"
                value={form.job?.department}
                onChange={setField}
                editable={canEditAll}
                maxLength={80}
              />
              <TextRow
                label="Manager"
                name="job.manager"
                value={form.job?.manager}
                onChange={setField}
                editable={canEditAll}
                maxLength={100}
              />
              <TextRow
                label="Location"
                name="job.work_location"
                value={form.job?.work_location}
                onChange={setField}
                editable={canEditAll}
                maxLength={100}
              />
            </div>
          </div>

          {canEditAll && (
            <div className="grid gap-x-8 gap-y-4 border-t border-border/60 pt-5 lg:grid-cols-2">
              <TextRow
                label="Job Title"
                name="job.job_title"
                value={form.job?.job_title}
                onChange={setField}
                editable
                maxLength={80}
              />
              <TextRow
                label="Job Position"
                name="job.job_position"
                value={form.job?.job_position}
                onChange={setField}
                editable
                maxLength={80}
              />
              <SelectRow
                label="Employment Type"
                name="job.employment_type"
                value={form.job?.employment_type}
                onChange={setField}
                options={EMPLOYMENT_TYPES}
                editable
              />
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && !isSelf && (
        <Alert tone="info" title="You are editing someone else's profile">
          Changes are saved against {detail.name}’s record as soon as you press Save.
        </Alert>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="resume" icon={FileText}>
            Resume
          </TabsTrigger>
          <TabsTrigger value="private" icon={detail.private ? UserRound : Lock}>
            Private Info
          </TabsTrigger>
          {showSalary && (
            <TabsTrigger value="salary" icon={Wallet}>
              Salary Info
            </TabsTrigger>
          )}
          <TabsTrigger value="security" icon={ShieldCheck}>
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume">
          <ResumeTab form={form} setField={setField} editable={canEdit} />
        </TabsContent>

        <TabsContent value="private">
          {detail.private ? (
            <PrivateInfoTab
              form={form}
              setField={setField}
              editable={canEdit}
              canEditAll={canEditAll}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <Lock className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">Private details are not shared</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Personal contact, bank and statutory information is visible only to{' '}
                  {detail.name.split(' ')[0]} and the HR team.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showSalary && (
          <TabsContent value="salary">
            {/* `/payroll/me` is hard-wired read-only, so HR reads its own record
                through the by-id route to keep the editor available. */}
            <SalaryTab employeeId={detail._id} isSelf={viewingSelf && !canEditAll} />
          </TabsContent>
        )}

        <TabsContent value="security">
          <SecurityTab
            detail={detail}
            isSelf={viewingSelf}
            canEditAll={canEditAll}
            onChanged={load}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

/** API document -> editable form draft (dates become `YYYY-MM-DD` for inputs). */
function seedForm(detail) {
  const private_ = detail.private ?? null;

  return {
    name: detail.name ?? '',
    email_id: detail.email_id ?? '',
    phone: detail.phone ?? '',
    date_of_joining: toISODate(detail.date_of_joining),
    job: {
      department: '',
      job_title: '',
      job_position: '',
      manager: '',
      work_location: '',
      employment_type: '',
      ...(detail.job ?? {}),
    },
    resume: {
      about: '',
      love_about_job: '',
      interests: '',
      skills: [],
      certifications: [],
      ...(detail.resume ?? {}),
    },
    private: private_
      ? {
          residing_address: '',
          nationality: '',
          personal_email: '',
          gender: '',
          marital_status: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          bank_name: '',
          account_number: '',
          ifsc_code: '',
          pan_no: '',
          uan_no: '',
          esic_no: '',
          ...private_,
          date_of_birth: toISODate(private_.date_of_birth),
        }
      : null,
  };
}

/**
 * Build the PATCH body.
 *
 * Blank is a legitimate value for free text, but not for a date, an email or one
 * of the enum fields — pydantic would reject `""` there — so those keys are
 * omitted when empty rather than sent as an empty string.
 */
function buildProfilePayload(form, { admin }) {
  const filled = (value) => {
    const text = value == null ? '' : String(value).trim();
    return text ? text : undefined;
  };
  const text = (value) => (value == null ? '' : String(value));

  const payload = {
    resume: {
      about: text(form.resume?.about),
      love_about_job: text(form.resume?.love_about_job),
      interests: text(form.resume?.interests),
      skills: form.resume?.skills ?? [],
      certifications: form.resume?.certifications ?? [],
    },
  };

  const phone = filled(form.phone);
  if (phone) payload.phone = phone;

  if (form.private) {
    const private_ = {
      residing_address: text(form.private.residing_address),
      nationality: text(form.private.nationality),
      emergency_contact_name: text(form.private.emergency_contact_name),
      emergency_contact_phone: text(form.private.emergency_contact_phone),
    };

    const dateOfBirth = filled(form.private.date_of_birth);
    if (dateOfBirth) private_.date_of_birth = dateOfBirth;
    const personalEmail = filled(form.private.personal_email);
    if (personalEmail) private_.personal_email = personalEmail;
    const gender = filled(form.private.gender);
    if (gender) private_.gender = gender;
    const marital = filled(form.private.marital_status);
    if (marital) private_.marital_status = marital;

    if (admin) {
      private_.bank_name = text(form.private.bank_name);
      private_.account_number = text(form.private.account_number);
      private_.ifsc_code = text(form.private.ifsc_code);
      private_.pan_no = text(form.private.pan_no);
      private_.uan_no = text(form.private.uan_no);
      private_.esic_no = text(form.private.esic_no);
    }

    payload.private = private_;
  }

  if (admin) {
    const name = filled(form.name);
    if (name) payload.name = name;
    const email = filled(form.email_id);
    if (email) payload.email_id = email;
    const joining = filled(form.date_of_joining);
    if (joining) payload.date_of_joining = joining;

    const job = {
      department: text(form.job?.department),
      job_title: text(form.job?.job_title),
      job_position: text(form.job?.job_position),
      manager: text(form.job?.manager),
      work_location: text(form.job?.work_location),
    };
    const employmentType = filled(form.job?.employment_type);
    if (employmentType) job.employment_type = employmentType;
    payload.job = job;
  }

  return payload;
}

function ProfileSkeleton() {
  return (
    <>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-80 rounded-lg" />
      <Card>
        <CardContent className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className={cn('h-10', index % 2 ? 'w-2/3' : 'w-full')} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
