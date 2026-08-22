import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../lib/api';
import { LogOut, Bell, Sparkles, Sun, Moon, CheckCircle2, Clock, CalendarDays, X, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Avatar Dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Systray Attendance Check-In / Check-Out State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [attLoading, setAttLoading] = useState(false);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [unread, setUnread] = useState(0);

  const fetchAttendanceStatus = async () => {
    try {
      const res = await API.get('/attendance/me');
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const todayRec = res.data.find(r => (!r.check_out && r.check_in) || r.date === todayStr);
      if (todayRec && todayRec.check_in && !todayRec.check_out) {
        setIsCheckedIn(true);
        setCheckInTime(todayRec.check_in);
      } else {
        setIsCheckedIn(false);
        setCheckInTime('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) fetchAttendanceStatus();
  }, [user]);

  const handleSystrayCheckIn = async () => {
    setAttLoading(true);
    try {
      const res = await API.post('/attendance/check-in');
      setIsCheckedIn(true);
      setCheckInTime(res.data.check_in);
    } catch (err) {
      alert(err.response?.data?.detail || 'Check in failed');
    } finally {
      setAttLoading(false);
    }
  };

  const handleSystrayCheckOut = async () => {
    setAttLoading(true);
    try {
      await API.post('/attendance/check-out');
      setIsCheckedIn(false);
      setCheckInTime('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Check out failed');
    } finally {
      setAttLoading(false);
    }
  };

  const notifications = [
    { id: 1, title: 'Shift Attendance Logged', desc: 'Your check-in status is active for today.', time: '10m ago', icon: Clock, color: 'var(--accent-emerald)' },
    { id: 2, title: 'Payroll Generated', desc: 'Monthly compensation structure updated by HR.', time: '1h ago', icon: CheckCircle2, color: 'var(--accent)' },
    { id: 3, title: 'Leave Policy & Approvals', desc: 'Check-in on approved and pending leave status.', time: '1d ago', icon: CalendarDays, color: 'var(--accent-pink)' }
  ];

  return (
    <header className="h-16 border-b backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300"
      style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-main)' }}>
      {/* App Logo */}
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ rotate: 180, scale: 1.1 }} transition={{ duration: 0.4 }}
          className="h-9 w-9 rounded-xl gradient-border flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
        <span className="font-extrabold text-xl tracking-tight" style={{ background: `linear-gradient(135deg, var(--gradient-start), var(--gradient-end))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DAYFLOW
        </span>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold border"
          style={{ background: 'var(--accent-glow)', borderColor: 'var(--border-accent)', color: 'var(--accent)' }}>
          {user?.role === 'admin' ? 'Admin / HR' : 'Employee'}
        </span>
      </div>

      {/* Right Systray & Controls */}
      <div className="flex items-center gap-4 relative">
        {/* Excalidraw Systray Check IN / Check OUT Widget */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}>
          {/* Status Dot: Green when checked in, Red when not */}
          <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} title={isCheckedIn ? 'Status: Present (Checked IN)' : 'Status: Not Checked IN'} />

          {isCheckedIn ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Since {checkInTime}
              </span>
              <button
                onClick={handleSystrayCheckOut}
                disabled={attLoading}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition cursor-pointer"
              >
                {attLoading ? '...' : 'Check Out ->'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSystrayCheckIn}
              disabled={attLoading}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
            >
              {attLoading ? '...' : 'Check IN ->'}
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
          className="p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
          {theme === 'dark' ? (
            <><Sun className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} /><span className="hidden sm:inline">Light</span></>
          ) : (
            <><Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} /><span className="hidden sm:inline">Dark</span></>
          )}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnread(0);
            }}
            className="p-2 rounded-xl transition cursor-pointer relative"
            style={{ color: 'var(--text-secondary)' }}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />}
            {unread > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-500" />}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 rounded-2xl border p-4 shadow-2xl z-50 backdrop-blur-xl"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 16px 50px var(--shadow-color)' }}
              >
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-main)' }}>
                  <h4 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>System Notifications</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-xs cursor-pointer p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border-main)' }}>
                  {notifications.map((n) => {
                    const IconComponent = n.icon;
                    return (
                      <div key={n.id} className="py-3 flex items-start gap-3">
                        <div className="p-2 rounded-xl shrink-0" style={{ background: 'var(--bg-card-alt)' }}>
                          <IconComponent className="w-4 h-4" style={{ color: n.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{n.time}</span>
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-[1px]" style={{ background: 'var(--border-main)' }} />

        {/* Excalidraw User Profile Picture (Avatar) Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-purple-500/10 transition"
          >
            <div className="w-9 h-9 rounded-full gradient-border flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{user?.first_name || user?.email}</p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{user?.employee_id}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Avatar Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 rounded-2xl border p-2 shadow-2xl z-50 backdrop-blur-xl"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 16px 50px var(--shadow-color)' }}
              >
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:bg-purple-500/10 cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <User className="w-4 h-4 text-purple-400" />
                  My Profile
                </button>
                <div className="my-1 border-t" style={{ borderColor: 'var(--border-main)' }} />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 transition hover:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
