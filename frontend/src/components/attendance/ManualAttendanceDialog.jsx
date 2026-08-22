import { useEffect, useMemo, useState } from 'react';

import { attendanceAPI, employeeAPI } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { ATTENDANCE_STATUSES, clockTime, hoursFromMinutes } from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Label';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

/**
 * HR recording or correcting one day for one employee — a missed check-out, a
 * recorded absence, a company holiday. The backend upserts on (employee, day),
 * so re-submitting a date edits it in place.
 */
export function ManualAttendanceDialog({ open, initial, maxDate, onClose, onSaved }) {
  const { success, error: notifyError } = useToast();
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reseed every time the dialog opens so a previous edit never leaks through.
  useEffect(() => {
    if (!open) return;
    setForm(seed(initial));
    setError('');
  }, [open, initial]);

  useEffect(() => {
    if (!open || people.length) return;
    let alive = true;
    employeeAPI
      .list({ limit: 300 })
      .then(({ data }) => {
        if (alive) setPeople(data ?? []);
      })
      .catch(() => {
        /* The picker falls back to the pre-selected employee. */
      });
    return () => {
      alive = false;
    };
  }, [open, people.length]);

  const needsWindow = form.status === 'present' || form.status === 'half_day';
  const preview = useMemo(() => previewHours(form), [form]);

  async function submit(event) {
    event.preventDefault();

    if (!form.employee_id) {
      setError('Pick an employee first.');
      return;
    }
    if (needsWindow && form.check_in && form.check_out && form.check_out <= form.check_in) {
      setError('Check-out has to be later than check-in.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await attendanceAPI.record({
        employee_id: form.employee_id,
        day: form.day,
        status: form.status,
        check_in: needsWindow ? toInstant(form.day, form.check_in) : null,
        check_out: needsWindow ? toInstant(form.day, form.check_out) : null,
        break_minutes: form.break_minutes === '' ? null : Number(form.break_minutes),
        note: form.note || null,
      });
      success('Attendance recorded', `${form.day} saved.`);
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this record.'));
    } finally {
      setSaving(false);
    }
  }

  const selected = people.find((person) => person._id === form.employee_id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record attendance"
      description="Use this for missed punches, recorded absences and holidays. Payroll pro-rates the payslip from these records."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Discard
          </Button>
          <Button onClick={submit} loading={saving}>
            Save record
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" htmlFor="manual-employee" required>
            <Select
              id="manual-employee"
              value={form.employee_id}
              onChange={(event) => setForm((f) => ({ ...f, employee_id: event.target.value }))}
            >
              <option value="">Select an employee</option>
              {!selected && initial?.employee_id && (
                <option value={initial.employee_id}>
                  {initial.employee_name ?? 'Selected employee'}
                </option>
              )}
              {people.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name} — {person.login_id}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Date" htmlFor="manual-day" required>
            <Input
              id="manual-day"
              type="date"
              value={form.day}
              max={maxDate}
              onChange={(event) => setForm((f) => ({ ...f, day: event.target.value }))}
            />
          </Field>

          <Field
            label="Status"
            htmlFor="manual-status"
            hint={needsWindow ? undefined : 'No working window needed'}
          >
            <Select
              id="manual-status"
              value={form.status}
              onChange={(event) => setForm((f) => ({ ...f, status: event.target.value }))}
            >
              {ATTENDANCE_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Break" htmlFor="manual-break" hint="Minutes">
            <Input
              id="manual-break"
              type="number"
              min={0}
              max={480}
              step={5}
              value={form.break_minutes}
              placeholder="Use the employee's schedule"
              onChange={(event) => setForm((f) => ({ ...f, break_minutes: event.target.value }))}
              disabled={!needsWindow}
            />
          </Field>

          <Field label="Check In" htmlFor="manual-in">
            <Input
              id="manual-in"
              type="time"
              value={form.check_in}
              onChange={(event) => setForm((f) => ({ ...f, check_in: event.target.value }))}
              disabled={!needsWindow}
            />
          </Field>

          <Field label="Check Out" htmlFor="manual-out">
            <Input
              id="manual-out"
              type="time"
              value={form.check_out}
              onChange={(event) => setForm((f) => ({ ...f, check_out: event.target.value }))}
              disabled={!needsWindow}
            />
          </Field>
        </div>

        {needsWindow && preview && (
          <Alert tone="info" title={`Work hours ${preview.work} · Extra hours ${preview.extra}`}>
            Calculated from {form.check_in} → {form.check_out} minus{' '}
            {preview.breakMinutes} minutes of break, against an 8-hour day.
          </Alert>
        )}

        <Field label="Note" htmlFor="manual-note" hint="Optional, visible to HR">
          <Textarea
            id="manual-note"
            rows={2}
            maxLength={200}
            value={form.note}
            placeholder="Forgot to check out — confirmed with their manager."
            onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))}
          />
        </Field>
      </form>
    </Dialog>
  );
}

function blank() {
  return {
    employee_id: '',
    day: '',
    status: 'present',
    check_in: '',
    check_out: '',
    break_minutes: '',
    note: '',
  };
}

function seed(initial) {
  const record = initial?.record;
  return {
    ...blank(),
    employee_id: initial?.employee_id ?? '',
    day: initial?.day ?? '',
    status: record?.status && record.status !== 'weekend' ? record.status : 'present',
    check_in: record?.check_in ? clockTime(record.check_in) : '',
    check_out: record?.check_out ? clockTime(record.check_out) : '',
    break_minutes: record?.break_minutes ? String(record.break_minutes) : '',
    note: record?.note ?? '',
  };
}

/**
 * `YYYY-MM-DD` + `HH:MM` typed in the admin's own timezone -> a UTC instant.
 * The backend stores UTC, so converting here keeps the times the admin entered
 * identical to the ones every client renders back.
 */
function toInstant(day, time) {
  if (!day || !time) return null;
  const date = new Date(`${day}T${time}:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Client-side echo of `_derive` in the attendance router, for the live hint. */
function previewHours(form) {
  if (!form.check_in || !form.check_out) return null;

  const start = new Date(`1970-01-01T${form.check_in}:00`);
  const end = new Date(`1970-01-01T${form.check_out}:00`);
  const span = (end - start) / 60000;
  if (!Number.isFinite(span) || span <= 0) return null;

  const breakMinutes = form.break_minutes === '' ? 60 : Number(form.break_minutes) || 0;
  const worked = Math.max(0, span - breakMinutes);

  return {
    work: hoursFromMinutes(worked),
    extra: hoursFromMinutes(Math.max(0, worked - 8 * 60)),
    breakMinutes,
  };
}
