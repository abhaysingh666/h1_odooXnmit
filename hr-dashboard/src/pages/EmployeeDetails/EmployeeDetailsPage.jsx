import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, UserX } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import StatusIndicator from '../../components/EmployeeCard/StatusIndicator';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import EmployeeDetailsSkeleton from './EmployeeDetailsSkeleton';
import { InfoSection, InfoItem } from './InfoSection';
import { formatDate } from '../../utils/formatters';
import { ATTENDANCE_STATUS_LABEL } from '../../utils/constants';
import * as employeeService from '../../services/employeeService';

export default function EmployeeDetailsPage() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError('');
    setNotFound(false);

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
    <div className="flex max-w-3xl flex-col gap-5">
      {BackLink}

      {/* Read-only profile header */}
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
            </div>
          </div>
        </div>
      </section>

      <InfoSection title="Personal Information">
        <InfoItem label="Full Name" value={employee.name} />
        <InfoItem label="Employee ID" value={employee.id} mono />
        <InfoItem label="Email" value={employee.email} />
        <InfoItem label="Phone" value={employee.phone} />
        <InfoItem label="Date of Birth" value={formatDate(employee.dob)} />
      </InfoSection>

      <InfoSection title="Employment Information">
        <InfoItem label="Department" value={employee.department} />
        <InfoItem label="Designation" value={employee.designation} />
        <InfoItem label="Joining Date" value={formatDate(employee.joiningDate)} />
        <InfoItem label="Employment Status" value={employee.employmentStatus} />
      </InfoSection>

      <InfoSection title="Work Information">
        <InfoItem label="Work Location" value={employee.location} />
        <InfoItem label="Manager" value={employee.manager} />
      </InfoSection>
    </div>
  );
}
