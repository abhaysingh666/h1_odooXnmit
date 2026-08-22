import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { Check, X, CalendarDays, Search, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusStyle = (s) => ({
  approved: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: 'var(--accent-emerald)', label: '✓ Approved' },
  rejected: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', label: '✗ Rejected' },
  pending:  { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: 'var(--accent-amber)', label: '⏳ Pending' },
}[s] || {});

export const AdminLeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('time_off'); // time_off | allocation
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchLeaves = async () => {
    try { const res = await API.get('/leaves'); setLeaves(res.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const act = async (id, action) => {
    setProcessing(p => ({ ...p, [id]: action }));
    try {
      await API.put(`/leaves/${id}/${action}`, { admin_comments: comments[id] || `${action === 'approve' ? 'Approved' : 'Rejected'} by HR` });
      await fetchLeaves();
    } catch { alert(`Failed to ${action} leave`); } finally { setProcessing(p => ({ ...p, [id]: null })); }
  };

  const filteredLeaves = leaves.filter(l => {
    const emp = (l.employee_id || '').toLowerCase();
    const type = (l.leave_type || '').toLowerCase();
    const reason = (l.reason || '').toLowerCase();
    return emp.includes(search.toLowerCase()) || type.includes(search.toLowerCase()) || reason.includes(search.toLowerCase());
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Time Off & Leave Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Review and action time-off requests for all employees.</p>
        </div>

        {/* Excalidraw Navigation Tabs: Time Off | Allocation */}
        <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <button
            onClick={() => setActiveTab('time_off')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'time_off' ? 'gradient-border text-white shadow-md' : ''}`}
            style={{ color: activeTab === 'time_off' ? '#fff' : 'var(--text-secondary)' }}
          >
            Time Off
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'allocation' ? 'gradient-border text-white shadow-md' : ''}`}
            style={{ color: activeTab === 'allocation' ? '#fff' : 'var(--text-secondary)' }}
          >
            Allocation
          </button>
        </div>
      </motion.div>

      {/* Excalidraw Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <div>
            <p className="text-xs uppercase font-extrabold" style={{ color: 'var(--text-muted)' }}>Paid Time Off</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: 'var(--accent-emerald)' }}>24 Days Available</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <div>
            <p className="text-xs uppercase font-extrabold" style={{ color: 'var(--text-muted)' }}>Sick Time Off</p>
            <h3 className="text-2xl font-black mt-1" style={{ color: 'var(--accent-pink)' }}>07 Days Available</h3>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/10">
            <Clock className="w-6 h-6 text-pink-500" />
          </div>
        </div>
      </div>

      {activeTab === 'time_off' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Top Search bar */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee or leave type..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
              />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Pending: <strong style={{ color: 'var(--accent-amber)' }}>{pendingCount}</strong> | Approved: <strong style={{ color: 'var(--accent-emerald)' }}>{approvedCount}</strong>
            </span>
          </div>

          {/* Excalidraw Approval Table */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--border-accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No time off applications found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead style={{ background: 'var(--bg-card-alt)' }}>
                    <tr>
                      {['Name / ID', 'Start Date', 'End Date', 'Type', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((l) => {
                      const ss = statusStyle(l.status);
                      return (
                        <tr key={l._id} className="border-t transition hover:bg-purple-500/5" style={{ borderColor: 'var(--border-main)' }}>
                          <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                            {l.employee_id}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{l.start_date}</td>
                          <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{l.end_date}</td>
                          <td className="px-5 py-3.5 font-semibold capitalize text-xs" style={{ color: 'var(--accent)' }}>
                            {l.leave_type === 'paid' ? '💰 Paid Time Off' : l.leave_type === 'sick' ? '🤒 Sick Leave' : '📝 Unpaid Leave'}
                          </td>
                          <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--accent-emerald)' }}>{l.total_days}d</td>
                          <td className="px-5 py-3.5 text-xs max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>
                            {l.reason ? (
                              <span className="italic" title={l.reason}>
                                {l.reason.length > 50 ? l.reason.slice(0, 50) + '...' : l.reason}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>No reason provided</span>
                            )}
                            {l.admin_comments && l.status !== 'pending' && (
                              <div className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                                Admin: {l.admin_comments}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap" style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                              {ss.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {l.status === 'pending' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => act(l._id, 'approve')}
                                  disabled={!!processing[l._id]}
                                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer transition shadow"
                                  title="Approve Leave"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => act(l._id, 'reject')}
                                  disabled={!!processing[l._id]}
                                  className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition shadow"
                                  title="Reject Leave"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Actioned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'allocation' && (
        <div className="p-8 rounded-2xl border text-center space-y-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Leave Allocations Policy</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Default annual allocation: Paid Time Off (24 Days), Sick Leave (07 Days).</p>
        </div>
      )}
    </div>
  );
};
