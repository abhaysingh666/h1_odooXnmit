import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { Search, Plane, Building, Phone, MapPin, X, Plus, UserPlus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [loading, setLoading] = useState(true);

  // Add Employee Modal state (Excalidraw Note requirement)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', email: '', role: 'employee' });
  const [addLoading, setAddLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setSuccessMsg('');
    try {
      const generatedPass = `OI${new Date().getFullYear()}TempPass!`;
      await API.post('/auth/register', {
        email: addForm.email,
        password: generatedPass,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        role: addForm.role
      });
      setSuccessMsg(`Employee created successfully! Temp Password: ${generatedPass}`);
      setAddForm({ first_name: '', last_name: '', email: '', role: 'employee' });
      await fetchEmployees();
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
      }, 2500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create employee');
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = employees.filter((emp) => {
    const name = `${emp.personal_details?.first_name || ''} ${emp.personal_details?.last_name || ''}`.toLowerCase();
    const id = (emp.employee_id || '').toLowerCase();
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
  });

  const getStatusIndicator = (liveStatus) => {
    switch (liveStatus) {
      case 'present':
        return (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Present
          </div>
        );
      case 'on_leave':
        return (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-700/60">
            <Plane className="w-3 h-3 text-purple-500" />
            On Leave
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/60">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Absent
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-purple-100">Employee Directory</h1>
          <p className="text-sm text-gray-500 dark:text-purple-400/80">Manage workforce profiles, credentials, and auto-generated Login IDs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-purple-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-gray-900 dark:text-purple-100 text-sm focus:border-purple-500 focus:outline-none shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl gradient-border text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-purple-500 text-sm">Loading workforce directory...</p>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#130b24] border border-purple-200 dark:border-purple-900/40 rounded-2xl text-gray-500 dark:text-purple-400/60 text-sm">
          No employees found matching "{search}".
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((emp) => (
            <motion.div
              layout
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              key={emp._id}
              onClick={() => {
                setSelectedEmp(emp);
                setActiveTab('resume');
              }}
              className="p-5 rounded-2xl bg-white dark:bg-[#130b24] border border-purple-200 dark:border-purple-900/40 shadow-lg hover:shadow-xl dark:shadow-purple-950/50 space-y-4 cursor-pointer hover:border-purple-500/60 transition relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {emp.personal_details?.first_name?.[0] || 'E'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {emp.personal_details?.first_name} {emp.personal_details?.last_name}
                    </h3>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">ID: {emp.employee_id}</p>
                  </div>
                </div>
                {getStatusIndicator(emp.live_status)}
              </div>

              <div className="space-y-2 text-xs text-gray-600 dark:text-purple-300/80 border-t border-purple-100 dark:border-purple-900/40 pt-3">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-purple-500" />
                  <span>{emp.job_details?.designation} • {emp.job_details?.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-500" />
                  <span>{emp.personal_details?.phone || 'No phone'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Employee Modal (Excalidraw Note Feature) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white dark:bg-[#150c2c] border border-purple-200 dark:border-purple-800/60 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-5 relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Create Employee / User</h2>
                <p className="text-xs text-gray-500 dark:text-purple-400 mt-1">Generates unique Login ID (OI...) and auto-assigns initial password.</p>
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-gray-700 dark:text-purple-300">First Name</label>
                    <input
                      type="text"
                      required
                      value={addForm.first_name}
                      onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                      placeholder="Jane"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-gray-700 dark:text-purple-300">Last Name</label>
                    <input
                      type="text"
                      required
                      value={addForm.last_name}
                      onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                      placeholder="Smith"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-gray-700 dark:text-purple-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="jane.smith@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-gray-700 dark:text-purple-300">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin / HR Officer</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 text-gray-700 dark:text-purple-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 py-2.5 rounded-xl gradient-border text-white font-bold"
                  >
                    {addLoading ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Profile Inspection Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#150c2c] border border-purple-200 dark:border-purple-800/60 p-6 rounded-3xl max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-purple-200 dark:border-purple-900/40 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedEmp.personal_details?.first_name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedEmp.personal_details?.first_name} {selectedEmp.personal_details?.last_name}
                    </h2>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                      ID: {selectedEmp.employee_id} • {selectedEmp.job_details?.designation}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmp(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-purple-900/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 border-b border-purple-200 dark:border-purple-900/40 pb-2 overflow-x-auto text-xs font-semibold">
                {['resume', 'private', 'salary', 'security'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl capitalize transition ${
                      activeTab === tab
                        ? 'bg-purple-600 text-white dark:bg-purple-800 dark:text-purple-100 shadow-md'
                        : 'text-gray-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950'
                    }`}
                  >
                    {tab === 'resume' ? 'About & Resume' : tab === 'private' ? 'Private Info' : tab === 'salary' ? 'Salary Info' : 'Security'}
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-700 dark:text-purple-200 space-y-4">
                {activeTab === 'resume' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-1">About</h4>
                      <p>{selectedEmp.about || 'No details provided.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedEmp.skills || ['React', 'Python']).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Certifications</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {(selectedEmp.certifications || ['Agile Certified']).map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'private' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                        <span className="text-purple-500 font-semibold block mb-1">Date of Birth</span>
                        <span>{selectedEmp.personal_details?.date_of_birth || '1995-06-15'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                        <span className="text-purple-500 font-semibold block mb-1">Nationality</span>
                        <span>{selectedEmp.personal_details?.nationality || 'American'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                        <span className="text-purple-500 font-semibold block mb-1">Marital Status</span>
                        <span>{selectedEmp.personal_details?.marital_status || 'Single'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                        <span className="text-purple-500 font-semibold block mb-1">Personal Email</span>
                        <span>{selectedEmp.personal_details?.personal_email || selectedEmp.email}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'salary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white">
                        <span className="text-xs uppercase font-medium opacity-80">Monthly Wage</span>
                        <h3 className="text-2xl font-bold mt-1">${(selectedEmp.salary_info?.monthly_wage || 50000).toLocaleString()} / Month</h3>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800">
                        <span className="text-xs uppercase font-medium text-purple-600 dark:text-purple-400">Yearly Wage</span>
                        <h3 className="text-2xl font-bold mt-1 text-purple-900 dark:text-purple-100">${(selectedEmp.salary_info?.yearly_wage || 600000).toLocaleString()} / Year</h3>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 space-y-2">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-200">Security & Credentials</h4>
                    <p className="text-xs text-gray-500 dark:text-purple-400">Login ID: <strong className="font-mono text-purple-600 dark:text-purple-300">{selectedEmp.employee_id}</strong></p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
