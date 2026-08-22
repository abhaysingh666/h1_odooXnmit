import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, ArrowRight, Sun, Moon, Eye, EyeOff, Upload, Building, Phone as PhoneIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const SignUp = () => {
  const [formData, setFormData] = useState({
    company_name: 'Odoo India',
    employee_id: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    role: 'employee'
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        employee_id: formData.employee_id,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role
      });
      navigate(newUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)'
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--gradient-start), transparent 70%)' }} />
        <motion.div animate={{ x: [0, -30, 40, 0], y: [0, 40, -20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--accent-pink), transparent 70%)' }} />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-xl border transition-colors duration-300"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>
        {theme === 'dark' ? <Sun className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg space-y-6 p-8 rounded-3xl relative z-10 backdrop-blur-xl border"
        style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', boxShadow: '0 24px 80px var(--shadow-color)' }}
      >
        <div className="text-center">
          <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-14 h-14 rounded-2xl gradient-border flex items-center justify-center shadow-lg mb-4 glow-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Sign Up Page</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create your Dayflow HR workspace account</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="p-3 rounded-xl text-xs text-center font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name & Upload Logo */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Company Name :-</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-purple-400" />
                <input type="text" name="company_name" required value={formData.company_name} onChange={handleChange} placeholder="Odoo India"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
              </div>
            </div>
            <label className="px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition hover:bg-purple-600 hover:text-white"
              style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)', color: 'var(--accent)' }}>
              <Upload className="w-4 h-4" />
              <span>{logoFile ? 'Uploaded' : 'Upload Logo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files[0])} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>First Name :-</label>
              <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} placeholder="John"
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Last Name :-</label>
              <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} placeholder="Doe"
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Email :-</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john.doe@company.com"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Phone :-</label>
            <div className="relative">
              <PhoneIcon className="w-4 h-4 absolute left-3 top-3 text-purple-400" />
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Password :-</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-9 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-3" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm Password :-</label>
              <div className="relative">
                <input type={showConfirmPw ? 'text' : 'password'} name="confirm_password" required value={formData.confirm_password} onChange={handleChange} placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-9 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle} />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-2.5 top-3" style={{ color: 'var(--text-muted)' }}>
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Role :-</label>
            <select name="role" value={formData.role} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={inputStyle}>
              <option value="employee">Employee</option>
              <option value="admin">Admin / HR Officer</option>
            </select>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl gradient-border text-white font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer mt-2">
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>Sign Up <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Already have an account ? <Link to="/login" className="font-bold hover:underline" style={{ color: 'var(--accent-pink)' }}>Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};
