import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/SearchBar/SearchBar';
import EmployeeGrid from '../../components/EmployeeGrid/EmployeeGrid';
import AttendanceWidget from '../../components/AttendanceWidget/AttendanceWidget';
import { useDebounce } from '../../hooks/useDebounce';
import * as employeeService from '../../services/employeeService';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');

  const debouncedQuery = useDebounce(query, 200);
  const navigate = useNavigate();

  const loadEmployees = useCallback(() => {
    setIsLoading(true);
    setError('');
    employeeService
      .getEmployees()
      .then((data) => setEmployees(data))
      .catch(() => setError('We ran into a problem loading employees.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesQuery =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q);
      const matchesDept = !department || emp.department === department;
      const matchesStatus = !status || emp.status === status;
      return matchesQuery && matchesDept && matchesStatus;
    });
  }, [employees, debouncedQuery, department, status]);

  return (
    <div className="flex flex-col gap-6">
      <AttendanceWidget />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Employees</h1>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
            {isLoading ? 'Loading your team…' : `${employees.length} people across the company`}
          </p>
        </div>
        <Button onClick={() => navigate('/employees/new')} className="shrink-0">
          <Plus size={16} />
          New Employee
        </Button>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        department={department}
        onDepartmentChange={setDepartment}
        status={status}
        onStatusChange={setStatus}
        resultCount={!isLoading && !error ? filtered.length : undefined}
      />

      <EmployeeGrid
        employees={filtered}
        isLoading={isLoading}
        error={error}
        onRetry={loadEmployees}
        hasQuery={Boolean(debouncedQuery || department || status)}
        onNewEmployee={() => navigate('/employees/new')}
      />
    </div>
  );
}
