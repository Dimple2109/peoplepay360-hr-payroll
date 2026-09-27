// ====================================================================
// /zero-gravity-state-management: Zero-G Kanban Board
// Floating, weightless card drag-and-drop physics, column transitions,
// and microgravity visual indicators
// ====================================================================

import React, { useState } from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { 
  Shield, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  Edit3, 
  Calendar, 
  UserCheck, 
  Layers,
  ArrowRightLeft
} from 'lucide-react';

const KANBAN_COLUMNS = [
  {
    id: 'Onboarding',
    title: 'Gravity Calibration',
    subtitle: 'Onboarding & Training',
    color: 'from-cyan-500/20 to-blue-600/10',
    borderColor: 'border-cyan-500/30',
    headerBg: 'bg-cyan-950/60',
    dotColor: 'bg-quantum-cyan',
    badgeText: 'text-quantum-cyan',
  },
  {
    id: 'Active',
    title: 'Orbital Synchronized',
    subtitle: 'Full Duty Active Roster',
    color: 'from-emerald-500/20 to-teal-600/10',
    borderColor: 'border-emerald-500/30',
    headerBg: 'bg-emerald-950/60',
    dotColor: 'bg-emerald-400',
    badgeText: 'text-emerald-400',
  },
  {
    id: 'On-Leave',
    title: 'Acclimation Sabbatical',
    subtitle: 'Gravitational Leave',
    color: 'from-purple-500/20 to-pink-600/10',
    borderColor: 'border-purple-500/30',
    headerBg: 'bg-purple-950/60',
    dotColor: 'bg-purple-400',
    badgeText: 'text-purple-400',
  },
  {
    id: 'Suspended',
    title: 'Field Containment',
    subtitle: 'Investigation / Suspended',
    color: 'from-rose-500/20 to-red-600/10',
    borderColor: 'border-rose-500/30',
    headerBg: 'bg-rose-950/60',
    dotColor: 'bg-rose-400',
    badgeText: 'text-rose-400',
  },
];

export default function EmployeeKanban() {
  const { 
    employees, 
    transitionEmployeeStatus, 
    openDossier, 
    openEditModal 
  } = useZeroGravity();

  const [draggedEmpId, setDraggedEmpId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, empId) => {
    setDraggedEmpId(empId);
    e.dataTransfer.setData('text/plain', empId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const empId = parseInt(e.dataTransfer.getData('text/plain'), 10) || draggedEmpId;
    if (empId) {
      await transitionEmployeeStatus(empId, targetStatus);
    }
    setDraggedEmpId(null);
  };

  const getNextStatus = (current) => {
    const order = ['Onboarding', 'Active', 'On-Leave', 'Suspended'];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  };

  const getPrevStatus = (current) => {
    const order = ['Onboarding', 'Active', 'On-Leave', 'Suspended'];
    const idx = order.indexOf(current);
    return idx > 0 ? order[idx - 1] : null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {KANBAN_COLUMNS.map((col) => {
        const columnEmployees = employees.filter((e) => e.status === col.id);
        const isTargeted = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl glass-panel border transition-all duration-300 min-h-[600px] ${
              isTargeted 
                ? 'border-quantum-cyan shadow-[0_0_25px_rgba(0,240,255,0.3)] bg-cosmic-900/90 scale-[1.01]' 
                : `${col.borderColor} bg-cosmic-950/70`
            }`}
          >
            {/* Column Header */}
            <div className={`p-3.5 rounded-t-2xl border-b border-slate-800/80 ${col.headerBg} flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor} animate-pulse`} />
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase">
                    {col.title}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">{col.subtitle}</p>
                </div>
              </div>

              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cosmic-900 border border-slate-700 ${col.badgeText}`}>
                {columnEmployees.length}
              </span>
            </div>

            {/* Column Dropzone / Cards Container */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-270px)]">
              {columnEmployees.length === 0 ? (
                <div className="h-36 border-2 border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center p-4">
                  <ArrowRightLeft className="w-5 h-5 text-slate-600 mb-1" />
                  <span className="text-[11px] font-mono text-slate-400">Zero astronauts in this vector</span>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">Drag card here to calibrate</span>
                </div>
              ) : (
                columnEmployees.map((emp) => {
                  const isBeingDragged = draggedEmpId === emp.id;
                  const nextCol = getNextStatus(emp.status);
                  const prevCol = getPrevStatus(emp.status);

                  return (
                    <div
                      key={emp.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, emp.id)}
                      className={`glass-panel-elevated p-3.5 rounded-xl border border-cyan-500/20 zero-g-hover cursor-grab active:cursor-grabbing transition-all select-none ${
                        isBeingDragged ? 'opacity-40 scale-95 border-dashed border-quantum-cyan' : ''
                      }`}
                    >
                      {/* Card Top: Avatar & Identification */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${emp.employee_id}`}
                            alt={emp.full_name}
                            className="w-9 h-9 rounded-lg object-cover border border-cyan-500/30 bg-cosmic-900"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${emp.employee_id}`;
                            }}
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-100 hover:text-quantum-cyan transition-colors">
                              {emp.full_name}
                            </div>
                            <div className="text-[10px] font-mono text-quantum-cyan">
                              {emp.employee_id}
                            </div>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-quantum-cyan border border-cyan-500/30">
                          {emp.anti_gravity_rating || 'AG-9'}
                        </span>
                      </div>

                      {/* Position & Department */}
                      <div className="mb-2.5">
                        <div className="text-xs font-medium text-slate-200 leading-tight">
                          {emp.job_position}
                        </div>
                        <div className="text-[10px] font-mono text-purple-300 mt-0.5 truncate">
                          {emp.department_name || 'Engineering'}
                        </div>
                      </div>

                      {/* Meta Information: Schedule & Manager */}
                      <div className="space-y-1 py-2 border-y border-slate-800/80 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-400" /> Schedule:
                          </span>
                          <span className="text-slate-300 truncate max-w-[130px]">{emp.schedule}</span>
                        </div>
                        {emp.manager_name && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-400">
                              <UserCheck className="w-3 h-3 text-slate-400" /> Lead:
                            </span>
                            <span className="text-slate-300 truncate max-w-[130px]">{emp.manager_name}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Shield className="w-3 h-3 text-quantum-cyan" /> Clearance:
                          </span>
                          <span className="text-quantum-cyan">{emp.clearance_tier || 'Specialist'}</span>
                        </div>
                      </div>

                      {/* Compensation Badge */}
                      <div className="flex items-center justify-between mt-2.5 pt-1 text-[11px] font-mono">
                        <span className="text-slate-400">Total Orbit Pay:</span>
                        <span className="font-semibold text-slate-100">
                          ${((parseFloat(emp.base_salary || 0) + parseFloat(emp.gravity_allowance || 0)) / 1000).toFixed(0)}k/yr
                        </span>
                      </div>

                      {/* Card Footer: Quick Zero-G Move and Inspect Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                        {/* Dossier & Edit icons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openDossier(emp)}
                            className="p-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-quantum-cyan transition-colors"
                            title="Inspect Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1 rounded bg-cosmic-800 hover:bg-cosmic-700 text-slate-400 hover:text-purple-400 transition-colors"
                            title="Edit Astronaut"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Fast Thruster Status Steppers */}
                        <div className="flex items-center gap-1">
                          {prevCol && (
                            <button
                              onClick={() => transitionEmployeeStatus(emp.id, prevCol)}
                              className="px-1.5 py-0.5 rounded bg-cosmic-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-0.5 border border-slate-700"
                              title={`Propel backward to ${prevCol}`}
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {nextCol && (
                            <button
                              onClick={() => transitionEmployeeStatus(emp.id, nextCol)}
                              className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-[10px] font-mono text-quantum-cyan hover:text-white flex items-center gap-0.5 border border-cyan-500/40"
                              title={`Propel forward to ${nextCol}`}
                            >
                              <span>Propel</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
