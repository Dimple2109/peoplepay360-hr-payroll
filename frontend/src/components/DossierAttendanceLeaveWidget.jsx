// ====================================================================
// PeoplePay360: Dossier Attendance & Leave Hub Widget
// Embeds live attendance telemetry (/orbital-attendance-sync)
// and leave balances (/zero-g-timeoff-allocator) into Employee Dossier
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  Clock,
  LogIn,
  LogOut,
  CalendarCheck,
  Palmtree,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
  TrendingUp,
} from 'lucide-react';

export default function DossierAttendanceLeaveWidget({ employee, onRefreshEmployee }) {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDossierData = useCallback(async () => {
    if (!employee?.id) return;
    setLoading(true);
    try {
      const [attRes, leaveRes] = await Promise.all([
        api.getAttendance({ employee_id: employee.id, sortBy: 'date', order: 'DESC' }),
        api.getEmployeeTimeOffSummary(employee.id, 2026),
      ]);

      if (attRes.success) setAttendanceLogs(attRes.data);
      if (leaveRes.success) setLeaveSummary(leaveRes.data);
    } catch (e) {
      console.error('Error fetching dossier attendance/leave:', e);
    } finally {
      setLoading(false);
    }
  }, [employee?.id]);

  useEffect(() => {
    fetchDossierData();
  }, [fetchDossierData]);

  // Find today's log
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = attendanceLogs.find((l) => {
    const logDate = l.date ? l.date.split('T')[0] : '';
    return logDate === todayStr;
  });

  const isOpenShift = todayLog && todayLog.check_in && !todayLog.check_out;

  // Quick Check-In from Dossier
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.checkInAttendance({
        employee_id: employee.id,
        notes: 'Check-in recorded via Orbital Dossier Hub',
      });
      await fetchDossierData();
      if (onRefreshEmployee) onRefreshEmployee();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Check-Out from Dossier
  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.checkOutAttendance({
        employee_id: employee.id,
        attendance_id: todayLog?.id,
        notes: 'Check-out recorded via Orbital Dossier Hub',
      });
      await fetchDossierData();
      if (onRefreshEmployee) onRefreshEmployee();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // 7-day total worked hours
  const totalWorkedPastWeek = attendanceLogs
    .slice(0, 7)
    .reduce((acc, curr) => acc + parseFloat(curr.worked_hours || 0), 0)
    .toFixed(1);

  return (
    <div className="space-y-4">
      {/* ─── 1. ORBITAL ATTENDANCE STATUS ─── */}
      <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-quantum-cyan" />
            /orbital-attendance-sync
          </div>
          {todayLog ? (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                todayLog.status === 'Present'
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                  : todayLog.status === 'Late'
                  ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                  : 'bg-purple-950/60 border-purple-500/30 text-purple-300'
              }`}
            >
              {todayLog.status}
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-500">No shift today</span>
          )}
        </div>

        {/* Current status row with 1-click Check-In/Out */}
        <div className="p-2.5 rounded-xl bg-cosmic-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div>
            <div className="text-slate-400 text-[10px]">Today's Shift:</div>
            <div className="text-slate-200 font-bold mt-0.5">
              {todayLog ? (
                <span>
                  {formatTime(todayLog.check_in)} → {formatTime(todayLog.check_out)}{' '}
                  {todayLog.worked_hours > 0 && `(${todayLog.worked_hours}h)`}
                </span>
              ) : (
                <span className="text-slate-500 font-normal">Awaiting terminal check-in</span>
              )}
            </div>
          </div>

          <div>
            {isOpenShift ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] flex items-center gap-1 transition-all"
                title="End current shift"
              >
                <LogOut className="w-3 h-3" />
                <span>Clock Out</span>
              </button>
            ) : !todayLog ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] flex items-center gap-1 transition-all"
                title="Begin shift"
              >
                <LogIn className="w-3 h-3" />
                <span>Clock In</span>
              </button>
            ) : (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Logged
              </span>
            )}
          </div>
        </div>

        {/* Mini stats & exception indicator */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span>7-Day Logged Flight: <strong className="text-white">{totalWorkedPastWeek} hrs</strong></span>
          {todayLog?.is_exception && (
            <span className="text-amber-400 flex items-center gap-1 text-[10px]" title={todayLog.exception_notes}>
              <AlertTriangle className="w-3 h-3" /> {todayLog.exception_type || 'Anomaly'}
            </span>
          )}
        </div>
      </div>

      {/* ─── 2. ZERO-G LEAVE ALLOCATIONS & BALANCES ─── */}
      <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <Palmtree className="w-3.5 h-3.5 text-emerald-400" />
            /zero-g-timeoff-allocator Balances (2026)
          </div>
        </div>

        {leaveSummary?.balances && leaveSummary.balances.length > 0 ? (
          <div className="space-y-2">
            {leaveSummary.balances.map((bal) => {
              const usagePercent = Math.min(100, Math.round((bal.used_days / (bal.total_days || 1)) * 100));
              const color = bal.color_hex || '#10b981';

              return (
                <div key={bal.id} className="p-2 rounded-xl bg-cosmic-950/70 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-medium text-slate-200">{bal.type_name}</span>
                    <span className="font-bold text-white">
                      {parseFloat(bal.remaining_days).toFixed(1)}{' '}
                      <span className="text-slate-500 font-normal">/ {parseFloat(bal.total_days).toFixed(1)}d</span>
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-cosmic-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${usagePercent}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 font-mono italic">
            No leave quotas synchronized yet.
          </div>
        )}

        {/* Recent Leave Requests */}
        {leaveSummary?.recent_requests && leaveSummary.recent_requests.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="text-[10px] uppercase font-mono text-slate-400">Recent Requests</div>
            {leaveSummary.recent_requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-1.5 rounded-lg bg-cosmic-950/50 text-[10px] font-mono">
                <span className="text-slate-300">{r.type_name} ({r.duration_days}d)</span>
                <span
                  className={`px-1.5 py-0.2 rounded border ${
                    r.status === 'Approved'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      : r.status === 'Pending'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                      : 'bg-red-950 text-red-400 border-red-500/30'
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
