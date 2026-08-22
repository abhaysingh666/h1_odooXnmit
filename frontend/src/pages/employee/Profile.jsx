import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Lock, Edit2, Save, X, Building, Phone, Mail, MapPin, DollarSign, Briefcase, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const Card = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
    className="p-6 rounded-2xl border backdrop-blur-sm space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)', boxShadow: '0 4px 24px var(--shadow-color)' }}>
    {children}
  </motion.div>
);

const Field = ({ label, value, locked }) => (
  <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}>
    <p className="text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    <p className="text-sm font-semibold" style={{ color: locked ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{value || '—'}</p>
  </div>
);

export const EmployeeProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [about, setAbout] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [certsStr, setCertsStr] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');

  const isAdmin = user?.role === 'admin';

  const fetchProfile = async () => {
    try {
      const res = await API.get('/employees/me');
      setProfile(res.data);
      setPhone(res.data.personal_details?.phone || '');
      setAddress(res.data.personal_details?.address || '');
      setAbout(res.data.about || '');
      setSkillsStr((res.data.skills || ['React', 'FastAPI', 'Python', 'JavaScript', 'Tailwind CSS']).join(', '));
      setCertsStr((res.data.certifications || ['AWS Certified Developer', 'Agile Scrum Master']).join(', '));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/employees/me', { phone, address, about, skills: skillsStr, certifications: certsStr });
      setEditing(false);
      await fetchProfile();
    } catch { alert('Failed to update profile'); } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--border-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const pd = profile?.personal_details || {};
  const jd = profile?.job_details || {};
  const bd = profile?.bank_details || {};
  const si = profile?.salary_info || {};

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your workspace information, bio, skills, and personal details.</p>
      </motion.div>

      {/* Header Card */}
      <Card delay={0.1}>
        <div className="flex items-center gap-5 flex-wrap">
          <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="w-20 h-20 rounded-2xl gradient-border flex items-center justify-center text-white font-black text-3xl shadow-xl glow-pulse">
            {pd.first_name?.[0] || 'E'}
          </motion.div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{pd.first_name} {pd.last_name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{jd.designation} • {jd.department}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-extrabold font-mono border"
                style={{ background: 'var(--accent-glow)', borderColor: 'var(--border-accent)', color: 'var(--accent)' }}>
                ID: {profile?.employee_id}
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold border capitalize"
                style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--accent-emerald)' }}>
                {jd.employment_type || 'Full-Time'}
              </span>
            </div>
          </div>

          {!editing ? (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border cursor-pointer"
              style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-accent)', color: 'var(--accent)' }}>
              <Edit2 className="w-4 h-4" /> Edit Profile
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="p-2 rounded-xl border cursor-pointer" style={{ borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave}
                className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-white cursor-pointer gradient-border"
                disabled={saving}>
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
          )}
        </div>
      </Card>

      {/* Excalidraw Navigation Tabs */}
      <div className="flex gap-2 border-b pb-2 text-xs font-bold" style={{ borderColor: 'var(--border-main)' }}>
        <button
          onClick={() => setActiveTab('resume')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'resume' ? 'gradient-border text-white shadow-md' : ''}`}
          style={{ color: activeTab === 'resume' ? '#fff' : 'var(--text-secondary)', background: activeTab === 'resume' ? undefined : 'var(--bg-card-alt)' }}
        >
          Resume & Bio
        </button>
        <button
          onClick={() => setActiveTab('private')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'private' ? 'gradient-border text-white shadow-md' : ''}`}
          style={{ color: activeTab === 'private' ? '#fff' : 'var(--text-secondary)', background: activeTab === 'private' ? undefined : 'var(--bg-card-alt)' }}
        >
          Private Info
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'salary' ? 'gradient-border text-white shadow-md' : ''}`}
            style={{ color: activeTab === 'salary' ? '#fff' : 'var(--text-secondary)', background: activeTab === 'salary' ? undefined : 'var(--bg-card-alt)' }}
          >
            Salary Info (Admin Only)
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'resume' && (
        <Card delay={0.2}>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Resume & About Me</h3>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>About Me</label>
            {editing ? (
              <textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell your team about yourself..."
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }} />
            ) : (
              <div className="p-3.5 rounded-xl border text-sm" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
                {about || 'Passionate professional dedicated to software development and teamwork.'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Skills (Comma-separated)</label>
              {editing ? (
                <input type="text" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} placeholder="React, FastAPI, Python, JavaScript, Tailwind CSS"
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }} />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.skills || ['React', 'FastAPI', 'Python', 'Tailwind CSS']).map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-bold border" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)', color: 'var(--accent)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Certifications (Comma-separated)</label>
              {editing ? (
                <input type="text" value={certsStr} onChange={(e) => setCertsStr(e.target.value)} placeholder="AWS Certified Developer, Agile Scrum Master"
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }} />
              ) : (
                <ul className="list-disc list-inside text-xs font-semibold space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  {(profile?.certifications || ['AWS Certified Developer', 'Agile Scrum Master']).map(c => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'private' && (
        <Card delay={0.2}>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Private Personal & Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
              {editing ? (
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0199"
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }} />
              ) : <Field label="" value={phone || '+1 555-0199'} />}
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Residing Address</label>
              {editing ? (
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St"
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }} />
              ) : <Field label="" value={address || '123 Innovation Way, Tech Park'} />}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Date of Birth" value={pd.date_of_birth || '1995-06-15'} locked />
            <Field label="Nationality" value={pd.nationality || 'American'} locked />
            <Field label="Gender" value={pd.gender || 'Male'} locked />
            <Field label="Marital Status" value={pd.marital_status || 'Single'} locked />
          </div>

          <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}>
            <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Bank Account Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              <div>Account No: <strong style={{ color: 'var(--text-primary)' }}>{bd.account_number || '987654321012'}</strong></div>
              <div>Bank: <strong style={{ color: 'var(--text-primary)' }}>{bd.bank_name || 'Chase Bank'}</strong></div>
              <div>IFSC Code: <strong style={{ color: 'var(--text-primary)' }}>{bd.ifsc_code || 'CHAS0123456'}</strong></div>
              <div>PAN No: <strong style={{ color: 'var(--text-primary)' }}>{bd.pan_no || 'ABCDE1234F'}</strong></div>
            </div>
          </div>
        </Card>
      )}

      {/* Salary Info Tab (Admin Only Excalidraw Rule) */}
      {activeTab === 'salary' && isAdmin && (
        <Card delay={0.2}>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Salary & Compensation Structure (Admin View)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl text-white gradient-border">
              <p className="text-xs uppercase font-extrabold opacity-80">Monthly Wage</p>
              <h2 className="text-2xl font-black mt-1">${(si.monthly_wage || 50000).toLocaleString()} / Month</h2>
            </div>
            <div className="p-4 rounded-2xl border" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}>
              <p className="text-xs uppercase font-extrabold" style={{ color: 'var(--text-muted)' }}>Yearly Wage</p>
              <h2 className="text-2xl font-black mt-1" style={{ color: 'var(--accent)' }}>${(si.yearly_wage || 600000).toLocaleString()} / Year</h2>
            </div>
          </div>

          <div className="p-4 rounded-xl border space-y-3 text-xs" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border-main)' }}>
            <h4 className="font-extrabold uppercase tracking-wider border-b pb-1" style={{ borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}>Excalidraw Calculated Salary Components</h4>
            <div className="grid grid-cols-2 gap-3" style={{ color: 'var(--text-secondary)' }}>
              <div>Basic Salary (50% of Wage): <strong style={{ color: 'var(--text-primary)' }}>${si.components?.basic || 25000} / mo</strong></div>
              <div>HRA (50% of Basic): <strong style={{ color: 'var(--text-primary)' }}>${si.components?.hra || 12500} / mo</strong></div>
              <div>Standard Allowance: <strong style={{ color: 'var(--text-primary)' }}>${si.components?.standard_allowance || 4167} / mo</strong></div>
              <div>Employee PF (12% of Basic): <strong style={{ color: 'var(--text-primary)' }}>${si.pf_contributions?.employee || 3000} / mo</strong></div>
              <div>Professional Tax: <strong style={{ color: 'var(--text-primary)' }}>${si.tax_deductions?.professional_tax || 200} / mo</strong></div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
