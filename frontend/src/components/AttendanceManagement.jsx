// ====================================================================
// PeoplePay360: Attendance Tracking & Cockpit
// /orbital-attendance-sync   — Real-time check-in, check-out, worked hours computation
// /gravity-exception-detector — Missing check-outs, late entries, manual corrections
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { api } from '../services/api';
import {
  Clock,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Calendar,
  User,
  Shield,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  FileCheck2,
  HelpCircle,
  X,
  Layers,
} from 'lucide-react';

export default function AttendanceManagement() {
  const { employees, departments, addToast, clearanceLevel } = useZeroGravity();

  // Data states
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);

  // Real-time quick check-in / check-out states
  const [quickEmpId, setQuickEmpId] = useState('');
  const [quickNotes, setQuickNotes] = useState('');

  // Modals & Panels
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showExceptionDrawer, setShowExceptionDrawer] = useState(false);

  // Edit / Manual form state
  const [formState, setFormState] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '',
    check_out: '',
    status: 'Present',
    override_reason: '',
    notes: '',
    resolve_exception: false,
  });

  // Fetch Attendance data
  const fetchAttendanceData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [attRes, statsRes, excRes] = await Promise.all([
        api.getAttendance({
          date: selectedDate || undefined,
          department_id: selectedDept !== 'ALL' ? selectedDept : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          exceptions_only: showExceptionsOnly,
        }),
        api.getAttendanceStats(),
        api.getAttendanceExceptions(),
      ]);

      if (attRes.success) setAttendanceLogs(attRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (excRes.success) setExceptions(excRes.data);
    } catch (err) {
      addToast(`Telemetry attendance error: ${err.message}`, 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [selectedDate, selectedDept, selectedStatus, showExceptionsOnly, addToast]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Quick Check-In
  const handleQuickCheckIn = async () => {
    if (!quickEmpId) {
      addToast('Please select an astronaut for orbital check-in', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.checkInAttendance({
        employee_id: parseInt(quickEmpId, 10),
        notes: quickNotes || 'Direct orbital check-in beacon',
      });
      if (res.success) {
        addToast(res.message, 'success');
        setQuickNotes('');
        await fetchAttendanceData(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Check-Out
  const handleQuickCheckOut = async (empId, attId = null) => {
    const targetEmpId = empId || quickEmpId;
    if (!targetEmpId && !attId) {
      addToast('Please select an astronaut for orbital check-out', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.checkOutAttendance({
        employee_id: targetEmpId ? parseInt(targetEmpId, 10) : undefined,
        attendance_id: attId,
        notes: quickNotes || 'Direct orbital check-out terminal',
      });
      if (res.success) {
        addToast(res.message, 'success');
        setQuickNotes('');
        await fetchAttendanceData(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (log) => {
    setEditingLog(log);
    const formatForInput = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setFormState({
      employee_id: log.employee_id,
      date: log.date ? log.date.split('T')[0] : '',
      check_in: formatForInput(log.check_in),
      check_out: formatForInput(log.check_out),
      status: log.status,
      override_reason: log.override_reason || '',
      notes: log.notes || '',
      resolve_exception: false,
    });
    setIsEditModalOpen(true);
  };

  // Open New Log Modal
  const openNewModal = () => {
    setEditingLog(null);
    setFormState({
      employee_id: employees.length > 0 ? employees[0].id : '',
      date: new Date().toISOString().split('T')[0],
      check_in: '',
      check_out: '',
      status: 'Present',
      override_reason: 'Retroactive attendance recording',
      notes: '',
      resolve_exception: false,
    });
    setIsNewModalOpen(true);
  };

  // Save Edit / Manual Log
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!formState.employee_id) {
      addToast('Employee ID required', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      if (editingLog) {
        // Update existing record
        const payload = {
          check_in: formState.check_in ? new Date(formState.check_in).toISOString() : null,
          check_out: formState.check_out ? new Date(formState.check_out).toISOString() : null,
          status: formState.status,
          override_reason: formState.override_reason || 'Manual telemetry calibration',
          notes: formState.notes,
          resolve_exception: formState.resolve_exception,
        };
        const res = await api.updateAttendance(editingLog.id, payload);
        if (res.success) {
          addToast('Attendance recalibrated with /gravity-exception-detector signature', 'success');
          setIsEditModalOpen(false);
          await fetchAttendanceData(true);
        }
      } else {
        // Create new record
        const payload = {
          employee_id: parseInt(formState.employee_id, 10),
          date: formState.date,
          check_in: formState.check_in ? new Date(formState.check_in).toISOString() : null,
          check_out: formState.check_out ? new Date(formState.check_out).toISOString() : null,
          status: formState.status,
          override_reason: formState.override_reason || 'Manual log insertion',
          notes: formState.notes,
        };
        const res = await api.createAttendance(payload);
        if (res.success) {
          addToast('Manual attendance record logged into orbital core', 'success');
          setIsNewModalOpen(false);
          await fetchAttendanceData(true);
        }
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Attendance Log
  const handleDeleteLog = async (id, empName) => {
    if (!window.confirm(`Disengage attendance record #${id} for ${empName}?`)) return;
    setActionLoading(true);
    try {
      const res = await api.deleteAttendance(id);
      if (res.success) {
        addToast(`Log #${id} removed from orbital telemetry`, 'info');
        await fetchAttendanceData(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick 1-click Resolve Exception
  const handleResolveException = async (log) => {
    setActionLoading(true);
    try {
      await api.updateAttendance(log.id, {
        resolve_exception: true,
        override_reason: `Anomaly validated and resolved under ${clearanceLevel} clearance`,
      });
      addToast(`Exception on Log #${log.id} resolved successfully`, 'success');
      await fetchAttendanceData(true);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered by Search query
  const filteredLogs = attendanceLogs.filter((log) => {
    if (!searchEmployee) return true;
    const term = searchEmployee.toLowerCase();
    return (
      log.full_name?.toLowerCase().includes(term) ||
      log.emp_code?.toLowerCase().includes(term) ||
      log.job_position?.toLowerCase().includes(term) ||
      log.department_name?.toLowerCase().includes(term)
    );
  });

  // Format Helper for timestamps
  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Skills Banner ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-quantum-cyan border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3 h-3 text-quantum-cyan animate-pulse" />
              TURN 2 / ORBITAL ATTENDANCE SUITE
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Station Deck 01–05 • Real-time Sync Active
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-3">
            Orbital Attendance & Time Sync
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            Continuous real-time crew check-in/out engine calibrated with{' '}
            <code className="text-quantum-cyan font-mono">/orbital-attendance-sync</code>,
            automatic worked hours profiling, and autonomous exception detection via{' '}
            <code className="text-amber-400 font-mono">/gravity-exception-detector</code>.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExceptionDrawer(!showExceptionDrawer)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium border flex items-center gap-2 transition-all ${
              exceptions.length > 0
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-cosmic-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Exceptions ({exceptions.length})</span>
          </button>

          <button
            onClick={openNewModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 flex items-center gap-2 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manual Override Log</span>
          </button>
        </div>
      </div>

      {/* ─── Real-Time Quick Check-In / Check-Out Cockpit ─── */}
      <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-cosmic-900/90 via-cosmic-950/90 to-cosmic-900/90 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-quantum-cyan">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>/orbital-attendance-sync Terminal</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instant flight badge check-in / check-out with zero gravitational drift
              </p>
            </div>
          </div>

          {/* Quick Action Input Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <select
              value={quickEmpId}
              onChange={(e) => setQuickEmpId(e.target.value)}
              className="bg-cosmic-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-quantum-cyan"
            >
              <option value="">-- Select Astronaut Crew --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_id} • {emp.full_name} ({emp.job_position})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Beacon note (e.g. Airlock shift)"
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              className="bg-cosmic-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quantum-cyan w-48"
            />

            <button
              onClick={handleQuickCheckIn}
              disabled={actionLoading || !quickEmpId}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
              title="Record instant check-in timestamp"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Check-In</span>
            </button>

            <button
              onClick={() => handleQuickCheckOut(null)}
              disabled={actionLoading || !quickEmpId}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
              title="Record instant check-out & compute worked hours"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check-Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Operational KPI Stat Cards ─── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-slate-800">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Active Crew</div>
            <div className="text-xl font-bold font-mono text-white mt-1">{stats.total_active_crew || 12}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Enrolled astronauts</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-emerald-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Present Today
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{stats.present_today || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Clocked in station</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-cyan-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-quantum-cyan flex items-center gap-1">
              <Clock className="w-3 h-3" /> Open Shifts
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{stats.active_shifts_open || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Currently on rotation</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-amber-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Late Arrivals
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">{stats.late_today || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">&gt;15 min orbit delay</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-purple-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Avg Shift Time
            </div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1">{stats.avg_hours_week || '8.15'} hrs</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Rolling 7-day average</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-red-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Exceptions
            </div>
            <div className="text-xl font-bold font-mono text-red-300 mt-1">{stats.total_unresolved_exceptions || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Requires audit sign-off</div>
          </div>
        </div>
      )}

      {/* ─── Exception Alert Drawer (Collapsible) ─── */}
      {showExceptionDrawer && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                /gravity-exception-detector: Active Orbital Anomalies ({exceptions.length})
              </h4>
            </div>
            <button
              onClick={() => setShowExceptionDrawer(false)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              Close
            </button>
          </div>

          {exceptions.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono">No anomalies detected. All flight trajectories nominal.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exceptions.map((exc) => (
                <div key={exc.id} className="p-3 rounded-xl bg-cosmic-900/90 border border-amber-500/25 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{exc.full_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                      {exc.exception_type || 'ANOMALY'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Date: <span className="text-slate-200">{formatDate(exc.date)}</span> • Shift: {formatTime(exc.check_in)} → {formatTime(exc.check_out)}
                  </div>
                  <p className="text-[11px] text-amber-200/90 italic">
                    {exc.exception_notes || exc.override_reason || 'Anomaly detected during orbital telemetry profiling.'}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => openEditModal(exc)}
                      className="text-quantum-cyan hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Calibrate
                    </button>
                    <button
                      onClick={() => handleResolveException(exc)}
                      className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px]"
                    >
                      Resolve Sign-off
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Search & Quantum Filtering Bar ─── */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search crew or position..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="bg-cosmic-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quantum-cyan w-56 font-mono"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-cosmic-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-quantum-cyan font-mono"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-[10px] text-slate-400 hover:text-white underline font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-quantum-cyan font-mono"
          >
            <option value="ALL">All Orbital Decks</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.name} ({d.orbital_deck?.split('-')[0] || 'Deck'})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-cosmic-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-quantum-cyan font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Overtime">Overtime</option>
            <option value="Absent">Absent</option>
            <option value="On-Leave">On-Leave</option>
          </select>
        </div>

        {/* Right side: Exceptions Only toggle & Refresh */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-mono text-slate-300">
            <input
              type="checkbox"
              checked={showExceptionsOnly}
              onChange={(e) => setShowExceptionsOnly(e.target.checked)}
              className="rounded bg-cosmic-900 border-slate-700 text-quantum-cyan focus:ring-0"
            />
            <span className={showExceptionsOnly ? 'text-amber-400 font-bold' : ''}>
              Exceptions Only
            </span>
          </label>

          <button
            onClick={() => fetchAttendanceData(false)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-cosmic-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Refresh orbital attendance telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-quantum-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Attendance List Matrix ─── */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cosmic-900/90 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Astronaut / Crew</th>
                <th className="py-3 px-4">Flight Date</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Worked Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audit Signature</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-cosmic-950/60">
              {loading && attendanceLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-quantum-cyan" />
                      <span>Scanning orbital check-in frequencies...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-500">
                    No attendance records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isLate = log.status === 'Late';
                  const isOvertime = log.status === 'Overtime';
                  const isOpenShift = log.check_in && !log.check_out;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-cosmic-900/50 transition-colors group ${
                        log.is_exception ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Astronaut */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <img
                            src={log.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${log.emp_code}`}
                            alt={log.full_name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-cosmic-900"
                          />
                          <div>
                            <div className="font-semibold text-white text-xs">{log.full_name}</div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                              <span>{log.emp_code}</span>
                              <span>•</span>
                              <span className="text-quantum-cyan">{log.job_position}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Flight Date */}
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {formatDate(log.date)}
                      </td>

                      {/* Check-In */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono">
                          {formatTime(log.check_in)}
                        </span>
                      </td>

                      {/* Check-Out */}
                      <td className="py-3 px-4">
                        {log.check_out ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-quantum-cyan font-mono">
                            {formatTime(log.check_out)}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleQuickCheckOut(log.employee_id, log.id)}
                            className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors text-[10px] flex items-center gap-1 font-mono"
                            title="Close active shift"
                          >
                            <LogOut className="w-3 h-3" /> Clock Out
                          </button>
                        )}
                      </td>

                      {/* Worked Hours */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {isOpenShift ? (
                          <span className="text-amber-400 animate-pulse text-[11px]">Open Shift</span>
                        ) : (
                          <span>{log.worked_hours} hrs</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                            log.status === 'Present'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                              : log.status === 'Late'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                              : log.status === 'Overtime'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                              : log.status === 'On-Leave'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                              : 'bg-red-950/80 text-red-300 border-red-500/40'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      {/* Audit Signature / Exceptions */}
                      <td className="py-3 px-4 text-[11px]">
                        {log.is_manual_override ? (
                          <div className="flex items-center gap-1 text-purple-300" title={log.override_reason}>
                            <Shield className="w-3.5 h-3.5 text-purple-400" />
                            <span>Manual ({log.override_by?.split(' ')[1] || 'Override'})</span>
                          </div>
                        ) : log.is_exception ? (
                          <div className="flex items-center gap-1 text-amber-300" title={log.exception_notes}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>{log.exception_type || 'Anomaly'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-500 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Nominal</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(log)}
                            className="p-1 rounded-lg bg-cosmic-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Recalibrate / Correct Attendance Log"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-quantum-cyan" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id, log.full_name)}
                            className="p-1 rounded-lg bg-cosmic-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Manual Correction / Recalibration ─── */}
      {(isEditModalOpen || isNewModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel-elevated rounded-2xl border border-cyan-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setIsNewModalOpen(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-cosmic-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-quantum-cyan border border-cyan-500/30">
                {isEditModalOpen ? '/gravity-exception-detector' : '/orbital-attendance-sync'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-sans">
              {isEditModalOpen ? 'Recalibrate Attendance Record' : 'Manual Attendance Insertion'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-5 font-sans">
              Manual entries will be stamped with caller clearance: <span className="text-quantum-cyan font-mono">{clearanceLevel}</span>.
            </p>

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs font-mono">
              {/* Employee selector (if new) */}
              {isNewModalOpen && (
                <div>
                  <label className="block text-slate-400 mb-1">Astronaut</label>
                  <select
                    value={formState.employee_id}
                    onChange={(e) => setFormState({ ...formState, employee_id: e.target.value })}
                    className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_id} • {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-slate-400 mb-1">Flight Date</label>
                <input
                  type="date"
                  value={formState.date}
                  onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                  className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                  required
                />
              </div>

              {/* Check-In and Check-Out Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Check-In Timestamp</label>
                  <input
                    type="datetime-local"
                    value={formState.check_in}
                    onChange={(e) => setFormState({ ...formState, check_in: e.target.value })}
                    className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Check-Out Timestamp</label>
                  <input
                    type="datetime-local"
                    value={formState.check_out}
                    onChange={(e) => setFormState({ ...formState, check_out: e.target.value })}
                    className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-400 mb-1">Calibrated Status</label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                  className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Absent">Absent</option>
                  <option value="Half-Day">Half-Day</option>
                  <option value="On-Leave">On-Leave</option>
                </select>
              </div>

              {/* Override Reason */}
              <div>
                <label className="block text-slate-400 mb-1">
                  Manual Override Audit Reason <span className="text-quantum-cyan">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Airlock terminal sensor maintenance during badge scan"
                  value={formState.override_reason}
                  onChange={(e) => setFormState({ ...formState, override_reason: e.target.value })}
                  className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                  required
                />
              </div>

              {/* Resolve Exception checkbox */}
              {isEditModalOpen && editingLog?.is_exception && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.resolve_exception}
                    onChange={(e) => setFormState({ ...formState, resolve_exception: e.target.checked })}
                    className="rounded text-amber-400 focus:ring-0"
                  />
                  <span className="text-amber-300 font-bold text-xs">
                    Mark Exception as Resolved under Admiral Sign-off
                  </span>
                </label>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsNewModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cosmic-800 text-slate-300 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs font-mono shadow-md hover:brightness-110 flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isEditModalOpen ? 'Commit Correction' : 'Log Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
