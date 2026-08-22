import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Clock3, CheckCircle2, XCircle, Filter, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import FormField, { inputClasses } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import { DEPARTMENTS } from '../../utils/constants';
import * as timeOffService from '../../services/timeOffService';
import * as employeeService from '../../services/employeeService';

const STATUS_STYLE = {
  pending: { badge: 'bg-[var(--color-status-absent-soft)] text-[var(--color-status-absent)]', Icon: Clock3 },
  approved: { badge: 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]', Icon: CheckCircle2 },
  rejected: { badge: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]', Icon: XCircle },
};

export default function LeaveApprovals() {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Modal states
  const [activeRequest, setActiveRequest] = useState(null);
  const [modalAction, setModalAction] = useState(''); // 'approve' or 'reject'
  const [adminComment, setAdminComment] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Fetch employees list (to resolve department of the leave applicant)
  const { data: employees = [], error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getEmployees,
  });

  // Fetch all leaves requests
  const { data: leaves = [], isLoading, error: leavesError, refetch } = useQuery({
    queryKey: ['leaves'],
    queryFn: timeOffService.getAllLeaves,
  });

  // Approve leave mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, comment }) => timeOffService.approveLeave(id, comment),
    onSuccess: () => {
      toast.success('Leave request approved.');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] }); // Update status dots
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to approve leave request.');
    }
  });

  // Reject leave mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }) => timeOffService.rejectLeave(id, comment),
    onSuccess: () => {
      toast.success('Leave request rejected.');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to reject leave request.');
    }
  });

  const openActionModal = (request, action) => {
    setActiveRequest(request);
    setModalAction(action);
    setAdminComment('');
  };

  const closeModal = () => {
    setActiveRequest(null);
    setModalAction('');
    setAdminComment('');
  };

  const handleConfirmAction = () => {
    if (!activeRequest) return;
    
    if (modalAction === 'approve') {
      approveMutation.mutate({ id: activeRequest.id, comment: adminComment });
    } else {
      rejectMutation.mutate({ id: activeRequest.id, comment: adminComment });
    }
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((r) => {
    // 1. Status Filter
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    
    // Resolve employee details
    const emp = employees.find(e => e.id === r.employeeId);
    
    // 2. Department Filter
    if (deptFilter !== 'all') {
      if (!emp || emp.department !== deptFilter) return false;
    }
    
    // 3. Date Filters
    if (startDateFilter && r.startDate < startDateFilter) return false;
    if (endDateFilter && r.endDate > endDateFilter) return false;
    
    return true;
  });

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Leave Approvals</h1>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Review and respond to employee leave applications.</p>
      </div>

      {/* Filters Bar */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-card)] flex flex-wrap gap-4 items-end">
        <FormField label="Status" htmlFor="statusFilter">
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputClasses(false)} h-10`}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </FormField>
        <FormField label="Department" htmlFor="deptFilter">
          <select
            id="deptFilter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={`${inputClasses(false)} h-10`}
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </FormField>
        <FormField label="From Date" htmlFor="startDateFilter">
          <input
            id="startDateFilter"
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className={`${inputClasses(false)} h-10`}
          />
        </FormField>
        <FormField label="To Date" htmlFor="endDateFilter">
          <input
            id="endDateFilter"
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className={`${inputClasses(false)} h-10`}
          />
        </FormField>
      </div>

      {/* Requests table */}
      {leavesError || employeesError ? (
        <ErrorState description="Unable to load leave requests. Please retry." onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : filteredLeaves.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No requests match filters."
          description="Try broadening your status, department, or date range filters."
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface-2)] font-medium text-[var(--color-ink-soft)]">
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5">Total Days</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {filteredLeaves.map((r) => {
                  const emp = employees.find((e) => e.id === r.employeeId);
                  const { badge, Icon } = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
                  
                  return (
                    <tr key={r.id} className="hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[var(--color-ink)]">{emp ? emp.name : r.employeeId}</p>
                          <p className="text-xs text-[var(--color-ink-faint)]">{r.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-ink-soft)]">{emp ? emp.department : '—'}</td>
                      <td className="px-6 py-4 capitalize text-[var(--color-ink)]">{r.type}</td>
                      <td className="px-6 py-4 text-[var(--color-ink-soft)]">
                        {formatDate(r.startDate)} - {formatDate(r.endDate)}
                      </td>
                      <td className="px-6 py-4 font-mono text-[var(--color-ink)]">{r.totalDays}</td>
                      <td className="px-6 py-4 text-[var(--color-ink-soft)] truncate max-w-xs">{r.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>
                          <Icon size={12} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openActionModal(r, 'approve')}
                              aria-label="Approve leave request"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-status-present-soft)] text-[var(--color-status-present)] hover:bg-[var(--color-status-present)] hover:text-white transition-colors"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openActionModal(r, 'reject')}
                              aria-label="Reject leave request"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-faint)] italic">
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comments & Confirmation Modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fade-in" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-pop)] animate-pop-in">
            <h3 className="font-semibold text-lg text-[var(--color-ink)] capitalize">
              {modalAction} Leave Request
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Reviewing leave for <span className="font-medium text-[var(--color-ink)]">
                {employees.find(e => e.id === activeRequest.employeeId)?.name || activeRequest.employeeId}
              </span> ({activeRequest.totalDays} days, {activeRequest.type}).
            </p>
            
            <div className="mt-4">
              <FormField label="Admin Comments / Remarks" htmlFor="adminComment">
                <textarea
                  id="adminComment"
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Add optional notes explaining your decision..."
                  className={`${inputClasses(false)} py-2`}
                />
              </FormField>
            </div>
            
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeModal} disabled={isMutating}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={modalAction === 'approve' ? 'secondary' : 'danger'}
                onClick={handleConfirmAction}
                isLoading={isMutating}
              >
                Confirm {modalAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
