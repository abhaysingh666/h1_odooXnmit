import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, Lock, Mail, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      navigate(loggedUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--gradient-start), transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -30, 40, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--accent-pink), transparent 70%)' }}
        />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      {/* Theme toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-xl border transition-colors duration-300"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md space-y-7 p-8 rounded-3xl relative z-10 backdrop-blur-xl border"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', boxShadow: '0 24px 80px var(--shadow-color)' }}
      >
        <div className="text-center">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-14 h-14 rounded-2xl gradient-border flex items-center justify-center shadow-lg mb-5 glow-pulse"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Welcome back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm mt-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Sign in to your Dayflow workspace
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3.5 rounded-xl text-sm text-center font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Login ID / Email :-
            </label>
            <div className="relative group">
              <Mail className="w-4.5 h-4.5 absolute left-4 top-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="OIJODO20260001 or you@company.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' }}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Password
            </label>
            <div className="relative group">
              <Lock className="w-4.5 h-4.5 absolute left-4 top-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-3.5" style={{ color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 40px var(--accent-glow)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gradient-border text-white font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer transition-shadow duration-300"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold hover:underline" style={{ color: 'var(--accent-pink)' }}>
            Create account
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};
