import { useCallback, useEffect, useState } from 'react';
import { DollarSign, Edit, Plus, Search, Users } from 'lucide-react';

import { employeeAPI, payrollAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/utils';
import { monthLabel, recentMonths } from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

/**
 * Payroll Management - Admin creates payslips, employees view their salary
 */
export default function PayrollPage() {
  const { isAdmin } = useAuth();

  return (
    <>
      <PageHeader
        title="Payroll Management"
        description={
          isAdmin
            ? 'Process payroll, update salary structures, and manage payments.'
            : 'View your salary structure and payslip history.'
        }
        icon={DollarSign}
      />

      {isAdmin ? <AdminPayrollManagement /> : <EmployeePayrollView />}
    </>
  );
}

/* ── Admin: Payroll Management with Create Payslip ────────────────────────── */

function AdminPayrollManagement() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await employeeAPI.list({ q: search || undefined });
      setEmployees(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load employees.'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Payroll Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage employee salaries and generate payslips
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="size-4" />
            Create Payroll Slip
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="px-6 pb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              icon={Search}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Gross Salary</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-right">Payment Date</TableHead>
                <TableHead className="w-px">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !employees.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="No employees found"
                      description="Add employees to start managing payroll."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <PayrollRow
                    key={emp._id}
                    employee={emp}
                    onEdit={() => {
                      setSelectedEmployee(emp);
                      setShowCreateDialog(true);
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreatePayslipDialog
        open={showCreateDialog}
        employee={selectedEmployee}
        onClose={() => {
          setShowCreateDialog(false);
          setSelectedEmployee(null);
        }}
        onSaved={() => {
          setShowCreateDialog(false);
          setSelectedEmployee(null);
          load();
        }}
      />
    </>
  );
}

function PayrollRow({ employee, onEdit }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSalary() {
      setLoading(true);
      try {
        const { data } = await payrollAPI.forEmployee(employee._id);
        setSalary(data);
      } catch (err) {
        setSalary(null);
      } finally {
        setLoading(false);
      }
    }
    loadSalary();
  }, [employee._id]);

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={7}>
          <Skeleton className="h-12 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  const now = new Date();
  const currentMonth = monthLabel(now.getFullYear(), now.getMonth() + 1);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar src={employee.avatar_url} name={employee.name} size="sm" />
          <div>
            <p className="font-medium text-sm">{employee.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{employee.login_id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>{currentMonth}</TableCell>
      <TableCell className="text-right font-mono">
        {salary?.gross_monthly ? `₹${salary.gross_monthly.toLocaleString()}` : '—'}
      </TableCell>
      <TableCell className="text-right font-mono text-destructive">
        {salary?.total_deductions ? `₹${salary.total_deductions.toLocaleString()}` : '—'}
      </TableCell>
      <TableCell className="text-right font-mono font-semibold">
        {salary?.net_monthly ? `₹${salary.net_monthly.toLocaleString()}` : '—'}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon-sm" onClick={onEdit}>
          <Edit className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

/* ── Create Payroll Slip Dialog ──────────────────────────────────────────── */

function CreatePayslipDialog({ open, employee, onClose, onSaved }) {
  const { success, error: notifyError } = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    basic_pay: '',
    hra: '',
    allowances: '',
    deductions: '',
    payment_status: 'pending',
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Load employees for dropdown
  useEffect(() => {
    if (!open) return;
    
    async function loadEmployees() {
      try {
        const { data } = await employeeAPI.list();
        setEmployees(data);
        if (employee) {
          setSelectedEmpId(employee._id);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    }
    
    loadEmployees();
  }, [open, employee]);

  // Load salary structure when employee selected
  useEffect(() => {
    if (!selectedEmpId) return;

    async function loadSalary() {
      setFetching(true);
      try {
        const { data } = await payrollAPI.forEmployee(selectedEmpId);
        setForm((current) => ({
          ...current,
          basic_pay: data.basic || '',
          hra: data.hra || '',
          allowances: data.special_allowance || '',
        }));
      } catch (err) {
        setForm((current) => ({
          ...current,
          basic_pay: '',
          hra: '',
          allowances: '',
        }));
      } finally {
        setFetching(false);
      }
    }

    loadSalary();
  }, [selectedEmpId]);

  const update = (key) => (e) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmpId) {
      setError('Please select an employee');
      return;
    }

    const basicPay = parseFloat(form.basic_pay) || 0;
    const hra = parseFloat(form.hra) || 0;
    const allowances = parseFloat(form.allowances) || 0;

    const monthlyWage = basicPay + hra + allowances;

    if (monthlyWage <= 0) {
      setError('Salary components must add up to more than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await payrollAPI.update(selectedEmpId, {
        monthly_wage: monthlyWage,
      });

      success('Payslip created', 'Payroll slip has been generated successfully.');
      onSaved?.();
    } catch (err) {
      const msg = errorMessage(err, 'Could not create payslip');
      notifyError('Creation failed', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const basicPay = parseFloat(form.basic_pay) || 0;
  const hra = parseFloat(form.hra) || 0;
  const allowances = parseFloat(form.allowances) || 0;
  const deductions = parseFloat(form.deductions) || 0;
  const grossSalary = basicPay + hra + allowances;
  const netTakeHome = grossSalary - deductions;

  const months = recentMonths(12);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create Payroll Slip"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="payslip-form" loading={loading}>
            {loading ? 'Saving...' : 'Save Payroll'}
          </Button>
        </>
      }
    >
      {fetching ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading employee data...</div>
      ) : (
        <form id="payslip-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Employee<span className="text-destructive ml-0.5">*</span>
              </label>
              <Select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                disabled={loading || !!employee}
                required
              >
                <option value="">Choose employee...</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.login_id})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Payroll Month<span className="text-destructive ml-0.5">*</span>
              </label>
              <Select
                value={`${form.year}-${form.month}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  setForm((current) => ({ ...current, year, month }));
                }}
                disabled={loading}
                required
              >
                {months.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {monthLabel(m.year, m.month)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-3">SALARY COMPONENT BREAKDOWN</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="basic_pay" className="text-sm font-medium">Basic Pay (₹)</label>
                <Input
                  id="basic_pay"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.basic_pay}
                  onChange={update('basic_pay')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hra" className="text-sm font-medium">HRA (₹)</label>
                <Input
                  id="hra"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.hra}
                  onChange={update('hra')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="allowances" className="text-sm font-medium">Allowances (₹)</label>
                <Input
                  id="allowances"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.allowances}
                  onChange={update('allowances')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="deductions" className="text-sm font-medium">Deductions (₹)</label>
                <Input
                  id="deductions"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={form.deductions}
                  onChange={update('deductions')}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="payment_status" className="text-sm font-medium">Payment Status</label>
            <Select
              id="payment_status"
              value={form.payment_status}
              onChange={update('payment_status')}
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gross Salary:</span>
              <span className="font-semibold">₹{grossSalary.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Net Take-Home:</span>
              <span className="font-bold text-primary text-lg">₹{netTakeHome.toLocaleString()}</span>
            </div>
          </div>

          {error && <Alert tone="error" title="Validation error">{error}</Alert>}
        </form>
      )}
    </Dialog>
  );
}

/* ── Employee View ─────────────────────────────────────────────────────────── */

function EmployeePayrollView() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [salary, setSalary] = useState(null);
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [salaryRes, payslipRes] = await Promise.all([
        payrollAPI.mine(),
        payrollAPI.myPayslip({ year: period.year, month: period.month }),
      ]);

      setSalary(salaryRes.data);
      setPayslip(payslipRes.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load payroll data.'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const months = recentMonths(12);

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold">Payslip Period</h2>
        <Select
          value={`${period.year}-${period.month}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-').map(Number);
            setPeriod({ year, month });
          }}
          className="w-48"
        >
          {months.map((m) => (
            <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
              {monthLabel(m.year, m.month)}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Payslip - {monthLabel(period.year, period.month)}</CardTitle>
            </CardHeader>
            {payslip ? (
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employee</p>
                    <p className="font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Login ID</p>
                    <p className="font-mono">{user?.login_id}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-mono">₹{payslip.basic?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Net Pay</span>
                    <span className="text-primary text-xl">₹{payslip.net_pay?.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <EmptyState
                  icon={DollarSign}
                  title="No payslip available"
                  description="Payslip for this period has not been generated yet."
                />
              </CardContent>
            )}
          </Card>

          {salary && (
            <Card>
              <CardHeader>
                <CardTitle>Salary Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic</span>
                  <span className="font-mono">₹{salary.basic?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HRA</span>
                  <span className="font-mono">₹{salary.hra?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Annual CTC</span>
                  <span className="text-primary">₹{salary.ctc?.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
