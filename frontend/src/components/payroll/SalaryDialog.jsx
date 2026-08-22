import { useEffect, useState } from 'react';
import { DollarSign, Save } from 'lucide-react';

import { payrollAPI } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

/**
 * Dialog for admin to set or update an employee's salary structure
 */
export function SalaryDialog({ open, employee, onClose, onSaved }) {
  const { success, error: notifyError } = useToast();

  const [form, setForm] = useState({
    monthly_wage: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Load existing salary when dialog opens
  useEffect(() => {
    if (!open || !employee) return;

    async function loadSalary() {
      setFetching(true);
      try {
        const { data } = await payrollAPI.forEmployee(employee._id);
        setForm({
          monthly_wage: data.monthly_wage || '',
        });
      } catch (err) {
        // No salary set up yet - use defaults
        setForm({
          monthly_wage: '',
        });
      } finally {
        setFetching(false);
      }
    }

    loadSalary();
  }, [open, employee]);

  const update = (key) => (e) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const wage = parseFloat(form.monthly_wage);

    if (!wage || wage <= 0) {
      setError('Monthly wage must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await payrollAPI.update(employee._id, {
        monthly_wage: wage,
      });

      success('Salary updated', `Salary structure for ${employee.name} has been saved.`);
      onSaved?.();
    } catch (err) {
      const msg = errorMessage(err, 'Could not update salary');
      notifyError('Update failed', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  const wage = parseFloat(form.monthly_wage) || 0;
  const annual = wage * 12;
  
  // Auto-computed breakdown (based on backend defaults)
  const basic = wage * 0.5;
  const hra = basic * 0.5;
  const specialAllowance = basic * 0.1667;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <DollarSign className="size-5" />
          <span>{form.monthly_wage ? 'Edit' : 'Set Up'} Salary Structure</span>
        </div>
      }
      description={
        <>
          Configure salary for <span className="font-medium">{employee.name}</span>
        </>
      }
      size="default"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="salary-form" loading={loading}>
            <Save className="size-4" />
            {loading ? 'Saving...' : 'Save Salary'}
          </Button>
        </>
      }
    >
      {fetching ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading salary data...</div>
      ) : (
        <form id="salary-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Monthly Wage */}
          <div className="space-y-2">
            <label htmlFor="monthly_wage" className="text-sm font-medium">
              Monthly Wage (Gross)<span className="text-destructive ml-0.5">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="monthly_wage"
                type="number"
                min="0"
                step="1000"
                placeholder="80000"
                value={form.monthly_wage}
                onChange={update('monthly_wage')}
                disabled={loading}
                required
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total monthly gross salary before deductions
            </p>
          </div>

          {/* Auto-computed breakdown preview */}
          {wage > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Auto-computed breakdown:</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Basic (50%)</span>
                <span className="font-mono">₹{basic.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">HRA (25%)</span>
                <span className="font-mono">₹{hra.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Special Allowance (~8%)</span>
                <span className="font-mono">₹{specialAllowance.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Annual CTC</span>
                  <span className="text-lg font-bold text-primary">₹{annual.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert tone="error" title="Validation error">
              {error}
            </Alert>
          )}
        </form>
      )}
    </Dialog>
  );
}
