import { Users, SearchX } from 'lucide-react';
import EmployeeCard from '../EmployeeCard/EmployeeCard';
import EmployeeCardSkeleton from '../EmployeeCard/EmployeeCardSkeleton';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import Button from '../ui/Button';

export default function EmployeeGrid({ employees, isLoading, error, onRetry, hasQuery, onNewEmployee }) {
  if (error) {
    return <ErrorState title="Couldn't load employees" description={error} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <EmployeeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (employees.length === 0 && hasQuery) {
    return <EmptyState icon={SearchX} title="No employees match your search" description="Try a different name, ID, department, or email." />;
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No employees found"
        description="Add your first employee to get started."
        action={
          <Button size="sm" onClick={onNewEmployee}>
            New Employee
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
