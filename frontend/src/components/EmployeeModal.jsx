import React, { useState, useEffect } from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Shield, 
  Sparkles,
  MapPin,
  FileText
} from 'lucide-react';

const SCHEDULE_OPTIONS = [
  'Standard Earth-Sync (9AM-5PM)',
  'Orbital Shift Alpha (6AM-2PM)',
  'Zero-G Flextime',
  'Lunar Stasis Rotation',
  'Deep-Space Sync (24/7 On-Call)',
];

const CLEARANCE_TIERS = [
  'Level-1 Cadet',
  'Level-2 Specialist',
  'Level-3 Officer',
  'Level-4 Commander',
  'Level-5 Fleet Admiral',
];

const ANTI_GRAV_RATINGS = ['AG-3', 'AG-5', 'AG-7', 'AG-9', 'AG-X'];

const STATUS_OPTIONS = ['Active', 'Onboarding', 'On-Leave', 'Suspended'];

export default function EmployeeModal() {
  const { 
    isFormModalOpen, 
    closeFormModal, 
    editingEmployee, 
    saveEmployee, 
    departments, 
    roles, 
    employees,
    actionLoading 
  } = useZeroGravity();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    role_id: '',
    job_position: '',
    manager_id: '',
    schedule: 'Standard Earth-Sync (9AM-5PM)',
    status: 'Onboarding',
    work_location: 'Orbital Station Alpha / Remote',
    employment_type: 'Full-Time Quantum Sync',
    base_salary: 110000,
    gravity_allowance: 12000,
    anti_gravity_rating: 'AG-9',
    clearance_tier: 'Level-2 Specialist',
    emergency_contact: '',
    notes: '',
  });

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        first_name: editingEmployee.first_name || '',
        last_name: editingEmployee.last_name || '',
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || '',
        department_id: editingEmployee.department_id ? String(editingEmployee.department_id) : '',
        role_id: editingEmployee.role_id ? String(editingEmployee.role_id) : '',
        job_position: editingEmployee.job_position || '',
        manager_id: editingEmployee.manager_id ? String(editingEmployee.manager_id) : '',
        schedule: editingEmployee.schedule || 'Standard Earth-Sync (9AM-5PM)',
        status: editingEmployee.status || 'Active',
        work_location: editingEmployee.work_location || 'Orbital Station Alpha / Remote',
        employment_type: editingEmployee.employment_type || 'Full-Time Quantum Sync',
        base_salary: editingEmployee.base_salary || 110000,
        gravity_allowance: editingEmployee.gravity_allowance || 12000,
        anti_gravity_rating: editingEmployee.anti_gravity_rating || 'AG-9',
        clearance_tier: editingEmployee.clearance_tier || 'Level-2 Specialist',
        emergency_contact: editingEmployee.emergency_contact || '',
        notes: editingEmployee.notes || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department_id: departments[0]?.id ? String(departments[0].id) : '',
        role_id: roles[0]?.id ? String(roles[0].id) : '',
        job_position: '',
        manager_id: '',
        schedule: 'Standard Earth-Sync (9AM-5PM)',
        status: 'Onboarding',
        work_location: 'Orbital Station Alpha / Remote',
        employment_type: 'Full-Time Quantum Sync',
        base_salary: 110000,
        gravity_allowance: 12000,
        anti_gravity_rating: 'AG-9',
        clearance_tier: 'Level-2 Specialist',
        emergency_contact: '',
        notes: '',
      });
    }
  }, [editingEmployee, departments, roles, isFormModalOpen]);

  if (!isFormModalOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveEmployee(formData);
  };

  // Potential supervisors (exclude current editing employee to prevent self-management loops)
  const managerOptions = employees.filter((e) => !editingEmployee || e.id !== editingEmployee.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="glass-panel-elevated w-full max-w-3xl rounded-3xl border border-quantum-cyan/30 shadow-levitate-hover max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-cosmic-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-quantum-cyan shadow-quantum-glow">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{editingEmployee ? 'Recalibrate Astronaut Dossier' : 'Enroll Astronaut into Orbital Service'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-quantum-cyan border border-cyan-500/30">
                  {editingEmployee ? editingEmployee.employee_id : 'NEW CALLSIGN'}
                </span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Core Master Registry • Gravitational Synchronized
              </p>
            </div>
          </div>

          <button
            onClick={closeFormModal}
            className="p-2 rounded-xl bg-cosmic-800 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Personal Coordinates */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-quantum-cyan mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 1. Personal & Identity Coordinates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Elena"
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quantum-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Vance-Reyes"
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quantum-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Interstellar Comms Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="elena@peoplepay360.io"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quantum-cyan font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sub-Space Frequency / Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 019-2041"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quantum-cyan font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Position, Department, Manager & Schedule */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-mono uppercase tracking-wider text-quantum-cyan mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> 2. Orbital Assignment & Hierarchy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Position Title *</label>
                <input
                  type="text"
                  name="job_position"
                  required
                  value={formData.job_position}
                  onChange={handleChange}
                  placeholder="e.g. Lead Zero-G Systems Architect"
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quantum-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Orbital Department</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan"
                >
                  <option value="">Unassigned</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Supervisor / Manager</label>
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan"
                >
                  <option value="">None (Reports to Council / Self)</option>
                  {managerOptions.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.full_name || `${mgr.first_name} ${mgr.last_name}`} - {mgr.job_position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Flight Schedule</label>
                <select
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan font-mono"
                >
                  {SCHEDULE_OPTIONS.map((sched) => (
                    <option key={sched} value={sched}>
                      {sched}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Orbital Status (Kanban Stage)</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan font-mono"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Station / Deck</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="work_location"
                    value={formData.work_location}
                    onChange={handleChange}
                    placeholder="Orbital Station Alpha / Remote"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Quantum Compensation & Anti-Gravity Specs */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-mono uppercase tracking-wider text-quantum-cyan mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> 3. Quantum Compensation & Anti-Gravity Ratings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Base Salary ($/yr)</label>
                <input
                  type="number"
                  name="base_salary"
                  value={formData.base_salary}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Zero-G Allowance ($)</label>
                <input
                  type="number"
                  name="gravity_allowance"
                  value={formData.gravity_allowance}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Anti-Gravity Rating</label>
                <select
                  name="anti_gravity_rating"
                  value={formData.anti_gravity_rating}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan font-mono"
                >
                  {ANTI_GRAV_RATINGS.map((ag) => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Clearance Tier</label>
                <select
                  name="clearance_tier"
                  value={formData.clearance_tier}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan font-mono"
                >
                  {CLEARANCE_TIERS.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Frequency & Notes */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-mono uppercase tracking-wider text-quantum-cyan mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> 4. Emergency Comms & Operational Notes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Beacon Contact</label>
                <input
                  type="text"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="e.g. Orbital Relay Station #9"
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Special Operational Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Mission details, zero-g training acclimation logs..."
                  className="w-full px-3.5 py-2 rounded-xl bg-cosmic-900/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-quantum-cyan resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-cosmic-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-quantum-cyan to-teal-400 text-cosmic-950 font-bold text-xs font-mono tracking-wide shadow-levitate hover:shadow-levitate-hover flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-cosmic-950 stroke-[2.5]" />
              <span>{actionLoading ? 'Synchronizing...' : editingEmployee ? 'Update Astronaut Record' : 'Enroll Astronaut'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
