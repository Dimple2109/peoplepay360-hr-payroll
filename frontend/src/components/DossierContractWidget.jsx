import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileText, CalendarClock, DollarSign, Clock, CheckCircle2,
  AlertTriangle, RefreshCw, ChevronRight, Zap
} from 'lucide-react';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Minimal visual day bar for dossier widget
const DAYS_SHORT = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };

function MiniScheduleBar({ schedule }) {
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {DAYS_SHORT.map(day => {
        const hasShift = !!schedule[`${day}_start`];
        const isWeekend = day === 'sat' || day === 'sun';
        return (
          <div key={day} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className={`w-full h-8 rounded text-center flex items-center justify-center text-[8px] font-mono transition-colors ${
                hasShift
                  ? isWeekend
                    ? 'bg-purple-500/30 border border-purple-500/20 text-purple-300'
                    : 'bg-cyan-500/20 border border-cyan-500/15 text-cyan-300'
                  : 'bg-slate-800/60 border border-slate-700/30 text-slate-600'
              }`}
            >
              {hasShift ? (schedule[`${day}_start`]?.slice(0, 5) || '—') : '—'}
            </div>
            <span className={`text-[8px] font-mono ${isWeekend ? 'text-purple-500' : 'text-slate-500'}`}>
              {DAY_LABELS[day]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * DossierContractWidget
 * Embedded into EmployeeDossierDrawer to show active contract & schedule.
 */
export default function DossierContractWidget({ employee }) {
  const [contract, setContract]       = useState(null);
  const [schedule, setSchedule]       = useState(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    if (!employee?.id) return;

    // Load active contract
    setContractLoading(true);
    api.getActiveContract(employee.id)
      .then(res => { if (res.success) setContract(res.data); else setContract(null); })
      .catch(() => setContract(null))
      .finally(() => setContractLoading(false));

    // Load active schedule
    setScheduleLoading(true);
    api.getActiveSchedule(employee.id)
      .then(res => { if (res.success) setSchedule(res.data); else setSchedule(null); })
      .catch(() => setSchedule(null))
      .finally(() => setScheduleLoading(false));
  }, [employee?.id]);

  return (
    <div className="space-y-3">
      {/* Active Contract Widget */}
      <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-quantum-cyan" />
            Active Contract
          </div>
          {contract && (
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
              LIVE
            </span>
          )}
        </div>

        {contractLoading ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
          </div>
        ) : contract ? (
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reference:</span>
              <span className="text-slate-200">{contract.contract_ref || `CTR-${contract.id}`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Period:</span>
              <span className="text-slate-200">
                {formatDate(contract.start_date)} → {contract.end_date ? formatDate(contract.end_date) : 'Open-ended'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Structure:</span>
              <span className="text-slate-200 truncate max-w-[140px] text-right">{contract.salary_structure}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="text-slate-300">{contract.contract_type}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-[9px]">Base</div>
                <div className="text-slate-200">{formatCurrency(contract.base_salary)}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[9px]">Gravity Allowance</div>
                <div className="text-emerald-400">+{formatCurrency(contract.gravity_allowance)}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[9px]">Total</div>
                <div className="text-quantum-cyan font-bold">{formatCurrency(contract.total_compensation)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            No active contract found
          </div>
        )}
      </div>

      {/* Active Working Schedule Widget */}
      <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
            Active Schedule
          </div>
          {schedule && (
            <span className="text-[9px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
              {schedule.computed_weekly_hours || 0}h/wk
            </span>
          )}
        </div>

        {scheduleLoading ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
          </div>
        ) : schedule ? (
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pattern:</span>
              <span className="text-slate-200">{schedule.schedule_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Shift Type:</span>
              <span className="text-purple-300">{schedule.shift_pattern}</span>
            </div>
            <MiniScheduleBar schedule={schedule} />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            No active schedule configured
          </div>
        )}
      </div>
    </div>
  );
}
