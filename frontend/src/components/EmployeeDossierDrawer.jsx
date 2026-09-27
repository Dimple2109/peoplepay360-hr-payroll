import React from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import DossierContractWidget from './DossierContractWidget';
import { 
  X, 
  Shield, 
  Sparkles, 
  Calendar, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  DollarSign, 
  UserCheck, 
  Edit3,
  Award,
  Clock,
  Briefcase,
  Users
} from 'lucide-react';

export default function EmployeeDossierDrawer() {
  const { 
    isDossierOpen, 
    closeDossier, 
    viewingEmployee, 
    openEditModal,
    transitionEmployeeStatus 
  } = useZeroGravity();

  if (!isDossierOpen || !viewingEmployee) return null;

  const emp = viewingEmployee;
  const totalComp = parseFloat(emp.base_salary || 0) + parseFloat(emp.gravity_allowance || 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-cosmic-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md h-full glass-panel-elevated border-l border-cyan-500/30 flex flex-col justify-between overflow-y-auto animate-slideLeft shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 bg-cosmic-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-quantum-cyan border border-cyan-500/30">
              ORBITAL DOSSIER
            </span>
            <span className="text-xs font-mono text-slate-400">{emp.employee_id}</span>
          </div>

          <button
            onClick={closeDossier}
            className="p-1.5 rounded-lg bg-cosmic-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Astronaut Hero */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={emp.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${emp.employee_id}`}
                alt={emp.full_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-quantum-cyan/40 bg-cosmic-900 shadow-levitate"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${emp.employee_id}`;
                }}
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cosmic-950 border border-quantum-cyan text-quantum-cyan">
                {emp.anti_gravity_rating || 'AG-9'}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {emp.full_name || `${emp.first_name} ${emp.last_name}`}
              </h3>
              <p className="text-xs font-mono text-quantum-cyan">{emp.job_position}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  {emp.department_name || 'Quantum Engineering'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  {emp.status}
                </span>
              </div>
            </div>
          </div>

          {/* Clearance & Anti-Gravity Specs */}
          <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-quantum-cyan" /> Gravitational Clearance Profile
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Security Clearance:</span>
              <span className="text-quantum-cyan font-bold">{emp.clearance_tier || 'Level-2 Specialist'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Anti-Gravity Rating:</span>
              <span className="text-purple-300 font-bold">{emp.anti_gravity_rating || 'AG-9'} Warp-Rated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Assigned Deck:</span>
              <span className="text-slate-200">{emp.orbital_deck || emp.work_location || 'Deck 01 - Propulsion'}</span>
            </div>
          </div>

          {/* Quantum Compensation Matrix */}
          <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-quantum-cyan">
                <DollarSign className="w-3.5 h-3.5" /> Quantum Compensation
              </span>
              <span className="text-slate-400 font-sans">USD Credits</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Base Salary:</span>
              <span className="text-slate-200">{formatCurrency(emp.base_salary)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Zero-G Allowance:</span>
              <span className="text-emerald-400">+{formatCurrency(emp.gravity_allowance)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
              <span className="text-white">Total Annual Package:</span>
              <span className="text-quantum-cyan">{formatCurrency(totalComp)}</span>
            </div>
          </div>

          {/* Contract & Schedule Hub (embedded dossier widgets) */}
          <DossierContractWidget employee={emp} />

          {/* Work Schedule & Supervisor */}
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Flight Rotation Schedule</div>
                <div className="text-slate-200 font-mono mt-0.5">{emp.schedule}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Commanding Officer / Lead</div>
                <div className="text-slate-200 font-medium mt-0.5">
                  {emp.manager_name ? `${emp.manager_name} (${emp.manager_position || 'Lead'})` : 'Council of Fleet Admirals'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Orbital Comms & Beacon</div>
                <div className="text-slate-200 font-mono mt-0.5">{emp.email}</div>
                {emp.emergency_contact && (
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Beacon Relay: {emp.emergency_contact}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direct Reports (if any) */}
          {emp.direct_reports && emp.direct_reports.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-quantum-cyan flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Subordinate Crew ({emp.direct_reports.length})
              </div>
              <div className="space-y-1.5">
                {emp.direct_reports.map((rep) => (
                  <div key={rep.id} className="flex items-center justify-between p-2 rounded-lg bg-cosmic-950/80 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={rep.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${rep.employee_id}`}
                        alt={rep.first_name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                      <span className="font-medium text-slate-200">{rep.first_name} {rep.last_name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{rep.job_position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {emp.notes && (
            <div className="p-3.5 rounded-2xl bg-cosmic-900/60 border border-slate-800 text-xs">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Operational Flight Notes
              </div>
              <p className="text-slate-300 italic">{emp.notes}</p>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-cosmic-900/90 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              closeDossier();
              openEditModal(emp);
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-xs font-semibold shadow-md flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>Recalibrate Record</span>
          </button>

          <button
            onClick={closeDossier}
            className="px-4 py-2.5 rounded-xl bg-cosmic-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
