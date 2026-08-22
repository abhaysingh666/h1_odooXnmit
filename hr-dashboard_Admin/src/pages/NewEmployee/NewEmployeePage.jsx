import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField, { inputClasses } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import { DEPARTMENTS, EMPLOYMENT_STATUS } from '../../utils/constants';
import * as employeeService from '../../services/employeeService';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  department: DEPARTMENTS[0],
  designation: '',
  joiningDate: '',
  location: '',
  manager: '',
  employmentStatus: EMPLOYMENT_STATUS[0],
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Full name is required.';
  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.designation.trim()) errors.designation = 'Designation is required.';
  if (!form.joiningDate) errors.joiningDate = 'Joining date is required.';
  return errors;
}

export default function NewEmployeePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const toast = useToast();
  const navigate = useNavigate();

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await employeeService.createEmployee(form);
      toast.success('Employee created successfully.');
      navigate('/employees');
    } catch {
      setSubmitError('Unable to create this employee right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        to="/employees"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
      >
        <ArrowLeft size={15} />
        Back to Employees
      </Link>

      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">New Employee</h1>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
          A Login ID is generated automatically once the employee is saved.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="name" required error={errors.name}>
            <input id="name" value={form.name} onChange={set('name')} className={inputClasses(errors.name)} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email}>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              className={inputClasses(errors.email)}
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <input id="phone" value={form.phone} onChange={set('phone')} className={inputClasses(false)} />
          </FormField>
          <FormField label="Designation" htmlFor="designation" required error={errors.designation}>
            <input
              id="designation"
              value={form.designation}
              onChange={set('designation')}
              className={inputClasses(errors.designation)}
            />
          </FormField>
          <FormField label="Department" htmlFor="department" required>
            <select id="department" value={form.department} onChange={set('department')} className={inputClasses(false)}>
              {DEPARTMENTS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Joining Date" htmlFor="joiningDate" required error={errors.joiningDate}>
            <input
              id="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={set('joiningDate')}
              className={inputClasses(errors.joiningDate)}
            />
          </FormField>
          <FormField label="Work Location" htmlFor="location">
            <input id="location" value={form.location} onChange={set('location')} className={inputClasses(false)} />
          </FormField>
          <FormField label="Manager" htmlFor="manager">
            <input id="manager" value={form.manager} onChange={set('manager')} className={inputClasses(false)} />
          </FormField>
          <FormField label="Employment Status" htmlFor="employmentStatus" required>
            <select
              id="employmentStatus"
              value={form.employmentStatus}
              onChange={set('employmentStatus')}
              className={inputClasses(false)}
            >
              {EMPLOYMENT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {submitError && (
          <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
            {submitError}
          </p>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/employees')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Employee
          </Button>
        </div>
      </form>
    </div>
  );
}
