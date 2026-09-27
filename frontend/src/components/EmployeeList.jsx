import React from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Shield, 
  Sparkles, 
  Calendar, 
  UserCheck, 
  ArrowUpDown,
  MoreVertical,
  Briefcase
} from 'lucide-react';

const STATUS_CONFIG = {
  Active: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Active (Sync)',
  },
  Onboarding: {
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/30',
    text: 'text-quantum-cyan',
    dot: 'bg-quantum-cyan',
    label: 'Onboarding',
  },
  'On-Leave': {
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
    label: 'On-Leave',
  },
  Suspended: {
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    label: 'Suspended',
  },
};

export default function EmployeeList() {
  const { 
    employees, 
    loading, 
    openEditModal, 
    openDossier, 
    deleteEmployee,
    transitionEmployeeStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useZeroGravity();

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading && employees.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-cyan-500/20 text-center">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-quantum-cyan border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-400">Synchronizing orbital employee records...</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-cyan-500/20 text-center">
        <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Astronauts Found</h3>
        <p className="text-xs font-mono text-slate-400 mt-1">Try loosening your search query or department filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-cosmic-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4 cursor-pointer hover:text-quantum-cyan transition-colors" onClick={() => handleSort('first_name')}>
                <div className="flex items-center gap-1.5">
                  <span>Astronaut / Callsign</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-quantum-cyan transition-colors" onClick={() => handleSort('job_position')}>
                <div className="flex items-center gap-1.5">
                  <span>Position & Deck</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Department & Clearance</th>
              <th className="py-3.5 px-4">Flight Schedule</th>
              <th className="py-3.5 px-4">Supervisor / Manager</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-quantum-cyan transition-colors" onClick={() => handleSort('base_salary')}>
                <div className="flex items-center gap-1.5">
                  <span>Compensation</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-quantum-cyan transition-colors" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1.5">
                  <span>Orbital Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {employees.map((emp) => {
              const statusCfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.Active;
              const totalComp = parseFloat(emp.base_salary || 0) + parseFloat(emp.gravity_allowance || 0);

              return (
                <tr 
                  key={emp.id}
                  className="hover:bg-cyan-950/15 transition-colors group"
                >
                  {/* 1. Astronaut Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={emp.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${emp.employee_id}`}
                          alt={emp.full_name}
                          className="w-10 h-10 rounded-xl object-cover border border-cyan-500/30 bg-cosmic-800 shadow-sm group-hover:border-quantum-cyan transition-colors"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${emp.employee_id}`;
                          }}
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-cosmic-950 ${statusCfg.dot}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5 group-hover:text-quantum-cyan transition-colors">
                          <span>{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-quantum-cyan border border-cyan-500/20">
                            {emp.anti_gravity_rating || 'AG-9'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="text-quantum-cyan/90 font-medium">{emp.employee_id}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{emp.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Position & Deck */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{emp.job_position}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {emp.orbital_deck || emp.work_location || 'Deck 01 - Core'}
                    </div>
                  </td>

                  {/* 3. Department & Clearance Tier */}
                  <td className="py-3 px-4">
                    <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-purple-950/50 text-purple-300 border border-purple-500/30 mb-1">
                      {emp.department_name || 'Engineering'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-quantum-cyan" />
                      <span>{emp.clearance_tier || emp.role_clearance || 'Level-2 Specialist'}</span>
                    </div>
                  </td>

                  {/* 4. Flight Schedule */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[150px]">{emp.schedule}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {emp.employment_type || 'Full-Time'}
                    </div>
                  </td>

                  {/* 5. Supervisor / Manager */}
                  <td className="py-3 px-4">
                    {emp.manager_name ? (
                      <div>
                        <div className="font-medium text-slate-200 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-quantum-cyan" />
                          <span>{emp.manager_name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                          {emp.manager_position || 'Director'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 italic">Orbital Council / Self</span>
                    )}
                  </td>

                  {/* 6. Compensation (Base + Gravity Allowance) */}
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-slate-100">
                      {formatCurrency(totalComp)}
                    </div>
                    <div className="text-[10px] text-quantum-cyan flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>+{formatCurrency(emp.gravity_allowance)} AG Bonus</span>
                    </div>
                  </td>

                  {/* 7. Orbital Status with Quick Switch */}
                  <td className="py-3 px-4">
                    <div className="relative inline-block">
                      <select
                        value={emp.status}
                        onChange={(e) => transitionEmployeeStatus(emp.id, e.target.value)}
                        className={`text-xs font-mono font-medium px-2.5 py-1 rounded-lg border appearance-none cursor-pointer focus:outline-none transition-colors ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}
                        title="Click to recalibrate status in zero-g"
                      >
                        <option value="Active" className="bg-cosmic-900 text-emerald-400">Active (Sync)</option>
                        <option value="Onboarding" className="bg-cosmic-900 text-cyan-400">Onboarding</option>
                        <option value="On-Leave" className="bg-cosmic-900 text-purple-400">On-Leave</option>
                        <option value="Suspended" className="bg-cosmic-900 text-rose-400">Suspended</option>
                      </select>
                    </div>
                  </td>

                  {/* 8. Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Dossier */}
                      <button
                        onClick={() => openDossier(emp)}
                        className="p-1.5 rounded-lg bg-cosmic-800 border border-slate-700 hover:border-quantum-cyan/50 text-slate-300 hover:text-quantum-cyan transition-colors"
                        title="View Full Astronaut Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Recalibrate / Edit */}
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 rounded-lg bg-cosmic-800 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-purple-400 transition-colors"
                        title="Recalibrate Astronaut Parameters"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Disengage / Delete */}
                      <button
                        onClick={() => deleteEmployee(emp.id, emp.full_name)}
                        className="p-1.5 rounded-lg bg-cosmic-800 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 transition-colors"
                        title="Disengage Astronaut from Orbit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
