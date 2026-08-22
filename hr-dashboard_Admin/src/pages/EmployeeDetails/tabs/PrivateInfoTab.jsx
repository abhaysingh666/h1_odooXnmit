import { useState } from 'react';
import { Pencil } from 'lucide-react';
import Button from '../../../components/ui/Button';
import FormField, { inputClasses } from '../../../components/ui/FormField';
import { InfoSection, InfoItem } from '../InfoSection';
import { formatDate } from '../../../utils/formatters';
import { useToast } from '../../../hooks/useToast';
import * as employeeService from '../../../services/employeeService';

const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];

export default function PrivateInfoTab({ employee, canEdit, onUpdated }) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(buildForm(employee));

  function buildForm(emp) {
    return {
      dob: emp.dob || '',
      residingAddress: emp.residingAddress || '',
      nationality: emp.nationality || '',
      personalEmail: emp.personalEmail || '',
      maritalStatus: emp.maritalStatus || '',
      bankDetails: { ...(emp.bankDetails || {}) },
    };
  }

  const startEdit = () => {
    setForm(buildForm(employee));
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setBank = (key) => (e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, [key]: e.target.value } }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await employeeService.updateEmployee(employee.id, form);
      onUpdated(updated);
      toast.success('Private info updated.');
      setIsEditing(false);
    } catch {
      toast.error('Unable to save changes right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const bank = employee.bankDetails || {};

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

      {!isEditing ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <InfoSection title="Personal Details">
            <InfoItem label="Date of Birth" value={formatDate(employee.dob)} />
            <InfoItem label="Gender" value={employee.gender} />
            <InfoItem label="Marital Status" value={employee.maritalStatus} />
            <InfoItem label="Nationality" value={employee.nationality} />
            <InfoItem label="Personal Email" value={employee.personalEmail} />
            <InfoItem label="Date of Joining" value={formatDate(employee.joiningDate)} />
          </InfoSection>
          <div className="flex flex-col gap-5">
            <InfoSection title="Residing Address">
              <div className="col-span-2">
                <InfoItem label="Address" value={employee.residingAddress} />
              </div>
            </InfoSection>
            <InfoSection title="Bank Details">
              <InfoItem label="Bank Name" value={bank.bankName} />
              <InfoItem label="Account Number" value={bank.accountNumber} mono />
              <InfoItem label="IFSC Code" value={bank.ifscCode} mono />
              <InfoItem label="PAN No" value={bank.panNo} mono />
              <InfoItem label="UAN No" value={bank.uanNo} mono />
            </InfoSection>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
            <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Personal Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Date of Birth" htmlFor="dob">
                <input id="dob" type="date" value={form.dob} onChange={set('dob')} className={inputClasses(false)} />
              </FormField>
              <FormField label="Marital Status" htmlFor="maritalStatus">
                <select id="maritalStatus" value={form.maritalStatus} onChange={set('maritalStatus')} className={inputClasses(false)}>
                  <option value="">—</option>
                  {MARITAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nationality" htmlFor="nationality">
                <input id="nationality" value={form.nationality} onChange={set('nationality')} className={inputClasses(false)} />
              </FormField>
              <FormField label="Personal Email" htmlFor="personalEmail">
                <input
                  id="personalEmail"
                  type="email"
                  value={form.personalEmail}
                  onChange={set('personalEmail')}
                  className={inputClasses(false)}
                />
              </FormField>
            </div>
            <FormField label="Residing Address" htmlFor="residingAddress">
              <textarea
                id="residingAddress"
                rows={2}
                value={form.residingAddress}
                onChange={set('residingAddress')}
                className={`${inputClasses(false)} h-auto py-2`}
              />
            </FormField>
          </section>

          <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
            <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Bank Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Bank Name" htmlFor="bankName">
                <input id="bankName" value={form.bankDetails.bankName || ''} onChange={setBank('bankName')} className={inputClasses(false)} />
              </FormField>
              <FormField label="Account Number" htmlFor="accountNumber">
                <input
                  id="accountNumber"
                  value={form.bankDetails.accountNumber || ''}
                  onChange={setBank('accountNumber')}
                  className={`${inputClasses(false)} font-mono`}
                />
              </FormField>
              <FormField label="IFSC Code" htmlFor="ifscCode">
                <input
                  id="ifscCode"
                  value={form.bankDetails.ifscCode || ''}
                  onChange={setBank('ifscCode')}
                  className={`${inputClasses(false)} font-mono`}
                />
              </FormField>
              <FormField label="PAN No" htmlFor="panNo">
                <input id="panNo" value={form.bankDetails.panNo || ''} onChange={setBank('panNo')} className={`${inputClasses(false)} font-mono`} />
              </FormField>
              <FormField label="UAN No" htmlFor="uanNo">
                <input id="uanNo" value={form.bankDetails.uanNo || ''} onChange={setBank('uanNo')} className={`${inputClasses(false)} font-mono`} />
              </FormField>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
