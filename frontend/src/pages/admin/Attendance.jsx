import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { Clock, Users, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try { const res = await API.get('/attendance'); setAttendance(res.data); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const filtered = filterDate ? attendance.filter(a => a.date === filterDate) : attendance;
  const presentToday = attendance.filter(a => a.date === todayStr && a.check_in).length;

  const exportCSV = () => {
    if (filtered.length === 0) return alert('No attendance records to export.');
    const headers = ['Employee ID', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status'];
    const rows = filtered.map(r => [
      r.employee_id,
      r.date,
      r.check_in || 'N/A',
      r.check_out || 'N/A',
      r.working_hours || 0,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${filterDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Workforce Attendance</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Organization-wide check-in/out records.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportCSV}
            className="px-4 py-2 rounded-xl gradient-border text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md">
            <Download className="w-3.5 h-3.5" /> Export Report (CSV)
          </motion.button>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Filter:</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs focus:outline-none border"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }} />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="text-xs font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer"
                style={{ borderColor: 'var(--border-main)', color: 'var(--text-muted)', background: 'var(--bg-card-alt)' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: attendance.length, color: 'var(--accent)' },
          { label: 'Present Today', value: presentToday, color: 'var(--accent-emerald)' },
          { label: 'Showing Records', value: filtered.length, color: 'var(--accent-pink)' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}
            className="p-5 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-3xl font-black mt-1" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--border-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead style={{ background: 'var(--bg-card-alt)' }}>
                <tr>
                  {['Employee ID', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec, i) => (
                  <motion.tr key={rec._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-t" style={{ borderColor: 'var(--border-main)' }}>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>{rec.employee_id}</td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>{rec.date}</td>
                    <td className="px-5 py-3.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{rec.check_in || '—'}</td>
                    <td className="px-5 py-3.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{rec.check_out || '—'}</td>
                    <td className="px-5 py-3.5 font-black font-mono" style={{ color: 'var(--accent-emerald)' }}>{rec.working_hours || 0}h</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold capitalize"
                        style={{
                          background: rec.status === 'present' ? 'rgba(16,185,129,0.1)' : rec.status === 'half-day' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${rec.status === 'present' ? 'rgba(16,185,129,0.3)' : rec.status === 'half-day' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          color: rec.status === 'present' ? 'var(--accent-emerald)' : rec.status === 'half-day' ? 'var(--accent-amber)' : '#ef4444'
                        }}>
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
