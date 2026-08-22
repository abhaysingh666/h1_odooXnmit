import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { Users, Clock, CalendarDays, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MetricCard = ({ label, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -3, boxShadow: '0 12px 40px var(--shadow-color)' }}
    className="p-5 rounded-2xl border relative overflow-hidden cursor-default transition-shadow duration-300"
    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 4px 24px var(--shadow-color)' }}
  >
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] uppercase font-extrabold tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-4xl font-black mt-2" style={{ color }}>{value}</p>
      </div>
      <div className="p-2.5 rounded-xl" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl border text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-accent)', color: 'var(--text-primary)' }}>
      <p className="font-bold">{label}</p>
      <p style={{ color: 'var(--accent)' }}>Present: <strong>{payload[0].value}</strong></p>
    </div>
  );
};

export const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [empRes, attRes, leaveRes] = await Promise.all([
          API.get('/employees'), API.get('/attendance'), API.get('/leaves')
        ]);
        setEmployees(empRes.data);
        setAttendance(attRes.data);
        setLeaves(leaveRes.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter(a => a.date === todayStr && a.check_in).length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

  // Build last 7 days chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { name: dayName, attendance: attendance.filter(a => a.date === ds && a.check_in).length };
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>HR Admin Overview 👑</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time workforce analytics and management actions.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard label="Total Employees" value={employees.length} icon={Users} color="var(--accent)" delay={0.1} />
        <MetricCard label="Present Today" value={presentToday} icon={Clock} color="var(--accent-emerald)" delay={0.2} />
        <MetricCard label="Pending Leaves" value={pendingLeaves} icon={CalendarDays} color="var(--accent-amber)" delay={0.3} />
        <MetricCard label="Workforce Score" value="98%" icon={TrendingUp} color="var(--accent-pink)" delay={0.4} />
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 4px 24px var(--shadow-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Trend</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Daily present count — last 7 days</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ background: 'var(--accent-glow)', borderColor: 'var(--border-accent)', color: 'var(--accent)' }}>
            <Zap className="w-3.5 h-3.5" /> Live Data
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="attendance" stroke="var(--accent)" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Employees Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-main)' }}>
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Employees</h3>
          <a href="/admin/employees" className="text-xs font-bold hover:underline" style={{ color: 'var(--accent)' }}>View All →</a>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-main)' }}>
          {employees.slice(0, 5).map((emp, i) => (
            <motion.div key={emp._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 * i }}
              className="px-6 py-3.5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl gradient-border flex items-center justify-center text-white font-bold text-sm shrink-0">
                {emp.personal_details?.first_name?.[0] || 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {emp.personal_details?.first_name} {emp.personal_details?.last_name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {emp.job_details?.designation} · {emp.employee_id}
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold shrink-0"
                style={{
                  background: emp.live_status === 'present' ? 'rgba(16,185,129,0.1)' : emp.live_status === 'on_leave' ? 'var(--accent-glow)' : 'rgba(251,191,36,0.1)',
                  border: `1px solid ${emp.live_status === 'present' ? 'rgba(16,185,129,0.3)' : emp.live_status === 'on_leave' ? 'var(--border-accent)' : 'rgba(251,191,36,0.3)'}`,
                  color: emp.live_status === 'present' ? 'var(--accent-emerald)' : emp.live_status === 'on_leave' ? 'var(--accent)' : 'var(--accent-amber)'
                }}>
                {emp.live_status === 'present' ? '● Present' : emp.live_status === 'on_leave' ? '✈ On Leave' : '○ Absent'}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
