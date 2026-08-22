import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import FormField, { inputClasses } from '../ui/FormField';
import { TIME_OFF_TYPES } from '../../utils/constants';

const INITIAL = { type: TIME_OFF_TYPES[0], startDate: '', endDate: '', reason: '' };

export default function TimeOffRequestModal({ onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.startDate) nextErrors.startDate = 'Start date is required.';
    if (!form.endDate) nextErrors.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = 'End date must be after the start date.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-label="Request time off">
      <div className="animate-pop-in w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-pop)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">Request Time Off</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Type" htmlFor="type" required>
            <select id="type" value={form.type} onChange={set('type')} className={inputClasses(false)}>
              {TIME_OFF_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" htmlFor="startDate" required error={errors.startDate}>
              <input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={set('startDate')}
                className={inputClasses(errors.startDate)}
              />
            </FormField>
            <FormField label="End Date" htmlFor="endDate" required error={errors.endDate}>
              <input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={set('endDate')}
                className={inputClasses(errors.endDate)}
              />
            </FormField>
          </div>

          <FormField label="Reason" htmlFor="reason" hint="Optional">
            <textarea
              id="reason"
              rows={3}
              value={form.reason}
              onChange={set('reason')}
              className={`${inputClasses(false)} h-auto resize-none py-2`}
            />
          </FormField>

          <div className="mt-1 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
