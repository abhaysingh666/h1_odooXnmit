import { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import FormField, { inputClasses } from '../../../components/ui/FormField';
import { useToast } from '../../../hooks/useToast';
import * as employeeService from '../../../services/employeeService';

function ChipList({ items, onRemove, editable, emptyLabel }) {
  if (items.length === 0 && !editable) {
    return <p className="text-sm text-[var(--color-ink-faint)]">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]"
        >
          {item}
          {editable && (
            <button
              type="button"
              onClick={() => onRemove(item)}
              aria-label={`Remove ${item}`}
              className="text-[var(--color-primary)]/60 hover:text-[var(--color-primary)]"
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function ChipEditor({ label, items, onChange, placeholder, emptyLabel }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value || items.includes(value)) return;
    onChange([...items, value]);
    setDraft('');
  };

  return (
    <div>
      <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">{label}</h3>
      <div className="mt-2.5">
        <ChipList items={items} onRemove={(item) => onChange(items.filter((i) => i !== item))} editable emptyLabel={emptyLabel} />
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={`${inputClasses(false)} h-9 text-[13px]`}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus size={14} />
          Add
        </Button>
      </div>
    </div>
  );
}

export default function ResumeTab({ employee, canEdit, onUpdated }) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    about: employee.about || '',
    jobHighlight: employee.jobHighlight || '',
    interests: employee.interests || '',
    skills: employee.skills || [],
    certifications: employee.certifications || [],
  });

  const startEdit = () => {
    setForm({
      about: employee.about || '',
      jobHighlight: employee.jobHighlight || '',
      interests: employee.interests || '',
      skills: employee.skills || [],
      certifications: employee.certifications || [],
    });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await employeeService.updateEmployee(employee.id, form);
      onUpdated(updated);
      toast.success('Resume updated.');
      setIsEditing(false);
    } catch {
      toast.error('Unable to save changes right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {canEdit && (
        <div className="flex justify-end">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil size={14} />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                Save
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
            <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">About</h3>
            {isEditing ? (
              <FormField label="" htmlFor="about">
                <textarea
                  id="about"
                  rows={4}
                  value={form.about}
                  onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                  className={`${inputClasses(false)} h-auto py-2`}
                />
              </FormField>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {employee.about || 'No summary added yet.'}
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
            <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">What I Love About My Job</h3>
            {isEditing ? (
              <FormField label="" htmlFor="jobHighlight">
                <textarea
                  id="jobHighlight"
                  rows={3}
                  value={form.jobHighlight}
                  onChange={(e) => setForm((f) => ({ ...f, jobHighlight: e.target.value }))}
                  className={`${inputClasses(false)} h-auto py-2`}
                />
              </FormField>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {employee.jobHighlight || 'Nothing added yet.'}
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
            <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">My Interests and Hobbies</h3>
            {isEditing ? (
              <FormField label="" htmlFor="interests">
                <textarea
                  id="interests"
                  rows={3}
                  value={form.interests}
                  onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
                  className={`${inputClasses(false)} h-auto py-2`}
                />
              </FormField>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {employee.interests || 'Nothing added yet.'}
              </p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
            {isEditing ? (
              <ChipEditor
                label="Skills"
                items={form.skills}
                onChange={(skills) => setForm((f) => ({ ...f, skills }))}
                placeholder="Add a skill…"
                emptyLabel="No skills added yet."
              />
            ) : (
              <>
                <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Skills</h3>
                <div className="mt-2.5">
                  <ChipList items={employee.skills || []} editable={false} emptyLabel="No skills added yet." />
                </div>
              </>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
            {isEditing ? (
              <ChipEditor
                label="Certifications"
                items={form.certifications}
                onChange={(certifications) => setForm((f) => ({ ...f, certifications }))}
                placeholder="Add a certification…"
                emptyLabel="No certifications added yet."
              />
            ) : (
              <>
                <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Certifications</h3>
                <div className="mt-2.5">
                  <ChipList items={employee.certifications || []} editable={false} emptyLabel="No certifications added yet." />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
