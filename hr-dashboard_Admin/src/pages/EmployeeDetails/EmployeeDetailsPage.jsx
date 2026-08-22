import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, UserX } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import StatusIndicator from '../../components/EmployeeCard/StatusIndicator';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import EmployeeDetailsSkeleton from './EmployeeDetailsSkeleton';
import ResumeTab from './tabs/ResumeTab';
import PrivateInfoTab from './tabs/PrivateInfoTab';
import SalaryInfoTab from './tabs/SalaryInfoTab';
import SecurityTab from './tabs/SecurityTab';
import { useAuth } from '../../hooks/useAuth';
import { ATTENDANCE_STATUS_LABEL, ROLES } from '../../utils/constants';
import * as employeeService from '../../services/employeeService';

const TABS = [
  { key: 'resume', label: 'Resume' },
  { key: 'private', label: 'Private Info' },
  { key: 'salary', label: 'Salary Info', adminOnly: true },
  { key: 'security', label: 'Security' },
];

export default function EmployeeDetailsPage() {
  const { employeeId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError('');
    setNotFound(false);
    setActiveTab('resume');

    employeeService
      .getEmployeeById(employeeId)
      .then((data) => {
        if (!mounted) return;
        if (!data) setNotFound(true);
        else setEmployee(data);
      })
      .catch(() => mounted && setError('We ran into a problem loading this profile.'))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  const BackLink = (
    <Link
      to="/employees"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
    >
      <ArrowLeft size={15} />
      Back to Employees
    </Link>
  );

  if (isLoading) return <EmployeeDetailsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        {BackLink}
        <ErrorState description={error} />
      </div>
    );
  }

  if (notFound || !employee) {
    return (
      <div className="flex flex-col gap-5">
        {BackLink}
        <EmptyState
          icon={UserX}
          title="Employee Not Found"
          description="The employee you are looking for does not exist."
        />
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      {BackLink}

      {/* Read-only header — the page opens in view mode; editing is explicit per tab */}
      <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar name={employee.name} src={employee.avatar} size="xl" />
            <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white">
              <StatusIndicator status={employee.status} />
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">{employee.name}</h1>
            <p className="mt-0.5 text-[var(--color-ink-soft)]">{employee.designation}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--color-ink-soft)]">
                {employee.id}
              </span>
              <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
                {ATTENDANCE_STATUS_LABEL[employee.status]}
              </span>
              <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent-dark)]">
                {employee.department}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)]">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative shrink-0 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--color-primary)]" />
            )}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'resume' && <ResumeTab employee={employee} canEdit={isAdmin} onUpdated={setEmployee} />}
        {activeTab === 'private' && <PrivateInfoTab employee={employee} canEdit={isAdmin} onUpdated={setEmployee} />}
        {activeTab === 'salary' && isAdmin && <SalaryInfoTab employee={employee} currentUser={user} />}
        {activeTab === 'security' && <SecurityTab employee={employee} />}
      </div>
    </div>
  );
}
