import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Lock, Wallet, CalendarDays } from 'lucide-react';
import Button from '../../../components/ui/Button';
import FormField, { inputClasses } from '../../../components/ui/FormField';
import PageSpinner from '../../../components/ui/PageSpinner';
import ErrorState from '../../../components/ui/ErrorState';
import { useToast } from '../../../hooks/useToast';
import * as employeeService from '../../../services/employeeService';
import { calculateSalary, describeCalculation, newComponentId } from '../../../utils/salary';
import { formatINR } from '../../../utils/formatters';
import { COMPONENT_TYPE, COMPONENT_TYPE_LABEL, CALC_METHOD, CALC_METHOD_LABEL, CALC_BASIS, CALC_BASIS_LABEL } from '../../../utils/constants';

const selectClasses = `${inputClasses(false)} h-9 text-[13px]`;
const numberClasses = `${inputClasses(false)} h-9 text-[13px] font-mono`;

function findComponent(components, key) {
  return components.find((c) => c.key === key);
}

export default function SalaryInfoTab({ employee, currentUser, onDirty }) {
  const toast = useToast();
  const [salary, setSalary] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setLoadError('');
    setForbidden(false);
    employeeService
      .getEmployeeSalary(employee.id, currentUser)
      .then((data) => {
        if (!mounted) return;
        setSalary(data);
      })
      .catch((err) => {
        if (!mounted) return;
        if (err.code === 'FORBIDDEN') setForbidden(true);
        else setLoadError('We ran into a problem loading salary information.');
      })
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-10 text-center">
        <Lock size={22} className="text-[var(--color-ink-faint)]" />
        <p className="text-sm font-medium text-[var(--color-ink)]">Access restricted</p>
        <p className="max-w-sm text-sm text-[var(--color-ink-faint)]">
          Salary information is only visible to Admin accounts.
        </p>
      </div>
    );
  }

  if (isLoading) return <PageSpinner label="Loading salary information…" />;
  if (loadError) return <ErrorState description={loadError} />;
  if (!salary) return null;

  const active = isEditing ? draft : salary;
  const computed = calculateSalary(active);
  const pf = findComponent(active.components, 'pf');
  const tax = findComponent(active.components, 'professionalTax');

  const startEdit = () => {
    setDraft({ ...salary, components: salary.components.map((c) => ({ ...c })) });
    setIsEditing(true);
    onDirty?.(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    onDirty?.(false);
  };

  const updateDraft = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const updateComponent = (id, patch) =>
    setDraft((d) => ({ ...d, components: d.components.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const removeComponent = (id) => setDraft((d) => ({ ...d, components: d.components.filter((c) => c.id !== id) }));

  const addComponent = () =>
    setDraft((d) => ({
      ...d,
      components: [
        ...d.components,
        {
          id: newComponentId(),
          name: '',
          type: COMPONENT_TYPE.EARNING,
          calcMethod: CALC_METHOD.FIXED,
          basis: CALC_BASIS.WAGE,
          value: 0,
        },
      ],
    }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await employeeService.updateEmployeeSalary(employee.id, draft, currentUser);
      setSalary(updated);
      setIsEditing(false);
      onDirty?.(false);
      toast.success('Salary configuration saved.');
    } catch (err) {
      toast.error(err.code === 'FORBIDDEN' ? "You don't have permission to save salary changes." : 'Unable to save salary changes right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-accent-dark)]">
          <Lock size={12} />
          Admin only
        </p>
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

      {/* Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
          <h3 className="flex items-center gap-2 font-display text-[15px] font-semibold text-[var(--color-ink)]">
            <Wallet size={16} className="text-[var(--color-primary)]" />
            Salary Overview
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Monthly Wage</p>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={draft.monthlyWage}
                  onChange={(e) => updateDraft({ monthlyWage: Number(e.target.value) })}
                  className={`${numberClasses} mt-1 w-40`}
                />
              ) : (
                <p className="mt-0.5 font-display text-xl font-semibold text-[var(--color-ink)]">
                  {formatINR(computed.monthlyWage)} <span className="text-sm font-normal text-[var(--color-ink-faint)]">/ Month</span>
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Yearly Wage</p>
              <p className="mt-0.5 font-display text-xl font-semibold text-[var(--color-ink)]">
                {formatINR(computed.yearlyWage)} <span className="text-sm font-normal text-[var(--color-ink-faint)]">/ Year</span>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
          <h3 className="flex items-center gap-2 font-display text-[15px] font-semibold text-[var(--color-ink)]">
            <CalendarDays size={16} className="text-[var(--color-primary)]" />
            Working Schedule
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Working Days</p>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={draft.workingDaysPerWeek}
                  onChange={(e) => updateDraft({ workingDaysPerWeek: Number(e.target.value) })}
                  className={`${numberClasses} mt-1`}
                />
              ) : (
                <p className="mt-0.5 text-sm font-medium text-[var(--color-ink)]">{salary.workingDaysPerWeek} days / week</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Working Hours</p>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={draft.workingHoursPerDay}
                  onChange={(e) => updateDraft({ workingHoursPerDay: Number(e.target.value) })}
                  className={`${numberClasses} mt-1`}
                />
              ) : (
                <p className="mt-0.5 text-sm font-medium text-[var(--color-ink)]">{salary.workingHoursPerDay} hrs / day</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Break Time</p>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={draft.breakTimeMinutes}
                  onChange={(e) => updateDraft({ breakTimeMinutes: Number(e.target.value) })}
                  className={`${numberClasses} mt-1`}
                />
              ) : (
                <p className="mt-0.5 text-sm font-medium text-[var(--color-ink)]">{salary.breakTimeMinutes} min</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Salary Components table */}
      <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Salary Components</h3>
          {isEditing && (
            <Button type="button" variant="outline" size="sm" onClick={addComponent}>
              <Plus size={14} />
              Add Component
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)] sm:grid">
            <span className="col-span-4">Component</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-4">Calculation</span>
            <span className="col-span-2 text-right">Amount</span>
          </div>

          {computed.components.map((component) => (
            <div
              key={component.id}
              className="grid grid-cols-2 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-line)] p-2.5 sm:grid-cols-12"
            >
              {isEditing ? (
                <>
                  <input
                    value={component.name}
                    onChange={(e) => updateComponent(component.id, { name: e.target.value })}
                    placeholder="Component name"
                    className={`${inputClasses(false)} col-span-2 h-9 text-[13px] sm:col-span-4`}
                  />
                  <select
                    value={component.type}
                    onChange={(e) => updateComponent(component.id, { type: e.target.value })}
                    className={`${selectClasses} col-span-1 sm:col-span-2`}
                  >
                    {Object.values(COMPONENT_TYPE).map((t) => (
                      <option key={t} value={t}>
                        {COMPONENT_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                  <div className="col-span-2 flex gap-1.5 sm:col-span-4">
                    <select
                      value={component.calcMethod}
                      onChange={(e) => updateComponent(component.id, { calcMethod: e.target.value })}
                      className={`${selectClasses} w-1/2`}
                    >
                      {Object.values(CALC_METHOD).map((m) => (
                        <option key={m} value={m}>
                          {CALC_METHOD_LABEL[m]}
                        </option>
                      ))}
                    </select>
                    {component.calcMethod === CALC_METHOD.PERCENTAGE ? (
                      <select
                        value={component.basis}
                        onChange={(e) => updateComponent(component.id, { basis: e.target.value })}
                        className={`${selectClasses} w-1/2`}
                      >
                        {Object.values(CALC_BASIS).map((b) => (
                          <option key={b} value={b}>
                            {CALC_BASIS_LABEL[b]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={component.value}
                        onChange={(e) => updateComponent(component.id, { value: Number(e.target.value) })}
                        className={`${numberClasses} w-1/2`}
                      />
                    )}
                  </div>
                  {component.calcMethod === CALC_METHOD.PERCENTAGE && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={component.value}
                      onChange={(e) => updateComponent(component.id, { value: Number(e.target.value) })}
                      className={`${numberClasses} col-span-1 sm:col-span-1`}
                    />
                  )}
                  <div
                    className={`col-span-1 flex items-center justify-end gap-2 ${
                      component.calcMethod === CALC_METHOD.PERCENTAGE ? 'sm:col-span-1' : 'sm:col-span-2'
                    }`}
                  >
                    <span className="whitespace-nowrap font-mono text-sm text-[var(--color-ink)]">{formatINR(component.amount)}</span>
                    <button
                      type="button"
                      onClick={() => removeComponent(component.id)}
                      aria-label={`Remove ${component.name || 'component'}`}
                      className="rounded-full p-1 text-[var(--color-ink-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="col-span-2 text-sm font-medium text-[var(--color-ink)] sm:col-span-4">{component.name}</span>
                  <span
                    className={`col-span-1 w-fit rounded-full px-2 py-0.5 text-xs font-medium sm:col-span-2 ${
                      component.type === COMPONENT_TYPE.EARNING
                        ? 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]'
                        : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                    }`}
                  >
                    {COMPONENT_TYPE_LABEL[component.type]}
                  </span>
                  <span className="col-span-1 text-sm text-[var(--color-ink-soft)] sm:col-span-4">{describeCalculation(component)}</span>
                  <span className="col-span-2 text-right font-mono text-sm text-[var(--color-ink)] sm:col-span-2">
                    {formatINR(component.amount)}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PF + Professional Tax quick config */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
          <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Provident Fund (PF) Contribution</h3>
          {pf ? (
            isEditing ? (
              <div className="mt-3 flex items-end gap-3">
                <FormField label="PF Percentage" htmlFor="pfValue">
                  <input
                    id="pfValue"
                    type="number"
                    min="0"
                    max="100"
                    value={pf.value}
                    onChange={(e) => updateComponent(pf.id, { value: Number(e.target.value) })}
                    className={numberClasses}
                  />
                </FormField>
                <FormField label="Calculation Basis" htmlFor="pfBasis">
                  <select
                    id="pfBasis"
                    value={pf.basis}
                    onChange={(e) => updateComponent(pf.id, { basis: e.target.value })}
                    className={selectClasses}
                  >
                    {Object.values(CALC_BASIS).map((b) => (
                      <option key={b} value={b}>
                        {CALC_BASIS_LABEL[b]}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                {pf.value}% of {pf.basis === CALC_BASIS.BASIC ? 'Basic Salary' : 'Wage'} ={' '}
                <span className="font-mono font-medium text-[var(--color-ink)]">{formatINR(pf.amount)}</span> / month
              </p>
            )
          ) : (
            <p className="mt-2 text-sm text-[var(--color-ink-faint)]">No PF component configured.</p>
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
          <h3 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Professional Tax</h3>
          {tax ? (
            isEditing ? (
              <div className="mt-3">
                <FormField label="Professional Tax (Fixed)" htmlFor="taxValue">
                  <input
                    id="taxValue"
                    type="number"
                    min="0"
                    value={tax.value}
                    onChange={(e) => updateComponent(tax.id, { value: Number(e.target.value) })}
                    className={`${numberClasses} w-40`}
                  />
                </FormField>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Fixed deduction of <span className="font-mono font-medium text-[var(--color-ink)]">{formatINR(tax.amount)}</span> / month
              </p>
            )
          ) : (
            <p className="mt-2 text-sm text-[var(--color-ink-faint)]">No Professional Tax component configured.</p>
          )}
        </section>
      </div>

      {/* Summary */}
      <section className="grid grid-cols-1 gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-primary-soft)] p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]/80">Gross Salary</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-[var(--color-primary-dark)]">{formatINR(computed.gross)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]/80">Total Deductions</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-[var(--color-primary-dark)]">{formatINR(computed.totalDeductions)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]/80">Net Salary</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-[var(--color-primary-dark)]">{formatINR(computed.net)}</p>
        </div>
      </section>
    </div>
  );
}
