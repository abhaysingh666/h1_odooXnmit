import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Plus, Check, Edit2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import FormField, { inputClasses } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import * as payrollService from '../../services/payrollService';
import * as employeeService from '../../services/employeeService';

export default function AdminPayroll() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Dialog/Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);

  // Form states
  const [form, setForm] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    basic: 0,
    hra: 0,
    allowances: 0,
    deductions: 0,
    paymentStatus: 'pending'
  });

  // Query employees (to select from dropdown when creating payroll)
  const { data: employees = [], error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getEmployees,
  });

  // Query all payroll records
  const { data: payrolls = [], isLoading, error: payrollsError, refetch } = useQuery({
    queryKey: ['payroll'],
    queryFn: payrollService.getAllPayroll,
  });

  // Create payroll mutation
  const createMutation = useMutation({
    mutationFn: (data) => payrollService.createPayroll(data),
    onSuccess: () => {
      toast.success('Payroll slip created successfully.');
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create payroll slip.');
    }
  });

  // Update payroll mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => payrollService.updatePayroll(id, data),
    onSuccess: () => {
      toast.success('Payroll slip updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setShowEditModal(false);
      setActiveRecord(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update payroll.');
    }
  });

  const resetForm = () => {
    setForm({
      employeeId: employees[0]?.id || '',
      month: new Date().toISOString().slice(0, 7),
      basic: 0,
      hra: 0,
      allowances: 0,
      deductions: 0,
      paymentStatus: 'pending'
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    if (employees.length > 0) {
      setForm(f => ({ ...f, employeeId: employees[0].id }));
    }
    setShowAddModal(true);
  };

  const handleOpenEdit = (record) => {
    setActiveRecord(record);
    setForm({
      employeeId: record.employeeId,
      month: record.month,
      basic: record.salaryStructure.basic,
      hra: record.salaryStructure.hra,
      allowances: record.salaryStructure.allowances,
      deductions: record.salaryStructure.deductions,
      paymentStatus: record.paymentStatus
    });
    setShowEditModal(true);
  };

  const handleToggleStatus = (record) => {
    const nextStatus = record.paymentStatus === 'paid' ? 'pending' : 'paid';
    updateMutation.mutate({
      id: record.id,
      data: { payment_status: nextStatus }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.employeeId) {
      toast.error('Please select an employee.');
      return;
    }
    if (!form.month) {
      toast.error('Please select a payroll month.');
      return;
    }

    const basic = Number(form.basic);
    const hra = Number(form.hra);
    const allowances = Number(form.allowances);
    const deductions = Number(form.deductions);
    const gross = basic + hra + allowances;
    const net = gross - deductions;

    const payload = {
      employeeId: form.employeeId,
      month: form.month,
      salaryStructure: {
        basic,
        hra,
        allowances,
        deductions,
        gross_salary: gross,
        net_salary: net
      },
      paymentStatus: form.paymentStatus
    };

    if (showAddModal) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({
        id: activeRecord.id,
        data: {
          salaryStructure: payload.salaryStructure,
          payment_status: form.paymentStatus
        }
      });
    }
  };

  // Calculations for warning
  const basicVal = Number(form.basic) || 0;
  const hraVal = Number(form.hra) || 0;
  const allowancesVal = Number(form.allowances) || 0;
  const deductionsVal = Number(form.deductions) || 0;
  const grossCalculated = basicVal + hraVal + allowancesVal;
  const netCalculated = grossCalculated - deductionsVal;
  const showWarning = netCalculated < 0;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Payroll Management</h1>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Process payroll, update salary structures, and manage payments.</p>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0">
          <Plus size={16} />
          Create Payroll Slip
        </Button>
      </div>

      {payrollsError || employeesError ? (
        <ErrorState description="Failed to load payroll records. Please retry." onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : payrolls.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No payroll processed yet."
          description="HR has not created any payroll records. Click 'Create Payroll Slip' to process the first slip."
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface-2)] font-medium text-[var(--color-ink-soft)]">
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Month</th>
                  <th className="px-6 py-3.5">Gross Salary</th>
                  <th className="px-6 py-3.5">Deductions</th>
                  <th className="px-6 py-3.5">Net Salary</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Payment Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {payrolls.map((r) => {
                  const emp = employees.find((e) => e.id === r.employeeId);
                  const isPaid = r.paymentStatus === 'paid';
                  
                  return (
                    <tr key={r.id} className="hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[var(--color-ink)]">{emp ? emp.name : r.employeeId}</p>
                          <p className="text-xs text-[var(--color-ink-faint)]">{r.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--color-ink-soft)]">
                        {new Date(r.month + '-02').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-mono text-[var(--color-ink)]">₹{r.salaryStructure.gross_salary.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-[var(--color-danger)]">-₹{r.salaryStructure.deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-[var(--color-primary)]">₹{r.salaryStructure.net_salary.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(r)}
                          aria-label={`Toggle payment status to ${isPaid ? 'pending' : 'paid'}`}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:opacity-85 transition-opacity cursor-pointer ${
                            isPaid ? 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]' : 'bg-[var(--color-status-absent-soft)] text-[var(--color-status-absent)]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-[var(--color-status-present)]' : 'bg-[var(--color-status-absent)]'}`} />
                          {isPaid ? 'Paid' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-ink-soft)]">{formatDate(r.paymentDate)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            aria-label="Edit salary structure"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Payroll Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fade-in" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-pop)] animate-pop-in">
            <h3 className="font-semibold text-lg text-[var(--color-ink)]">
              {showAddModal ? 'Create Payroll Slip' : 'Edit Salary Structure'}
            </h3>
            
            <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Select Employee" htmlFor="employeeSelect" required>
                  <select
                    id="employeeSelect"
                    value={form.employeeId}
                    onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}
                    disabled={showEditModal}
                    className={inputClasses(false)}
                  >
                    <option value="" disabled>-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                    ))}
                  </select>
                </FormField>
                
                <FormField label="Payroll Month" htmlFor="month" required>
                  <input
                    id="month"
                    type="month"
                    value={form.month}
                    onChange={(e) => setForm(f => ({ ...f, month: e.target.value }))}
                    disabled={showEditModal}
                    className={inputClasses(false)}
                    required
                  />
                </FormField>
              </div>

              <div className="border-t border-[var(--color-line)] pt-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-3">Salary Component breakdown</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Basic Pay (₹)" htmlFor="basic">
                    <input
                      id="basic"
                      type="number"
                      value={form.basic}
                      onChange={(e) => setForm(f => ({ ...f, basic: Number(e.target.value) }))}
                      className={inputClasses(false)}
                      min="0"
                      required
                    />
                  </FormField>
                  <FormField label="HRA (₹)" htmlFor="hra">
                    <input
                      id="hra"
                      type="number"
                      value={form.hra}
                      onChange={(e) => setForm(f => ({ ...f, hra: Number(e.target.value) }))}
                      className={inputClasses(false)}
                      min="0"
                      required
                    />
                  </FormField>
                  <FormField label="Allowances (₹)" htmlFor="allowances">
                    <input
                      id="allowances"
                      type="number"
                      value={form.allowances}
                      onChange={(e) => setForm(f => ({ ...f, allowances: Number(e.target.value) }))}
                      className={inputClasses(false)}
                      min="0"
                      required
                    />
                  </FormField>
                  <FormField label="Deductions (₹)" htmlFor="deductions">
                    <input
                      id="deductions"
                      type="number"
                      value={form.deductions}
                      onChange={(e) => setForm(f => ({ ...f, deductions: Number(e.target.value) }))}
                      className={inputClasses(showWarning)}
                      min="0"
                      required
                    />
                  </FormField>
                </div>
              </div>

              <FormField label="Payment Status" htmlFor="paymentStatus">
                <select
                  id="paymentStatus"
                  value={form.paymentStatus}
                  onChange={(e) => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
                  className={inputClasses(false)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </FormField>

              {/* Live calculations & warnings */}
              <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-2)] p-4 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-ink-soft)]">Gross Salary:</span>
                  <span className="font-semibold text-[var(--color-ink)]">₹{grossCalculated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--color-line)] pt-1.5">
                  <span className="text-[var(--color-ink-soft)] font-medium">Net Take-Home:</span>
                  <span className={`font-bold ${showWarning ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)]'}`}>
                    ₹{netCalculated.toLocaleString()}
                  </span>
                </div>
              </div>

              {showWarning && (
                <div className="rounded-[var(--radius-control)] border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] p-3 text-xs text-[var(--color-danger)] flex items-start gap-2 animate-fade-in">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Accuracy Warning: Net Salary is negative</p>
                    <p className="mt-0.5 opacity-90">Deductions exceed the gross salary amount. Please double check deductions before processing.</p>
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-[var(--color-line)] pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving} disabled={showWarning}>
                  Save Payroll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
