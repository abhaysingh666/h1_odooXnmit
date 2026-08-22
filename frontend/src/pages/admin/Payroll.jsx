import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { DollarSign, Edit2, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [form, setForm] = useState({ basic: 0, hra: 0, allowances: 0, deductions: 0, payment_status: 'paid' });
  const [saving, setSaving] = useState(false);

  const fetchPayrolls = async () => {
    try { const res = await API.get('/payroll'); setPayrolls(res.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayrolls(); }, []);

  const openEdit = (p) => {
    const s = p.salary_structure || {};
    setEditingPayroll(p);
    setForm({
      basic: s.basic || 0,
      hra: s.hra || 0,
      allowances: s.allowances || 0,
      deductions: s.deductions || 0,
      payment_status: p.payment_status || 'paid'
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const basic = Number(form.basic);
      const hra = Number(form.hra);
      const allowances = Number(form.allowances);
      const deductions = Number(form.deductions);
      const gross_salary = basic + hra + allowances;
      const net_salary = gross_salary - deductions;

      await API.put(`/payroll/${editingPayroll._id}`, {
        salary_structure: { basic, hra, allowances, deductions, gross_salary, net_salary },
        payment_status: form.payment_status
      });

      setEditingPayroll(null);
      await fetchPayrolls();
    } catch { alert('Failed to update payroll structure'); } finally { setSaving(false); }
  };

  const totalGross = payrolls.reduce((s, p) => s + (p.salary_structure?.gross_salary || 0), 0);
  const totalNet = payrolls.reduce((s, p) => s + (p.salary_structure?.net_salary || 0), 0);

  const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Payroll Management</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Workforce compensation and salary structures.</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Employees', value: payrolls.length, color: 'var(--accent)' },
          { label: 'Total Gross Payout', value: `₹${totalGross.toLocaleString()}`, color: 'var(--accent-pink)' },
          { label: 'Total Net Payout', value: `₹${totalNet.toLocaleString()}`, color: 'var(--accent-emerald)' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}
            className="p-5 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-2xl font-black mt-2" style={{ color }}>{value}</p>
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
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No payroll records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead style={{ background: 'var(--bg-card-alt)' }}>
                <tr>
                  {['Employee ID', 'Month', 'Basic', 'HRA', 'Deductions', 'Gross', 'Net Pay', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p, i) => {
                  const s = p.salary_structure || {};
                  return (
                    <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-t" style={{ borderColor: 'var(--border-main)' }}>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>{p.employee_id}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>{p.month}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>₹{(s.basic || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>₹{(s.hra || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: '#ef4444' }}>-₹{(s.deductions || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>₹{(s.gross_salary || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-black" style={{ color: 'var(--accent-emerald)' }}>₹{(s.net_salary || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold capitalize"
                          style={{
                            background: p.payment_status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)',
                            border: `1px solid ${p.payment_status === 'paid' ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}`,
                            color: p.payment_status === 'paid' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                          }}>
                          ● {p.payment_status || 'paid'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg border hover:opacity-80 transition cursor-pointer"
                          style={{ borderColor: 'var(--border-accent)', color: 'var(--accent)', background: 'var(--bg-card-alt)' }} title="Edit Salary Structure">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Admin Salary Edit Modal */}
      <AnimatePresence>
        {editingPayroll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-7 border space-y-5 relative"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-accent)', boxShadow: '0 24px 80px var(--shadow-color)' }}>
              <button onClick={() => setEditingPayroll(null)} className="absolute top-4 right-4 p-2 rounded-xl cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Edit Salary ({editingPayroll.employee_id})</h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Basic Salary (₹)</label>
                    <input type="number" required value={form.basic} onChange={(e) => setForm({ ...form, basic: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>HRA (₹)</label>
                    <input type="number" required value={form.hra} onChange={(e) => setForm({ ...form, hra: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Allowances (₹)</label>
                    <input type="number" required value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Deductions (₹)</label>
                    <input type="number" required value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Payment Status</label>
                  <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm" style={inputStyle}>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingPayroll(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer"
                    style={{ borderColor: 'var(--border-main)', color: 'var(--text-secondary)', background: 'var(--bg-card-alt)' }}>Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white gradient-border cursor-pointer">
                    {saving ? 'Updating...' : 'Save Structure'}
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
