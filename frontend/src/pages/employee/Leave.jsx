import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, CalendarDays, List, ChevronLeft, ChevronRight, Upload, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusStyle = (s) => ({
  approved: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: 'var(--accent-emerald)', label: '✓ Approved' },
  rejected: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', label: '✗ Rejected' },
  pending:  { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: 'var(--accent-amber)', label: '⏳ Pending' },
}[s] || { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: 'var(--accent-amber)', label: s });

export const EmployeeLeave = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [currentDate, setCurrentDate] = useState(new Date());

  const [form, setForm] = useState({ leave_type: 'paid', start_date: '', end_date: '', total_days: 1, reason: '' });
  const [certFile, setCertFile] = useState(null);

  const fetchLeaves = async () => {
    try { const res = await API.get('/leaves/me'); setLeaves(res.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const openModalWithDate = (dateStr) => {
    setForm({
      leave_type: 'paid',
      start_date: dateStr,
      end_date: dateStr,
      total_days: 1,
      reason: ''
    });
    setShowModal(true);
  };

  const handleStartDateChange = (val) => {
    const start = new Date(val);
    const end = form.end_date ? new Date(form.end_date) : start;
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    setForm({ ...form, start_date: val, total_days: isNaN(days) ? 1 : days });
  };

  const handleEndDateChange = (val) => {
    const start = form.start_date ? new Date(form.start_date) : new Date(val);
    const end = new Date(val);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    setForm({ ...form, end_date: val, total_days: isNaN(days) ? 1 : days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/leaves', form);
      setShowModal(false);
      setForm({ leave_type: 'paid', start_date: '', end_date: '', total_days: 1, reason: '' });
      setCertFile(null);
      await fetchLeaves();
    } catch { alert('Failed to submit leave request'); } finally { setSubmitting(false); }
  };

  const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startingCellOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getLeaveForDate = (dateStr) => {
    return leaves.find(l => dateStr >= l.start_date && dateStr <= l.end_date);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Time Off Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Apply for time off and track your allocations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${viewMode === 'calendar' ? 'gradient-border text-white' : ''}`}
              style={{ color: viewMode === 'calendar' ? '#fff' : 'var(--text-secondary)' }}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendar View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${viewMode === 'list' ? 'gradient-border text-white' : ''}`}
              style={{ color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)' }}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
          </div>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl gradient-border text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg">
            <Plus className="w-4 h-4" /> NEW (Apply Time Off)
          </motion.button>
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

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-xl border cursor-pointer hover:opacity-80" style={{ borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold rounded-xl border cursor-pointer" style={{ borderColor: 'var(--border-main)', color: 'var(--accent)', background: 'var(--bg-card-alt)' }}>
                Today
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl border cursor-pointer hover:opacity-80" style={{ borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingCellOffset }).map((_, i) => (
              <div key={`blank-${i}`} className="h-20 rounded-xl bg-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const matchedLeave = getLeaveForDate(dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  key={dateStr}
                  onClick={() => openModalWithDate(dateStr)}
                  className="h-20 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition relative group"
                  style={{
                    background: matchedLeave ? (matchedLeave.status === 'approved' ? 'rgba(16,185,129,0.08)' : matchedLeave.status === 'pending' ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)') : 'var(--bg-card-alt)',
                    borderColor: isToday ? 'var(--accent)' : matchedLeave ? (matchedLeave.status === 'approved' ? 'rgba(16,185,129,0.4)' : matchedLeave.status === 'pending' ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)') : 'var(--border-main)'
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${isToday ? 'px-1.5 py-0.5 rounded-full bg-purple-600 text-white' : ''}`} style={{ color: isToday ? '#fff' : 'var(--text-primary)' }}>
                      {dayNum}
                    </span>
                    {matchedLeave && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                        style={{
                          background: matchedLeave.status === 'approved' ? 'rgba(16,185,129,0.2)' : matchedLeave.status === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)',
                          color: matchedLeave.status === 'approved' ? 'var(--accent-emerald)' : matchedLeave.status === 'pending' ? 'var(--accent-amber)' : '#ef4444'
                        }}>
                        {matchedLeave.leave_type[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  {matchedLeave ? (
                    <p className="text-[10px] truncate capitalize font-semibold" style={{ color: matchedLeave.status === 'approved' ? 'var(--accent-emerald)' : matchedLeave.status === 'pending' ? 'var(--accent-amber)' : '#ef4444' }}>
                      ● {matchedLeave.status}
                    </p>
                  ) : (
                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition" style={{ color: 'var(--text-muted)' }}>+ Click to apply</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-main)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Time Off History</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--border-accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No time off requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead style={{ background: 'var(--bg-card-alt)' }}>
                  <tr>
                    {['Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Comments'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l, i) => {
                    const ss = statusStyle(l.status);
                    return (
                      <motion.tr key={l._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className="border-t" style={{ borderColor: 'var(--border-main)' }}>
                        <td className="px-5 py-3.5 font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                          {l.leave_type === 'paid' ? 'Paid Time Off' : l.leave_type === 'sick' ? 'Sick Leave' : 'Unpaid Leave'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{l.start_date}</td>
                        <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{l.end_date}</td>
                        <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--accent)' }}>{l.total_days}d</td>
                        <td className="px-5 py-3.5 max-w-xs truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{l.reason || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>{ss.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{l.admin_comments || '—'}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Excalidraw Time Off Type Request Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md rounded-3xl p-7 border space-y-5 relative"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-accent)', boxShadow: '0 24px 80px var(--shadow-color)' }}>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-xl cursor-pointer" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
              <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Time Off Type Request</h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Employee Name */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Employee</label>
                  <input type="text" disabled value={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                    className="w-full px-4 py-2.5 rounded-xl focus:outline-none font-bold" style={{ ...inputStyle, opacity: 0.8 }} />
                </div>

                {/* Time Off Type */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Time Off Type</label>
                  <select value={form.leave_type} onChange={(e) => setForm({...form, leave_type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none" style={inputStyle}>
                    <option value="paid">Paid Time Off</option>
                    <option value="sick">Sick Leave</option>
                    <option value="unpaid">Unpaid Leaves</option>
                  </select>
                </div>

                {/* Validity Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                    <input type="date" required value={form.start_date} onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>End Date</label>
                    <input type="date" required value={form.end_date} onChange={(e) => handleEndDateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none" style={inputStyle} />
                  </div>
                </div>

                {/* Allocation */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Allocation (Days)</label>
                  <input type="number" min="1" required value={form.total_days} onChange={(e) => setForm({...form, total_days: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none font-bold" style={{ ...inputStyle, color: 'var(--accent)' }} />
                </div>

                {/* Attachment File for Sick Leave Certificate */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Attachment (For sick leave certificate)</label>
                  <label className="w-full px-4 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition"
                    style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
                    <span className="truncate">{certFile ? certFile.name : 'Choose certificate file...'}</span>
                    <Upload className="w-4 h-4 text-purple-400 shrink-0" />
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setCertFile(e.target.files[0])} />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Reason / Remarks</label>
                  <textarea rows={2} value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} placeholder="Brief note for HR..."
                    className="w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none resize-none" style={inputStyle} />
                </div>

                {/* Action Buttons: Submit & Discard */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer"
                    style={{ borderColor: 'var(--border-main)', color: 'var(--text-secondary)', background: 'var(--bg-card-alt)' }}>
                    Discard
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white gradient-border cursor-pointer">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
