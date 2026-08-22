import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, FileUp, Paperclip, X } from 'lucide-react';

import { employeeAPI, leaveAPI } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { LEAVE_TYPES, leaveType, toISODate } from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Label';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const TYPE_OPTIONS = Object.entries(LEAVE_TYPES).map(([value, meta]) => ({
  value,
  label: meta.label,
  description: meta.description,
}));

/**
 * The "NEW" time-off request from the wireframe: employee, type, validity
 * period, the allocation it consumes, and an attachment for sick notes.
 *
 * `canPickEmployee` mirrors the backend rule that only admins may file a request
 * on somebody else's behalf.
 */
export function LeaveRequestDialog({ open, onClose, onCreated, canPickEmployee = false, balances }) {
  const { success, error: notifyError } = useToast();
  const fileInput = useRef(null);

  const [form, setForm] = useState(blank);
  const [people, setPeople] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(blank());
    setAttachment(null);
    setError('');
  }, [open]);

  useEffect(() => {
    if (!open || !canPickEmployee || people.length) return;
    let alive = true;
    employeeAPI
      .list({ limit: 300 })
      .then(({ data }) => {
        if (alive) setPeople(data ?? []);
      })
      .catch(() => {
        /* Falls back to filing for yourself. */
      });
    return () => {
      alive = false;
    };
  }, [open, canPickEmployee, people.length]);

  const days = useMemo(
    () => (form.half_day ? 0.5 : countWorkingDays(form.start_date, form.end_date)),
    [form.start_date, form.end_date, form.half_day]
  );

  const meta = leaveType(form.leave_type);
  const balance = balances?.find((entry) => entry.leave_type === form.leave_type);
  const overBalance =
    balance?.available != null && days > balance.available && !canPickEmployee ? balance : null;
  const needsCertificate = form.leave_type === 'sick' && days > 2 && !attachment;

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await leaveAPI.uploadAttachment(file);
      setAttachment({ url: data.url, filename: data.filename ?? file.name });
    } catch (err) {
      notifyError('Upload failed', errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.start_date || !form.end_date) {
      setError('Pick the period this request covers.');
      return;
    }
    if (form.end_date < form.start_date) {
      setError('The end date cannot be before the start date.');
      return;
    }
    if (days === 0) {
      setError('That period contains no working days.');
      return;
    }
    if (needsCertificate) {
      setError('Sick leave longer than 2 days needs a medical certificate attached.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { data } = await leaveAPI.apply({
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        half_day: form.half_day,
        remarks: form.remarks || null,
        attachment_url: attachment?.url ?? null,
        employee_id: form.employee_id || null,
      });
      success('Request submitted', `${data.days} day(s) of ${meta.label} sent for approval.`);
      onCreated?.(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not submit this request.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New time off request"
      description="Approved requests appear on your calendar and are treated as leave in attendance."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Discard
          </Button>
          <Button onClick={submit} loading={saving} disabled={uploading}>
            Submit
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {canPickEmployee && (
          <Field label="Employee" htmlFor="leave-employee" hint="Leave empty to file for yourself">
            <Select
              id="leave-employee"
              value={form.employee_id}
              onChange={(event) => setForm((f) => ({ ...f, employee_id: event.target.value }))}
            >
              <option value="">Myself</option>
              {people.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name} — {person.login_id}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Time off Type" htmlFor="leave-type" hint={meta.description}>
          <Select
            id="leave-type"
            value={form.leave_type}
            onChange={(event) => setForm((f) => ({ ...f, leave_type: event.target.value }))}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-lg border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CalendarRange className="size-4 text-primary" aria-hidden="true" />
            Validity Period
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="From" htmlFor="leave-from" required>
              <Input
                id="leave-from"
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    start_date: event.target.value,
                    // Keep the range coherent while the user is still typing.
                    end_date: f.end_date && f.end_date < event.target.value ? event.target.value : f.end_date,
                  }))
                }
              />
            </Field>
            <Field label="To" htmlFor="leave-to" required>
              <Input
                id="leave-to"
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(event) => setForm((f) => ({ ...f, end_date: event.target.value }))}
              />
            </Field>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.half_day}
              disabled={!form.start_date || form.start_date !== form.end_date}
              onChange={(event) => setForm((f) => ({ ...f, half_day: event.target.checked }))}
              className="size-4 rounded border-border accent-[var(--primary)]"
            />
            <span className={!form.start_date || form.start_date !== form.end_date ? 'text-muted-foreground' : ''}>
              Half day
            </span>
          </label>

          <div className="mt-3 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Allocation</span>
            <span className="font-semibold tabular-nums">
              {days} {days === 1 ? 'day' : 'days'}
            </span>
          </div>

          {balance && (
            <p className="mt-2 text-xs text-muted-foreground">
              {balance.available == null
                ? `${balance.label} is uncapped, but unpaid days reduce your payable days.`
                : `${balance.available} of ${balance.allocated} day(s) of ${balance.label.toLowerCase()} still available.`}
            </p>
          )}
        </div>

        {overBalance && (
          <Alert tone="warning">
            This request needs {days} day(s) but only {overBalance.available} remain.
          </Alert>
        )}

        <Field
          label="Attachment"
          htmlFor="leave-attachment"
          hint="PDF or image, up to 10 MB"
          error={needsCertificate ? 'Required for sick leave longer than 2 days.' : undefined}
        >
          {attachment ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:text-primary hover:underline"
                >
                  {attachment.filename}
                </a>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setAttachment(null)}
                aria-label="Remove attachment"
              >
                <X />
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInput.current?.click()}
                loading={uploading}
              >
                <FileUp />
                {form.leave_type === 'sick' ? 'Attach medical certificate' : 'Attach a document'}
              </Button>
              <input
                id="leave-attachment"
                ref={fileInput}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={upload}
              />
            </>
          )}
        </Field>

        <Field label="Remarks" htmlFor="leave-remarks" hint="Optional, seen by your approver">
          <Textarea
            id="leave-remarks"
            rows={3}
            maxLength={500}
            value={form.remarks}
            placeholder="Family wedding out of town."
            onChange={(event) => setForm((f) => ({ ...f, remarks: event.target.value }))}
          />
        </Field>
      </form>
    </Dialog>
  );
}

function blank() {
  const today = toISODate(new Date());
  return {
    employee_id: '',
    leave_type: 'paid',
    start_date: today,
    end_date: today,
    half_day: false,
    remarks: '',
  };
}

/**
 * Mirrors `count_working_days` on the backend (Monday–Friday by default) so the
 * dialog can show the allocation before the request is sent. The server
 * recomputes it against the employee's own working week.
 */
export function countWorkingDays(startISO, endISO) {
  if (!startISO || !endISO || endISO < startISO) return 0;

  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  let days = 0;

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    // JS weeks start on Sunday; shift so Monday is 0 and weekdays are 0–4.
    if ((cursor.getDay() + 6) % 7 <= 4) days += 1;
  }
  return days;
}
