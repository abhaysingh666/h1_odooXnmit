/**
 * A client-side mirror of `backend/app/utils/payroll.py`.
 *
 * The server stays authoritative — every save is recomputed there and the
 * response replaces whatever the browser had. This exists purely so the salary
 * editor can show the admin what a wage change does to each component *as they
 * type*, which is the behaviour the spec asks for ("component values
 * auto-update when the wage changes"). Keep the two in step.
 */

export const COMPUTATIONS = [
  { value: 'percent_of_wage', label: '% of wage' },
  { value: 'percent_of_basic', label: '% of basic' },
  { value: 'fixed', label: 'Fixed amount' },
  { value: 'balance', label: 'Balance of wage' },
];

const BASIC_KEY = 'basic';

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function resolveAmount(component, wage, basic) {
  const value = Number(component.value) || 0;
  switch (component.computation || 'percent_of_basic') {
    case 'percent_of_wage':
      return (wage * value) / 100;
    case 'percent_of_basic':
      return (basic * value) / 100;
    case 'fixed':
      return value;
    default:
      return 0; // `balance` is resolved after everything else.
  }
}

/** Basic first, then the percentage/fixed lines, then the balancing component. */
export function computeComponents(monthlyWage, components = []) {
  const wage = Math.max(0, Number(monthlyWage) || 0);
  const rows = components.map((component) => ({ ...component }));

  let basic = 0;
  for (const row of rows) {
    if (row.key !== BASIC_KEY) continue;
    basic = resolveAmount(row, wage, 0);
    row.amount = money(basic);
  }

  for (const row of rows) {
    if (row.key === BASIC_KEY || row.computation === 'balance') continue;
    row.amount = money(resolveAmount(row, wage, basic));
  }

  const allocated = rows
    .filter((row) => row.computation !== 'balance')
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);

  for (const row of rows) {
    if (row.computation !== 'balance') continue;
    row.amount = money(Math.max(0, wage - allocated));
    row.value = money(basic ? (row.amount / basic) * 100 : 0);
  }

  for (const row of rows) {
    row.percent_of_wage = money(wage ? ((row.amount ?? 0) / wage) * 100 : 0);
  }

  return rows;
}

export function buildStructure({
  monthly_wage = 0,
  components = [],
  pf_employee_percent = 12,
  pf_employer_percent = 12,
  professional_tax = 200,
} = {}) {
  const wage = money(monthly_wage);
  const resolved = computeComponents(wage, components);
  const basic = resolved.find((row) => row.key === BASIC_KEY)?.amount ?? 0;

  const pfEmployee = money((basic * (Number(pf_employee_percent) || 0)) / 100);
  const pfEmployer = money((basic * (Number(pf_employer_percent) || 0)) / 100);
  const profTax = money(professional_tax);

  const gross = money(resolved.reduce((sum, row) => sum + (row.amount ?? 0), 0));
  const deductions = money(pfEmployee + profTax);

  return {
    monthly_wage: wage,
    yearly_wage: money(wage * 12),
    components: resolved,
    basic: money(basic),
    pf_employee_percent: money(pf_employee_percent),
    pf_employer_percent: money(pf_employer_percent),
    pf_employee_amount: pfEmployee,
    pf_employer_amount: pfEmployer,
    professional_tax: profTax,
    gross_monthly: gross,
    total_deductions: deductions,
    net_monthly: money(gross - deductions),
    cost_to_company: money(gross + pfEmployer),
  };
}

/**
 * The spec's hard constraint: the components other than the balancing line may
 * never add up to more than the wage. Returns the overflow in rupees (0 when the
 * structure is valid) so the editor can block the save and say by how much.
 */
export function componentOverflow(monthlyWage, components = []) {
  const wage = Math.max(0, Number(monthlyWage) || 0);
  const resolved = computeComponents(wage, components);
  const allocated = resolved
    .filter((row) => row.computation !== 'balance')
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);

  return money(Math.max(0, allocated - wage));
}
