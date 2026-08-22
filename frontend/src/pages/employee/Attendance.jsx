import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Calendar } from 'lucide-react';

const StatCard = ({ label, value, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="p-5 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 4px 24px var(--shadow-color)' }}>
    <p className="text-[11px] uppercase font-extrabold tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
    <p className="text-3xl font-black" style={{ color }}>{value}</p>
  </motion.div>
);

export const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { const res = await API.get('/attendance/me'); setAttendance(res.data); }
      catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const totalHours = attendance.reduce((s, a) => s + (a.working_hours || 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>My Attendance</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track your daily check-in logs and work hours.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Total Logged Days" value={totalDays} color="var(--accent)" delay={0.1} />
        <StatCard label="Present Days" value={presentDays} color="var(--accent-emerald)" delay={0.2} />
        <StatCard label="Total Hours" value={`${totalHours.toFixed(1)}h`} color="var(--accent-pink)" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 4px 24px var(--shadow-color)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-main)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Attendance History</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--border-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No attendance records yet</p>
            <p className="text-xs mt-1">Use the Dashboard to check in!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-card-alt)' }}>
                  {['Date', 'Check In', 'Check Out', 'Hours Worked', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] uppercase font-extrabold tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.map((rec, i) => (
                  <motion.tr key={rec._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-t transition-colors duration-150" style={{ borderColor: 'var(--border-main)' }}>
                    <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>{rec.date}</td>
                    <td className="px-5 py-3.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{rec.check_in || '--:--'}</td>
                    <td className="px-5 py-3.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{rec.check_out || '--:--'}</td>
                    <td className="px-5 py-3.5 font-black font-mono" style={{ color: 'var(--accent)' }}>{rec.working_hours || 0}h</td>
                    <td className="px-5 py-3.5">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-emerald)' }}>
                        ● {rec.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};
