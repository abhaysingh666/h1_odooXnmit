import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import FormField, { inputClasses } from '../../components/ui/FormField';
import PageSpinner from '../../components/ui/PageSpinner';
import ErrorState from '../../components/ui/ErrorState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { DEPARTMENTS } from '../../utils/constants';
import * as employeeService from '../../services/employeeService';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setIsLoading(true);
    employeeService
      .getEmployeeById(user.id)
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm(data);
      })
      .catch(() => mounted && setLoadError('We ran into a problem loading your profile.'))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const startEdit = () => {
    setForm(profile);
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm(profile);
    setErrors({});
    setSaveError('');
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name?.trim()) nextErrors.name = 'Name is required.';
    if (!form.email?.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaveError('');
    setIsSaving(true);
    try {
      const updated = await employeeService.updateEmployee(user.id, form);
      setProfile(updated);
      setForm(updated);
      updateUser({ name: updated.name, email: updated.email, avatar: updated.avatar });
      toast.success('Profile updated successfully.');
      setIsEditing(false);
    } catch {
      setSaveError('Unable to update your profile right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageSpinner label="Loading your profile…" />;
  if (loadError) return <ErrorState description={loadError} />;
  if (!profile || !form) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">My Profile</h1>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Manage your personal information.</p>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil size={14} />
            Edit
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6">
        <Avatar name={profile.name} src={profile.avatar} size="xl" />
        <div>
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">{profile.name}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">{profile.designation}</p>
          <p className="mt-1 font-mono text-xs text-[var(--color-ink-faint)]">{profile.id}</p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="name" required error={errors.name}>
            <input
              id="name"
              value={form.name}
              onChange={set('name')}
              disabled={!isEditing}
              className={`${inputClasses(errors.name)} disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-soft)]`}
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email}>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              disabled={!isEditing}
              className={`${inputClasses(errors.email)} disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-soft)]`}
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <input
              id="phone"
              value={form.phone || ''}
              onChange={set('phone')}
              disabled={!isEditing}
              className={`${inputClasses(false)} disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-soft)]`}
            />
          </FormField>
          <FormField label="Designation" htmlFor="designation">
            <input
              id="designation"
              value={form.designation || ''}
              onChange={set('designation')}
              disabled={!isEditing}
              className={`${inputClasses(false)} disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-soft)]`}
            />
          </FormField>
          <FormField label="Department" htmlFor="department">
            <select
              id="department"
              value={form.department}
              onChange={set('department')}
              disabled={!isEditing}
              className={`${inputClasses(false)} disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-soft)]`}
            >
              {DEPARTMENTS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Work Location" htmlFor="location">
            <input
              id="location"
              value={form.location || ''}
              onChange={set('location')}
              disabled={!isEditing}
              className={`${inputClasses(false)} disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-soft)]`}
            />
          </FormField>
        </div>

        {saveError && (
          <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
            {saveError}
          </p>
        )}

        {isEditing && (
          <div className="mt-1 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
