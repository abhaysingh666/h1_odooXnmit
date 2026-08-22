import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeIndianRupee,
  CalendarClock,
  Coffee,
  Download,
  Landmark,
  Pencil,
  PiggyBank,
  Receipt,
  RotateCcw,
  Save,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { payrollAPI } from '@/services/api';
import { cn, errorMessage } from '@/lib/utils';
import { money, monthLabel, recentMonths } from '@/lib/hrms';
import { COMPUTATIONS, buildStructure, componentOverflow } from '@/lib/salary';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/PageHeader';

/**
 * Salary Info tab — read-only for the employee, editable for HR.
 *
 * The wage is the single input: every component is derived from it by its own
 * computation rule, the balancing line absorbs the remainder, and the totals can
 * therefore never exceed the wage. The preview recomputes locally as the admin
 * types (see `src/lib/salary.js`), then the server recomputes on save and its
 * answer wins.
 */
export function SalaryTab({ employeeId, isSelf }) {
  const { success, error: notifyError } = useToast();

  const [server, setServer] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = isSelf ? await payrollAPI.mine() : await payrollAPI.forEmployee(employeeId);
      setServer(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load salary information.'));
    } finally {
      setLoading(false);
    }
  }, [employeeId, isSelf]);

  useEffect(() => {
    load();
  }, [load]);

  function startEditing() {
    setDraft({
      monthly_wage: server.monthly_wage ?? 0,
      working_days_per_week: server.working_days_per_week ?? 5,
      hours_per_day: server.hours_per_day ?? 8,
      break_minutes: server.break_minutes ?? 60,
      pf_employee_percent: server.pf_employee_percent ?? 12,
      pf_employer_percent: server.pf_employer_percent ?? 12,
      professional_tax: server.professional_tax ?? 200,
      components: (server.components ?? []).map((component) => ({
        key: component.key,
        label: component.label,
        computation: component.computation,
        value: component.value,
        description: component.description ?? null,
      })),
    });
    setEditing(true);
  }

  // While editing, the numbers on screen come from the local mirror so they
  // track the wage keystroke by keystroke.
  const preview = useMemo(() => (draft ? buildStructure(draft) : null), [draft]);
  const overflow = useMemo(
    () => (draft ? componentOverflow(draft.monthly_wage, draft.components) : 0),
    [draft]
  );

  const view = editing ? { ...server, ...preview, ...draft, components: preview.components } : server;

  function setDraftField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function setComponent(index, patch) {
    setDraft((current) => ({
      ...current,
      components: current.components.map((component, position) =>
        position === index ? { ...component, ...patch } : component
      ),
    }));
  }

  async function save() {
    if (overflow > 0) {
      notifyError('Components exceed the wage', `Reduce them by ${money(overflow, true)} or raise the wage.`);
      return;
    }

    setSaving(true);
    try {
      const { data } = await payrollAPI.update(employeeId, {
        monthly_wage: Number(draft.monthly_wage) || 0,
        working_days_per_week: Number(draft.working_days_per_week) || 5,
        hours_per_day: Number(draft.hours_per_day) || 8,
        break_minutes: Number(draft.break_minutes) || 0,
        pf_employee_percent: Number(draft.pf_employee_percent) || 0,
        pf_employer_percent: Number(draft.pf_employer_percent) || 0,
        professional_tax: Number(draft.professional_tax) || 0,
        components: draft.components.map((component) => ({
          key: component.key,
          label: component.label,
          computation: component.computation,
          value: Number(component.value) || 0,
          description: component.description || undefined,
        })),
      });
      setServer(data);
      setEditing(false);
      setDraft(null);
      success('Salary structure saved', `${data.employee_name} is on ${money(data.monthly_wage)} a month.`);
    } catch (err) {
      notifyError('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SalarySkeleton />;

  if (error) {
    return (
      <Alert tone="error" title="Salary information unavailable">
        {error}
      </Alert>
    );
  }

  if (!view) return null;

  const canEdit = Boolean(server.can_edit);

  return (
    <div className="space-y-5">
      {!server.is_configured && (
        <Alert tone="warning" title="No salary structure yet">
          {canEdit
            ? 'The default components are pre-filled below — set a monthly wage and save to activate payroll for this employee.'
            : 'HR has not set up your salary structure yet. Payslips will appear here once they do.'}
        </Alert>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {editing
              ? 'Editing — amounts update live and are recomputed on save.'
              : 'Wage type: fixed wage. Every component is derived from the monthly wage.'}
          </p>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setDraft(null);
                  }}
                  disabled={saving}
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Discard
                </Button>
                <Button onClick={save} loading={saving} disabled={overflow > 0}>
                  <Save className="size-4" aria-hidden="true" />
                  Save structure
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={startEditing}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit salary
              </Button>
            )}
          </div>
        </div>
      )}

      {editing && overflow > 0 && (
        <Alert tone="error" title="Components exceed the wage">
          The components other than the balancing line add up to {money(overflow, true)} more than the
          monthly wage. Lower a percentage or raise the wage before saving.
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4 text-primary" aria-hidden="true" />
              Wage
            </CardTitle>
            <CardDescription>Fixed monthly wage and the working pattern it is paid against.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Month Wage"
                suffix="/Month"
                value={view.monthly_wage}
                editing={editing}
                onChange={(value) => setDraftField('monthly_wage', value)}
                display={money(view.monthly_wage)}
                icon={BadgeIndianRupee}
              />
              <ReadonlyField
                label="Yearly wage"
                suffix="/Yearly"
                value={money(view.yearly_wage)}
                icon={TrendingUp}
              />
              <NumberField
                label="Working days in a week"
                value={view.working_days_per_week}
                editing={editing}
                onChange={(value) => setDraftField('working_days_per_week', value)}
                display={`${view.working_days_per_week} days`}
                min={1}
                max={7}
                icon={CalendarClock}
              />
              <NumberField
                label="Break Time"
                suffix="/hrs"
                value={view.break_minutes}
                editing={editing}
                onChange={(value) => setDraftField('break_minutes', value)}
                display={`${(Number(view.break_minutes) / 60).toFixed(2)} hrs`}
                min={0}
                max={480}
                icon={Coffee}
                hint={editing ? 'In minutes — deducted from each day’s work hours.' : undefined}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4 text-primary" aria-hidden="true" />
              Monthly summary
            </CardTitle>
            <CardDescription>Before any attendance pro-rating.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <SummaryLine label="Gross earnings" value={money(view.gross_monthly, true)} />
            <SummaryLine
              label={`Provident fund (employee ${view.pf_employee_percent}%)`}
              value={`− ${money(view.pf_employee_amount, true)}`}
              muted
            />
            <SummaryLine label="Professional tax" value={`− ${money(view.professional_tax, true)}`} muted />
            <div className="my-1 border-t border-border/70" />
            <SummaryLine label="Net take-home" value={money(view.net_monthly, true)} strong />
            <SummaryLine
              label="Cost to company"
              value={money(view.cost_to_company, true)}
              hint={`Includes employer PF of ${money(view.pf_employer_amount, true)}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salary Components</CardTitle>
          <CardDescription>
            Each line is a fixed amount or a percentage; the balancing line is the wage minus
            everything else, so the total is always exactly the wage.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Computation Type</TableHead>
                <TableHead className="w-32 text-right">Value</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24 text-right">% of wage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.components.map((component, index) => {
                const isBalance = component.computation === 'balance';
                return (
                  <TableRow key={component.key}>
                    <TableCell>
                      <p className="font-medium">{component.label}</p>
                      {component.description && (
                        <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                          {component.description}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      {editing && !isBalance ? (
                        <Select
                          value={component.computation}
                          onChange={(event) =>
                            setComponent(index, { computation: event.target.value })
                          }
                          className="h-9 w-44"
                        >
                          {COMPUTATIONS.filter((option) => option.value !== 'balance').map(
                            (option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            )
                          )}
                        </Select>
                      ) : (
                        <Badge variant={isBalance ? 'accent' : 'subtle'} className="font-normal">
                          {COMPUTATIONS.find((option) => option.value === component.computation)
                            ?.label ?? component.computation}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {editing && !isBalance ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={component.value ?? 0}
                          onChange={(event) => setComponent(index, { value: event.target.value })}
                          className="h-9 w-28 text-right tabular-nums"
                        />
                      ) : (
                        <span className="tabular-nums text-muted-foreground">
                          {component.computation === 'fixed'
                            ? money(component.value, true)
                            : `${Number(component.value ?? 0).toFixed(2)}%`}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-medium tabular-nums">
                      {money(component.amount, true)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {Number(component.percent_of_wage ?? 0).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow className="bg-muted/40">
                <TableCell className="font-semibold">Gross salary</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right font-semibold tabular-nums">
                  {money(view.gross_monthly, true)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">100.00%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="size-4 text-primary" aria-hidden="true" />
              Provident Fund
            </CardTitle>
            <CardDescription>Calculated on Basic Salary.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Employee contribution"
              suffix="%"
              value={view.pf_employee_percent}
              editing={editing}
              onChange={(value) => setDraftField('pf_employee_percent', value)}
              display={`${view.pf_employee_percent}% · ${money(view.pf_employee_amount, true)}`}
              min={0}
              max={100}
            />
            <NumberField
              label="Employer contribution"
              suffix="%"
              value={view.pf_employer_percent}
              editing={editing}
              onChange={(value) => setDraftField('pf_employer_percent', value)}
              display={`${view.pf_employer_percent}% · ${money(view.pf_employer_amount, true)}`}
              min={0}
              max={100}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4 text-primary" aria-hidden="true" />
              Tax Deductions
            </CardTitle>
            <CardDescription>Flat statutory deduction, not pro-rated by attendance.</CardDescription>
          </CardHeader>
          <CardContent>
            <NumberField
              label="Professional Tax"
              suffix="/month"
              value={view.professional_tax}
              editing={editing}
              onChange={(value) => setDraftField('professional_tax', value)}
              display={money(view.professional_tax, true)}
              min={0}
            />
          </CardContent>
        </Card>
      </div>

      <PayslipCard employeeId={employeeId} isSelf={isSelf} configured={server.is_configured} />
    </div>
  );
}

/** Month-by-month payslip, pro-rated by the attendance the employee actually has. */
function PayslipCard({ employeeId, isSelf, configured }) {
  const months = useMemo(() => recentMonths(12), []);
  const [period, setPeriod] = useState(months[0]);
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const request = isSelf
      ? payrollAPI.myPayslip({ year: period.year, month: period.month })
      : payrollAPI.payslip(employeeId, { year: period.year, month: period.month });

    request
      .then(({ data }) => {
        if (cancelled) return;
        setPayslip(data);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setPayslip(null);
        setError(errorMessage(err, 'Could not build a payslip for that month.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId, isSelf, period, configured]);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-4 text-primary" aria-hidden="true" />
            Payslip
          </CardTitle>
          <CardDescription>
            Earnings are scaled by payable days, so unpaid leave and missing attendance reduce the
            payout automatically.
          </CardDescription>
        </div>

        <Select
          value={period.value}
          onChange={(event) =>
            setPeriod(months.find((month) => month.value === event.target.value) ?? months[0])
          }
          className="h-9 w-44 shrink-0"
          aria-label="Payslip month"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </Select>
      </CardHeader>

      <CardContent className={cn(payslip && 'p-0')}>
        {!configured ? (
          <EmptyState
            icon={Receipt}
            title="No payslips yet"
            description="Once a salary structure is saved, a payslip is generated for every month from the attendance on record."
          />
        ) : loading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-muted-foreground">{error}</p>
        ) : (
          <>
            <div className="grid gap-3 border-b border-border/60 p-5 sm:grid-cols-4">
              <PayslipStat label="Period" value={payslip.label || monthLabel(period.year, period.month)} />
              <PayslipStat
                label="Payable days"
                value={`${payslip.payable_days} / ${payslip.total_working_days}`}
                hint={`${payslip.payable_ratio}% of the month`}
              />
              <PayslipStat label="Unpaid days" value={payslip.unpaid_days} />
              <PayslipStat label="Net pay" value={money(payslip.net_pay, true)} strong />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Earning</TableHead>
                  <TableHead className="text-right">Full month</TableHead>
                  <TableHead className="text-right">This month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslip.lines.map((line) => (
                  <TableRow key={line.key}>
                    <TableCell className="font-medium">{line.label}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {money(line.full_amount, true)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(line.amount, true)}</TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-muted/40">
                  <TableCell className="font-semibold">Gross</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold tabular-nums">
                    {money(payslip.gross, true)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Provident fund (employee)</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    − {money(payslip.pf_employee, true)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Professional tax</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    − {money(payslip.professional_tax, true)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-primary/6">
                  <TableCell className="font-semibold">Net pay</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold tabular-nums">
                    {money(payslip.net_pay, true)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PayslipStat({ label, value, hint, strong }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('tabular-nums', strong ? 'text-lg font-semibold' : 'font-medium')}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NumberField({
  label,
  value,
  display,
  editing,
  onChange,
  suffix,
  icon: Icon,
  hint,
  ...props
}) {
  const id = `salary-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />}
        {label}
        {suffix && <span className="font-normal text-muted-foreground">{suffix}</span>}
      </Label>

      {editing ? (
        <Input
          id={id}
          type="number"
          value={value ?? 0}
          onChange={(event) => onChange(event.target.value)}
          className="tabular-nums"
          {...props}
        />
      ) : (
        <p className="text-lg font-semibold tabular-nums">{display}</p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadonlyField({ label, value, suffix, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />}
        {label}
        {suffix && <span className="font-normal text-muted-foreground">{suffix}</span>}
      </Label>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value, muted, strong, hint }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={cn('text-sm', muted ? 'text-muted-foreground' : 'font-medium')}>
        {label}
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className={cn('shrink-0 tabular-nums', strong ? 'text-lg font-semibold' : 'text-sm font-medium')}>
        {value}
      </span>
    </div>
  );
}

function SalarySkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
