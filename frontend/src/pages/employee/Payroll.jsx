import { useEffect, useState } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatters';
import * as payrollService from '../../services/payrollService';

export default function Payroll() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadPayroll = () => {
    setIsLoading(true);
    setError('');
    payrollService
      .getMyPayroll()
      .then((data) => {
        setRecords(data);
        if (data.length > 0) {
          setSelectedRecord(data[0]); // Default to latest month
        }
      })
      .catch(() => setError('Failed to load your payroll slips.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadPayroll, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Payroll</h1>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">View your monthly salary slips and detailed salary structures.</p>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={loadPayroll} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="skeleton h-60 rounded-[var(--radius-card)]" />
          <div className="skeleton h-60 rounded-[var(--radius-card)] md:col-span-2" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No payroll slips yet."
          description="Your payroll slips will appear here once processed by HR."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Payslips Sidebar List */}
          <div className="flex flex-col gap-3">
            <h2 className="font-semibold text-lg text-[var(--color-ink)]">Payslips</h2>
            <div className="flex flex-col gap-2.5 overflow-hidden">
              {records.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                const isPaid = r.paymentStatus === 'paid';
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRecord(r)}
                    className={`flex items-center justify-between rounded-[var(--radius-card)] border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-sm'
                        : 'border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-2)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? 'bg-white text-[var(--color-primary)]' : 'bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]'}`}>
                        <Calendar size={18} />
                      </span>
                      <div>
                        <p className="font-medium text-[var(--color-ink)]">
                          {new Date(r.month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          Net: ₹{r.salaryStructure.net_salary.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isPaid ? 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]' : 'bg-[var(--color-status-absent-soft)] text-[var(--color-status-absent)]'}`}>
                      {isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payslip Detailed Breakdown */}
          {selectedRecord && (
            <div className="md:col-span-2 flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-3 border-b border-[var(--color-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[var(--color-ink)]">
                    Salary Slip - {new Date(selectedRecord.month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-[var(--color-ink-faint)]">Slip ID: {selectedRecord.id}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${selectedRecord.paymentStatus === 'paid' ? 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]' : 'bg-[var(--color-status-absent-soft)] text-[var(--color-status-absent)]'}`}>
                    {selectedRecord.paymentStatus === 'paid' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    Payment: {selectedRecord.paymentStatus.toUpperCase()}
                  </span>
                  {selectedRecord.paymentDate && (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">Paid on {formatDate(selectedRecord.paymentDate)}</p>
                  )}
                </div>
              </div>

              {/* High-level gross / net cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-2)] p-4">
                  <p className="text-xs text-[var(--color-ink-soft)]">Gross Salary</p>
                  <p className="text-xl font-bold text-[var(--color-ink)] mt-1">₹{selectedRecord.salaryStructure.gross_salary.toLocaleString()}</p>
                </div>
                <div className="rounded-[var(--radius-control)] bg-[var(--color-primary-soft)] p-4">
                  <p className="text-xs text-[var(--color-primary-dark)]">Take Home (Net)</p>
                  <p className="text-xl font-bold text-[var(--color-primary)] mt-1">₹{selectedRecord.salaryStructure.net_salary.toLocaleString()}</p>
                </div>
              </div>

              {/* Detailed items */}
              <div>
                <h4 className="font-semibold text-sm text-[var(--color-ink)] mb-2.5">Salary Breakdowns</h4>
                <div className="rounded-[var(--radius-control)] border border-[var(--color-line)]">
                  <div className="grid grid-cols-2 border-b border-[var(--color-line)] p-3 text-sm hover:bg-[var(--color-surface-2)]/30">
                    <span className="text-[var(--color-ink-soft)]">Basic Pay</span>
                    <span className="font-mono text-right font-medium text-[var(--color-ink)]">₹{selectedRecord.salaryStructure.basic.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-[var(--color-line)] p-3 text-sm hover:bg-[var(--color-surface-2)]/30">
                    <span className="text-[var(--color-ink-soft)]">House Rent Allowance (HRA)</span>
                    <span className="font-mono text-right font-medium text-[var(--color-ink)]">₹{selectedRecord.salaryStructure.hra.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-[var(--color-line)] p-3 text-sm hover:bg-[var(--color-surface-2)]/30">
                    <span className="text-[var(--color-ink-soft)]">Allowances (Special, Travel, etc.)</span>
                    <span className="font-mono text-right font-medium text-[var(--color-ink)]">₹{selectedRecord.salaryStructure.allowances.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 p-3 text-sm hover:bg-[var(--color-surface-2)]/30">
                    <span className="text-[var(--color-danger)] font-medium">Deductions (TDS, PF, etc.)</span>
                    <span className="font-mono text-right font-medium text-[var(--color-danger)]">- ₹{selectedRecord.salaryStructure.deductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--color-line)] bg-slate-50 p-3 text-xs text-[var(--color-ink-soft)]">
                Note: This pay slip is generated electronically by the Northgate HR system and does not require a physical signature. For clarifications, please contact the HR payroll helpdesk.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
