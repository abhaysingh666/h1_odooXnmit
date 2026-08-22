// ---------------------------------------------------------------------------
// Salary calculation
//
// Pure, reusable functions for turning a salary configuration (monthly wage
// + a list of components) into computed amounts. Used by SalaryInfoTab and
// by employeeService before persisting, so the numbers shown in the UI and
// the numbers saved are always derived the same way.
// ---------------------------------------------------------------------------
import { CALC_METHOD, CALC_BASIS, COMPONENT_TYPE } from './constants';

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Resolves a single component's amount given the wage and the already-known
 * basic salary amount.
 */
export function resolveComponentAmount(component, { wage = 0, basic = 0 } = {}) {
  if (!component) return 0;
  if (component.calcMethod === CALC_METHOD.FIXED) {
    return round2(component.value);
  }
  const base = component.basis === CALC_BASIS.BASIC ? basic : wage;
  return round2((base * (Number(component.value) || 0)) / 100);
}

/**
 * Computes amounts for every component plus gross/deductions/net totals.
 *
 * Basic Salary (the component flagged `isBasic: true`) is always resolved
 * against the wage first, since every other "% of Basic" component depends
 * on it.
 *
 * @param {{ monthlyWage: number, components: object[] }} salary
 */
export function calculateSalary(salary) {
  const wage = Number(salary?.monthlyWage) || 0;
  const components = Array.isArray(salary?.components) ? salary.components : [];

  const basicComponent = components.find((c) => c.isBasic);
  const basicAmount = basicComponent ? resolveComponentAmount(basicComponent, { wage, basic: 0 }) : 0;

  const resolved = components.map((c) => ({
    ...c,
    amount: resolveComponentAmount(c, { wage, basic: basicAmount }),
  }));

  const gross = round2(
    resolved.filter((c) => c.type === COMPONENT_TYPE.EARNING).reduce((sum, c) => sum + c.amount, 0)
  );
  const totalDeductions = round2(
    resolved.filter((c) => c.type === COMPONENT_TYPE.DEDUCTION).reduce((sum, c) => sum + c.amount, 0)
  );
  const net = round2(gross - totalDeductions);

  return {
    monthlyWage: wage,
    yearlyWage: round2(wage * 12),
    components: resolved,
    basicAmount,
    gross,
    totalDeductions,
    net,
  };
}

export function describeCalculation(component) {
  if (!component) return '—';
  if (component.calcMethod === CALC_METHOD.FIXED) return 'Fixed';
  const of = component.basis === CALC_BASIS.BASIC ? 'Basic' : 'Wage';
  return `${component.value || 0}% of ${of}`;
}

let idCounter = 0;
export function newComponentId() {
  idCounter += 1;
  return `comp_${Date.now()}_${idCounter}`;
}
