import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Users, Clock4, CalendarClock, Building2, Search, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField, { inputClasses } from '../../components/ui/FormField';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Avatar from '../../components/ui/Avatar';
import { DEPARTMENTS } from '../../utils/constants';
import * as analyticsService from '../../services/analyticsService';
import * as employeeService from '../../services/employeeService';
import * as timeOffService from '../../services/timeOffService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Fetch admin dashboard analytics
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getDashboardAnalytics,
  });

  // Fetch employees list
  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getEmployees,
  });

  // Fetch pending leaves
  const { data: pendingLeaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['pendingLeaves'],
    queryFn: timeOffService.getPendingLeaves,
  });

  const isLoading = analyticsLoading || employeesLoading || leavesLoading;
  const hasError = analyticsError || employeesError;

  // Filter employee registry list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    
    return matchesSearch && matchesDept;
  });

  if (hasError) {
    return <ErrorState description="Error loading dashboard analytics." onRetry={refetchAnalytics} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="skeleton h-80 rounded-[var(--radius-card)] lg:col-span-2" />
          <div className="skeleton h-80 rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }

  const { stats = {}, attendanceTrend = [] } = analytics || {};

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Admin Dashboard</h1>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Real-time metrics, attendance trends, and pending approvals.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Total Employees</p>
            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1.5">{stats.totalEmployees || 0}</p>
            <p className="text-xs text-[var(--color-status-present)] mt-1 flex items-center gap-1">
              <UserCheck size={12} /> Active workforce
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Users size={22} />
          </span>
        </div>

        {/* Present Today */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Present Today</p>
            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1.5">{stats.presentToday || 0}</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              {stats.totalEmployees ? Math.round(((stats.presentToday || 0) / stats.totalEmployees) * 100) : 0}% attendance rate
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[var(--color-status-present)]">
            <Clock4 size={22} />
          </span>
        </div>

        {/* Pending Leaves */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Pending Leaves</p>
            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1.5">{stats.pendingLeaves || 0}</p>
            <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
              <ShieldAlert size={12} /> Requires review
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <CalendarClock size={22} />
          </span>
        </div>

        {/* Monthly Payroll */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Payroll (Month)</p>
            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1.5">₹{(stats.monthlyPayroll || 0).toLocaleString()}</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">Processed net payouts</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Building2 size={22} />
          </span>
        </div>
      </div>

      {/* Main Charts & Action Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance trend chart */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)] lg:col-span-2 flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-ink)]">Attendance Trend</h3>
            <p className="text-xs text-[var(--color-ink-soft)]">Daily attendance counts for the past 7 days.</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-status-present)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-status-present)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-status-leave)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-status-leave)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="date" stroke="var(--color-ink-faint)" />
                <YAxis stroke="var(--color-ink-faint)" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="present" stroke="var(--color-status-present)" fillOpacity={1} fill="url(#colorPresent)" name="Present" strokeWidth={2} />
                <Area type="monotone" dataKey="leave" stroke="var(--color-status-leave)" fillOpacity={1} fill="url(#colorLeave)" name="On Leave" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Leave approvals actions panel */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)] flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-[var(--color-ink)]">Leave Review</h3>
            <Link to="/admin/leave-approvals" className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-0.5">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-64 pr-1">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-ink-faint)] text-sm">
                No leave requests pending approval.
              </div>
            ) : (
              pendingLeaves.slice(0, 4).map((r) => {
                const emp = employees.find(e => e.id === r.employeeId);
                return (
                  <div key={r.id} className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[var(--color-surface-2)]/30 transition-colors flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{emp ? emp.name : r.employeeId}</p>
                      <p className="text-xs text-[var(--color-ink-soft)] capitalize">
                        {r.type} • {r.totalDays} {r.totalDays === 1 ? 'day' : 'days'}
                      </p>
                      <p className="text-xs text-[var(--color-ink-faint)] italic truncate max-w-xs mt-1">"{r.reason}"</p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/admin/leave-approvals')} className="h-8 px-2 text-xs">
                      Review
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Employee Registry section */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)] flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-ink)]">Employee Registry</h3>
            <p className="text-xs text-[var(--color-ink-soft)]">Browse and query employee details.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className={`${inputClasses(false)} pl-9 h-9 w-60`}
              />
            </div>
            {/* Dept Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className={`${inputClasses(false)} h-9 text-xs py-1`}
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-ink-faint)] text-sm">
            No employees found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs uppercase tracking-wider font-semibold text-[var(--color-ink-faint)] bg-slate-50/50">
                  <th className="px-6 py-2.5">Name</th>
                  <th className="px-6 py-2.5">Employee ID</th>
                  <th className="px-6 py-2.5">Designation</th>
                  <th className="px-6 py-2.5">Department</th>
                  <th className="px-6 py-2.5">Location</th>
                  <th className="px-6 py-2.5">Status</th>
                  <th className="px-6 py-2.5 text-right">View Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {filteredEmployees.map((emp) => {
                  const isPresent = emp.status === 'present';
                  const isLeave = emp.status === 'leave';
                  return (
                    <tr key={emp.id} className="hover:bg-[var(--color-surface-2)]/30 group">
                      <td className="px-6 py-3 flex items-center gap-3">
                        <Avatar name={emp.name} src={emp.avatar} size="sm" />
                        <span className="font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors">{emp.name}</span>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-[var(--color-ink-soft)]">{emp.id}</td>
                      <td className="px-6 py-3 text-[var(--color-ink-soft)]">{emp.designation}</td>
                      <td className="px-6 py-3 text-[var(--color-ink-soft)]">{emp.department}</td>
                      <td className="px-6 py-3 text-[var(--color-ink-soft)]">{emp.location || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex h-2 w-2 rounded-full ${
                          isPresent ? 'bg-[var(--color-status-present)]' : isLeave ? 'bg-[var(--color-status-leave)]' : 'bg-[var(--color-status-absent)]'
                        }`} />
                        <span className="ml-1.5 text-xs text-[var(--color-ink-soft)] capitalize">{emp.status}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link to={`/employees/${emp.id}`} className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition-colors">
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
