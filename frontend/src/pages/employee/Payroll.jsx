import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { CreditCard, Lock, Printer, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export const EmployeePayroll = () => {
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { const res = await API.get('/payroll/me'); setPayroll(res.data); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handlePrintPayslip = () => {
    const s = payroll?.salary_structure || {};
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Salary Slip - ${payroll?.employee_id || 'Employee'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #fff; }
            .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #7c3aed; font-size: 28px; letter-spacing: 2px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; }
            .info-item span { display: block; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .info-item strong { font-size: 15px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px 16px; text-align: left; border-bottom: 1fr solid #e2e8f0; }
            th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #475569; }
            td { font-size: 14px; }
            .net-box { background: #7c3aed; color: #fff; padding: 20px; border-radius: 12px; text-align: right; }
            .net-box p { margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600; }
            .net-box h2 { margin: 5px 0 0 0; font-size: 32px; font-weight: 900; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DAYFLOW HRMS</h1>
            <p>Official Monthly Payslip Statement</p>
          </div>
          <div class="info-grid">
            <div class="info-item"><span>Employee ID</span><strong>${payroll?.employee_id || 'N/A'}</strong></div>
            <div class="info-item"><span>Pay Period</span><strong>${payroll?.month || 'Current'}</strong></div>
            <div class="info-item"><span>Payment Status</span><strong>${(payroll?.payment_status || 'Paid').toUpperCase()}</strong></div>
            <div class="info-item"><span>Payment Date</span><strong>${payroll?.payment_date || '28th'}</strong></div>
          </div>
          <table>
            <thead>
              <tr><th>Component</th><th>Category</th><th style="text-align:right">Amount (₹)</th></tr>
            </thead>
            <tbody>
              <tr><td>Basic Salary</td><td>Earnings</td><td style="text-align:right">₹${(s.basic || 0).toLocaleString()}</td></tr>
              <tr><td>House Rent Allowance (HRA)</td><td>Earnings</td><td style="text-align:right">₹${(s.hra || 0).toLocaleString()}</td></tr>
              <tr><td>Standard Allowances</td><td>Earnings</td><td style="text-align:right">₹${(s.allowances || 0).toLocaleString()}</td></tr>
              <tr><td>PF & Tax Deductions</td><td>Deductions</td><td style="text-align:right; color: #dc2626;">-₹${(s.deductions || 0).toLocaleString()}</td></tr>
              <tr style="font-weight: bold; background: #f8fafc;"><td>Gross Salary</td><td>Total Earnings</td><td style="text-align:right; color: #059669;">₹${(s.gross_salary || 0).toLocaleString()}</td></tr>
            </tbody>
          </table>
          <div class="net-box">
            <p>Net Payable Amount</p>
            <h2>₹${(s.net_salary || 0).toLocaleString()}</h2>
          </div>
          <div class="footer">
            <p>This is a computer-generated payslip statement issued by Dayflow HRMS. No signature required.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--border-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const s = payroll?.salary_structure || { basic: 0, hra: 0, allowances: 0, deductions: 0, gross_salary: 0, net_salary: 0 };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>My Payroll</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>View your salary structure and monthly pay details.</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrintPayslip}
          className="px-4 py-2.5 rounded-xl gradient-border text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg">
          <Printer className="w-4 h-4" /> Download Payslip (PDF)
        </motion.button>
      </motion.div>

      {/* Hero Net Salary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-7 rounded-3xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)', boxShadow: '0 20px 60px var(--accent-glow)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'white' }} />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="relative z-10">
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">Net Monthly Salary</p>
          <motion.h2 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}
            className="text-5xl font-black text-white mt-2">
            ₹{s.net_salary.toLocaleString()}
          </motion.h2>
          <div className="flex items-center gap-4 mt-4 text-xs text-white/80 font-semibold">
            <span>Month: <strong className="text-white">{payroll?.month || 'Current'}</strong></span>
            <span>Status: <strong className="text-green-300 capitalize">{payroll?.payment_status || 'Paid'}</strong></span>
            <span>Pay Date: <strong className="text-white">{payroll?.payment_date || '28th'}</strong></span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Earnings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider" style={{ color: 'var(--accent-emerald)' }}>+ Earnings</h3>
          <div className="space-y-3">
            {[
              { label: 'Basic Salary', val: s.basic },
              { label: 'HRA (House Rent)', val: s.hra },
              { label: 'Allowances', val: s.allowances },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-main)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="font-black" style={{ color: 'var(--text-primary)' }}>₹{(val || 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold" style={{ color: 'var(--accent-emerald)' }}>Gross Total</span>
              <span className="font-black text-lg" style={{ color: 'var(--accent-emerald)' }}>₹{(s.gross_salary || 0).toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Deductions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider" style={{ color: '#ef4444' }}>− Deductions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-main)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>PF + Tax Deductions</span>
              <span className="font-black" style={{ color: '#ef4444' }}>-₹{(s.deductions || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-xl flex items-center gap-2" style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-main)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Salary structure is managed by HR. Contact HR for revisions.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
