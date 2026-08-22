import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Clock, Calendar, CheckCircle2, Search, Plane, Building, Phone, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Card = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className={`p-6 rounded-2xl border backdrop-blur-sm transition-colors duration-300 ${className}`}
    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 4px 24px var(--shadow-color)' }}
  >
    {children}
  </motion.div>
);

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);

  const [checkedIn, setCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  const loadData = async () => {
    try {
      const [attRes, leaveRes] = await Promise.all([
        API.get('/attendance/me'),
        API.get('/leaves/me'),
      ]);
      setAttendance(attRes.data);
      setLeaves(leaveRes.data);

      // Employee directory: admins can see all, employees get 403 (silently handle)
      try {
        const empRes = await API.get('/employees');
        setEmployees(empRes.data);
      } catch (empErr) {
        // Non-admin employees hit 403 — show empty directory gracefully
        setEmployees([]);
      }

      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const today = attRes.data.find(r => (!r.check_out && r.check_in) || r.date === todayStr);
      setTodayRecord(today);
      setCheckedIn(!!(today && today.check_in && !today.check_out));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Live timer when checked in
  useEffect(() => {
    if (!checkedIn || !todayRecord?.check_in) return;
    const interval = setInterval(() => {
      const [h, m, s] = todayRecord.check_in.split(':').map(Number);
      const checkInMs = new Date();
      checkInMs.setHours(h, m, s, 0);
      const diff = Date.now() - checkInMs.getTime();
      if (diff < 0) return;
      const hrs = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkedIn, todayRecord]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try { await API.post('/attendance/check-in'); await loadData(); } catch (err) { alert(err.response?.data?.detail || 'Failed'); } finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try { await API.post('/attendance/check-out'); await loadData(); } catch (err) { alert(err.response?.data?.detail || 'Failed'); } finally { setActionLoading(false); }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;

  const filtered = employees.filter(emp => {
    const name = `${emp.personal_details?.first_name || ''} ${emp.personal_details?.last_name || ''}`.toLowerCase();
    const id = (emp.employee_id || '').toLowerCase();
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
  });

  const getStatusIndicator = (liveStatus) => {
    switch (liveStatus) {
      case 'present':
        return (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Present 🟢
          </div>
        );
      case 'on_leave':
        return (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
            <Plane className="w-3 h-3 text-purple-400" />
            On Leave ✈️
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Absent 🟡
          </div>
        );
    }
  };

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {user?.first_name || 'Team Member'}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Workday overview & workforce directory.
          </p>
        </div>
      </motion.div>

      {/* Top Systray Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Check-In Widget */}
        <Card delay={0.1} className="relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] uppercase font-extrabold tracking-wider" style={{ color: 'var(--text-muted)' }}>Today's Shift</p>
              <h3 className="text-lg font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>
                {todayRecord?.check_out ? '✅ Day Complete' : checkedIn ? '🟢 Checked In' : '🔴 Not Checked In'}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}>
              <Clock className="w-5 h-5" style={{ color: checkedIn ? 'var(--accent-emerald)' : 'var(--accent)' }} />
            </div>
          </div>

          {checkedIn && !todayRecord?.check_out && (
            <div className="text-3xl font-black font-mono tracking-wider mb-4 text-center py-2 rounded-xl"
              style={{ color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.08)' }}>
              {elapsed}
            </div>
          )}

          <div className="text-xs space-y-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            <p>Check In: <strong style={{ color: 'var(--text-primary)' }}>{todayRecord?.check_in || '--:--'}</strong></p>
            <p>Check Out: <strong style={{ color: 'var(--text-primary)' }}>{todayRecord?.check_out || '--:--'}</strong></p>
          </div>

          {!todayRecord?.check_out ? (
            <button onClick={checkedIn ? handleCheckOut : handleCheckIn} disabled={actionLoading}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg transition"
              style={{ background: checkedIn ? '#ef4444' : 'var(--accent-emerald)' }}>
              {actionLoading ? 'Processing...' : checkedIn ? 'Check Out ->' : 'Check IN ->'}
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-xl text-xs text-center border" style={{ borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}>
              Shift completed — {todayRecord?.working_hours || 0} hours logged
            </div>
          )}
        </Card>

        {/* Leave Summary */}
        <Card delay={0.2}>
          <div className="flex justify-between items-start mb-3">
            <p className="text-[11px] uppercase font-extrabold tracking-wider" style={{ color: 'var(--text-muted)' }}>Leave Summary</p>
            <Calendar className="w-5 h-5" style={{ color: 'var(--accent-pink)' }} />
          </div>
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-4xl font-black" style={{ color: 'var(--accent)' }}>{pendingLeaves}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending Requests</span>
          </div>
          <div className="pt-4 mt-4 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
            <span>Approved: <strong style={{ color: 'var(--accent-emerald)' }}>{approvedLeaves}</strong></span>
            <span>Total: <strong>{leaves.length}</strong></span>
          </div>
        </Card>

        {/* Account Info */}
        <Card delay={0.3}>
          <p className="text-[11px] uppercase font-extrabold tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Account Info</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Member
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            Employee ID: <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{user?.employee_id}</span>
          </p>
        </Card>
      </div>

      {/* Excalidraw Employee Cards Grid (Clickable View-Only Mode) */}
      <Card delay={0.4}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Team Directory</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click any card to view employee details in view-only mode.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team member..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div
              key={emp._id}
              onClick={() => setSelectedEmp(emp)}
              className="p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition space-y-3 relative group"
              style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-border flex items-center justify-center text-white font-bold text-sm">
                    {emp.personal_details?.first_name?.[0] || 'E'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {emp.personal_details?.first_name} {emp.personal_details?.last_name}
                    </h4>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{emp.employee_id}</p>
                  </div>
                </div>
                {/* Excalidraw Status Indicator Dot */}
                {getStatusIndicator(emp.live_status)}
              </div>

              <div className="text-xs space-y-1 pt-2 border-t" style={{ borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
                <p>Department: <strong>{emp.job_details?.department}</strong></p>
                <p>Designation: <strong>{emp.job_details?.designation}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* View-Only Employee Details Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#150c2c] border border-purple-200 dark:border-purple-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 relative"
            >
              <button onClick={() => setSelectedEmp(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 border-b border-purple-200 dark:border-purple-900 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedEmp.personal_details?.first_name?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {selectedEmp.personal_details?.first_name} {selectedEmp.personal_details?.last_name}
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">ID: {selectedEmp.employee_id} • View-Only Mode</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-gray-700 dark:text-purple-200">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                  <span className="font-bold text-purple-900 dark:text-purple-200 block mb-1">About</span>
                  <p>{selectedEmp.about || 'Team member.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                    <span className="font-bold text-purple-500 block">Department</span>
                    <span>{selectedEmp.job_details?.department}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                    <span className="font-bold text-purple-500 block">Designation</span>
                    <span>{selectedEmp.job_details?.designation}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
