import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useZeroGravity } from '../context/ZeroGravityContext';
import {
  CalendarClock, Plus, Clock, Edit3, Trash2, RefreshCw,
  Search, Filter, Sparkles, X, Zap, Sun, Moon, AlignLeft,
  CheckCircle2, AlertCircle, Users, BarChart3
} from 'lucide-react';

// ─── Day definitions ──────────────────────────────────────────────────────────
const DAYS = [
  { key: 'mon', label: 'MON', full: 'Monday' },
  { key: 'tue', label: 'TUE', full: 'Tuesday' },
  { key: 'wed', label: 'WED', full: 'Wednesday' },
  { key: 'thu', label: 'THU', full: 'Thursday' },
  { key: 'fri', label: 'FRI', full: 'Friday' },
  { key: 'sat', label: 'SAT', full: 'Saturday' },
  { key: 'sun', label: 'SUN', full: 'Sunday' },
];

// ─── Shift Pattern Templates (/orbital-schedule-engine) ──────────────────────
const SHIFT_TEMPLATES = {
  'Standard-5x8': {
    label: 'Standard 5×8h',
    description: 'Mon-Fri, 9AM-5PM, 1h break',
    data: {
      mon_start: '09:00', mon_end: '17:00', mon_break_mins: 60,
      tue_start: '09:00', tue_end: '17:00', tue_break_mins: 60,
      wed_start: '09:00', wed_end: '17:00', wed_break_mins: 60,
      thu_start: '09:00', thu_end: '17:00', thu_break_mins: 60,
      fri_start: '09:00', fri_end: '17:00', fri_break_mins: 60,
    },
  },
  'Compressed-4x10': {
    label: 'Compressed 4×10h',
    description: 'Mon-Thu, 7AM-5PM, 1h break',
    data: {
      mon_start: '07:00', mon_end: '17:00', mon_break_mins: 60,
      tue_start: '07:00', tue_end: '17:00', tue_break_mins: 60,
      wed_start: '07:00', wed_end: '17:00', wed_break_mins: 60,
      thu_start: '07:00', thu_end: '17:00', thu_break_mins: 60,
    },
  },
  'Night-Shift-5x8': {
    label: 'Night Shift 5×8h',
    description: 'Mon-Fri, 10PM-6AM',
    data: {
      mon_start: '22:00', mon_end: '06:00', mon_break_mins: 30,
      tue_start: '22:00', tue_end: '06:00', tue_break_mins: 30,
      wed_start: '22:00', wed_end: '06:00', wed_break_mins: 30,
      thu_start: '22:00', thu_end: '06:00', thu_break_mins: 30,
      fri_start: '22:00', fri_end: '06:00', fri_break_mins: 30,
    },
  },
  'Weekend-Mission': {
    label: 'Weekend Mission',
    description: 'Sat-Sun, 8AM-8PM, 1h break',
    data: {
      sat_start: '08:00', sat_end: '20:00', sat_break_mins: 60,
      sun_start: '08:00', sun_end: '20:00', sun_break_mins: 60,
    },
  },
  'Full-7x6': {
    label: 'Full Orbital 7×6h',
    description: 'Every day, 8AM-2PM, 30m break',
    data: {
      mon_start: '08:00', mon_end: '14:00', mon_break_mins: 30,
      tue_start: '08:00', tue_end: '14:00', tue_break_mins: 30,
      wed_start: '08:00', wed_end: '14:00', wed_break_mins: 30,
      thu_start: '08:00', thu_end: '14:00', thu_break_mins: 30,
      fri_start: '08:00', fri_end: '14:00', fri_break_mins: 30,
      sat_start: '08:00', sat_end: '14:00', sat_break_mins: 30,
      sun_start: '08:00', sun_end: '14:00', sun_break_mins: 30,
    },
  },
};

// ─── Calculate weekly hours (JS-side mirror of PG trigger) ───────────────────
function calculateWeeklyHours(schedule) {
  let totalMins = 0;
  for (const day of DAYS) {
    const start = schedule[`${day.key}_start`];
    const end   = schedule[`${day.key}_end`];
    const brk   = parseInt(schedule[`${day.key}_break_mins`] || 0, 10);
    if (start && end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diffMins = (eh * 60 + em) - (sh * 60 + sm) - brk;
      totalMins += Math.max(0, diffMins);
    }
  }
  return Math.round((totalMins / 60) * 100) / 100;
}

// ─── Visual day bar (time range strip) ────────────────────────────────────────
function DayTimeBar({ dayKey, start, end, breakMins, isActive }) {
  const START_H = 6;
  const END_H   = 24;
  const SPAN    = END_H - START_H;

  const toPercent = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return ((h + m / 60 - START_H) / SPAN) * 100;
  };

  const startPct = toPercent(start);
  const endPct   = toPercent(end);

  const workHours = useMemo(() => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm) - (parseInt(breakMins, 10) || 0)) / 60);
  }, [start, end, breakMins]);

  return (
    <div className="relative h-7 bg-cosmic-950/60 rounded-md overflow-hidden border border-slate-800/60">
      {/* Hour ticks */}
      {[9, 12, 15, 18, 21].map(h => (
        <div
          key={h}
          className="absolute top-0 bottom-0 w-px bg-slate-700/30"
          style={{ left: `${((h - START_H) / SPAN) * 100}%` }}
        />
      ))}
      {start && end && startPct !== null && endPct !== null && (
        <div
          className={`absolute top-1 bottom-1 rounded ${isActive ? 'bg-gradient-to-r from-cyan-500/70 to-purple-500/50' : 'bg-slate-600/50'} transition-all duration-300`}
          style={{ left: `${Math.max(0, startPct)}%`, width: `${Math.max(0, endPct - startPct)}%` }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/80 whitespace-nowrap overflow-hidden px-1">
            {workHours > 0 && `${workHours.toFixed(1)}h`}
          </span>
        </div>
      )}
      {!start && (
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-slate-600">
          — Rest Day —
        </div>
      )}
    </div>
  );
}

// ─── Visual schedule grid (weekly blocks) ─────────────────────────────────────
function WeeklyScheduleGrid({ schedule, compact = false }) {
  const totalHours = calculateWeeklyHours(schedule);
  const START_H = 6, END_H = 24, SPAN = END_H - START_H;

  return (
    <div className="space-y-1.5">
      {/* Time axis */}
      {!compact && (
        <div className="relative h-4 ml-12">
          {[6, 9, 12, 15, 18, 21, 24].map(h => (
            <div
              key={h}
              className="absolute text-[9px] font-mono text-slate-500 -translate-x-1/2"
              style={{ left: `${((h - START_H) / SPAN) * 100}%` }}
            >
              {h}:00
            </div>
          ))}
        </div>
      )}

      {DAYS.map(day => {
        const start = schedule?.[`${day.key}_start`];
        const end   = schedule?.[`${day.key}_end`];
        const brk   = schedule?.[`${day.key}_break_mins`] || 0;
        const isWeekend = day.key === 'sat' || day.key === 'sun';

        return (
          <div key={day.key} className="flex items-center gap-2">
            <span className={`w-10 text-[10px] font-mono shrink-0 text-right ${isWeekend ? 'text-purple-400' : 'text-slate-400'}`}>
              {day.label}
            </span>
            <div className="flex-1">
              <DayTimeBar
                dayKey={day.key}
                start={start}
                end={end}
                breakMins={brk}
                isActive={!!start}
              />
            </div>
            <span className="w-12 text-[9px] font-mono text-slate-500 text-right shrink-0">
              {start && end ? `${start}–${end}` : '—'}
            </span>
          </div>
        );
      })}

      {/* Total weekly hours */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          /orbital-schedule-engine • Computed Weekly Hours
        </span>
        <span className="text-sm font-bold font-mono text-quantum-cyan">
          {totalHours}h
          <span className="text-slate-500 text-xs ml-1 font-normal">/ week</span>
        </span>
      </div>
    </div>
  );
}

// ─── Empty schedule object ────────────────────────────────────────────────────
const EMPTY_SCHEDULE = {
  employee_id: '',
  schedule_name: 'Standard Earth-Sync',
  effective_date: new Date().toISOString().slice(0, 10),
  shift_pattern: 'Standard-5x8',
  is_active: true,
  notes: '',
  mon_start: '09:00', mon_end: '17:00', mon_break_mins: 60,
  tue_start: '09:00', tue_end: '17:00', tue_break_mins: 60,
  wed_start: '09:00', wed_end: '17:00', wed_break_mins: 60,
  thu_start: '09:00', thu_end: '17:00', thu_break_mins: 60,
  fri_start: '09:00', fri_end: '17:00', fri_break_mins: 60,
  sat_start: '', sat_end: '', sat_break_mins: 0,
  sun_start: '', sun_end: '', sun_break_mins: 0,
};

// ─── Schedule Form Modal ──────────────────────────────────────────────────────
function ScheduleFormModal({ isOpen, onClose, editingSchedule, employees, onSaved }) {
  const { addToast } = useZeroGravity();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_SCHEDULE);

  useEffect(() => {
    if (editingSchedule) {
      const s = editingSchedule;
      setForm({
        employee_id:    s.employee_id || '',
        schedule_name:  s.schedule_name || 'Standard Earth-Sync',
        effective_date: s.effective_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        shift_pattern:  s.shift_pattern || 'Standard-5x8',
        is_active:      s.is_active ?? true,
        notes:          s.notes || '',
        mon_start: s.mon_start?.slice(0, 5) || '', mon_end: s.mon_end?.slice(0, 5) || '', mon_break_mins: s.mon_break_mins ?? 60,
        tue_start: s.tue_start?.slice(0, 5) || '', tue_end: s.tue_end?.slice(0, 5) || '', tue_break_mins: s.tue_break_mins ?? 60,
        wed_start: s.wed_start?.slice(0, 5) || '', wed_end: s.wed_end?.slice(0, 5) || '', wed_break_mins: s.wed_break_mins ?? 60,
        thu_start: s.thu_start?.slice(0, 5) || '', thu_end: s.thu_end?.slice(0, 5) || '', thu_break_mins: s.thu_break_mins ?? 60,
        fri_start: s.fri_start?.slice(0, 5) || '', fri_end: s.fri_end?.slice(0, 5) || '', fri_break_mins: s.fri_break_mins ?? 60,
        sat_start: s.sat_start?.slice(0, 5) || '', sat_end: s.sat_end?.slice(0, 5) || '', sat_break_mins: s.sat_break_mins ?? 0,
        sun_start: s.sun_start?.slice(0, 5) || '', sun_end: s.sun_end?.slice(0, 5) || '', sun_break_mins: s.sun_break_mins ?? 0,
      });
    } else {
      setForm({ ...EMPTY_SCHEDULE });
    }
  }, [editingSchedule, isOpen]);

  const applyTemplate = (patternKey) => {
    const template = SHIFT_TEMPLATES[patternKey];
    if (!template) return;
    const cleared = {
      mon_start: '', mon_end: '', mon_break_mins: 0,
      tue_start: '', tue_end: '', tue_break_mins: 0,
      wed_start: '', wed_end: '', wed_break_mins: 0,
      thu_start: '', thu_end: '', thu_break_mins: 0,
      fri_start: '', fri_end: '', fri_break_mins: 0,
      sat_start: '', sat_end: '', sat_break_mins: 0,
      sun_start: '', sun_end: '', sun_break_mins: 0,
    };
    setForm(prev => ({
      ...prev,
      ...cleared,
      ...template.data,
      shift_pattern: patternKey,
      schedule_name: template.label,
    }));
  };

  const weeklyHours = calculateWeeklyHours(form);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, form);
        addToast(`Schedule recalibrated. Weekly orbit: ${weeklyHours}h`, 'success');
      } else {
        await api.createSchedule(form);
        addToast(`Schedule activated. Weekly orbit: ${weeklyHours}h`, 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl glass-panel-elevated rounded-3xl overflow-hidden shadow-2xl border border-purple-500/30">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-cosmic-900 to-cosmic-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <CalendarClock className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                {editingSchedule ? 'Recalibrate Schedule' : 'Initialize Working Schedule'}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">/orbital-schedule-engine • Auto weekly hours: <span className="text-quantum-cyan">{weeklyHours}h</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Employee + meta */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 md:col-span-1">
              <label className="block text-xs font-mono text-slate-400 mb-1.5">CREW MEMBER *</label>
              <select
                value={form.employee_id}
                onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                required
                disabled={!!editingSchedule}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-50"
              >
                <option value="">— Select —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.employee_id} · {emp.first_name} {emp.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">SCHEDULE NAME</label>
              <input
                type="text"
                value={form.schedule_name}
                onChange={e => setForm(p => ({ ...p, schedule_name: e.target.value }))}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">EFFECTIVE DATE</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>

          {/* Shift Pattern Templates */}
          <div>
            <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> SHIFT PATTERN TEMPLATES (/orbital-schedule-engine)
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SHIFT_TEMPLATES).map(([key, tmpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    form.shift_pattern === key
                      ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                      : 'bg-cosmic-900 border-slate-700 text-slate-400 hover:border-purple-500/30 hover:text-slate-200'
                  }`}
                >
                  {tmpl.label}
                  <span className="ml-1.5 text-[9px] text-slate-500">{tmpl.description.split(',')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-4 rounded-2xl bg-cosmic-900/80 border border-purple-500/10">
            <div className="text-[10px] font-mono text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Live Weekly Schedule Preview
            </div>
            <WeeklyScheduleGrid schedule={form} />
          </div>

          {/* Day-by-day editor */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Day-by-Day Configuration</div>
            {DAYS.map(day => {
              const isWeekend = day.key === 'sat' || day.key === 'sun';
              const startVal = form[`${day.key}_start`];
              const endVal   = form[`${day.key}_end`];
              const brkVal   = form[`${day.key}_break_mins`];

              return (
                <div key={day.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${startVal ? 'border-slate-700 bg-cosmic-900/60' : 'border-slate-800/60 bg-cosmic-950/40 opacity-70'}`}>
                  <span className={`w-8 text-[10px] font-mono font-bold ${isWeekend ? 'text-purple-400' : 'text-slate-300'}`}>
                    {day.label}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!startVal}
                      onChange={e => {
                        const checked = e.target.checked;
                        if (!checked) {
                          setForm(p => ({ ...p, [`${day.key}_start`]: '', [`${day.key}_end`]: '' }));
                        } else {
                          setForm(p => ({
                            ...p,
                            [`${day.key}_start`]: isWeekend ? '08:00' : '09:00',
                            [`${day.key}_end`]:   isWeekend ? '16:00' : '17:00',
                          }));
                        }
                      }}
                      className="w-3.5 h-3.5 accent-purple-500"
                    />
                    <span className="text-[10px] font-mono text-slate-500">work</span>
                  </label>
                  <input
                    type="time"
                    value={form[`${day.key}_start`]}
                    onChange={e => setForm(p => ({ ...p, [`${day.key}_start`]: e.target.value }))}
                    disabled={!startVal && !endVal}
                    className="bg-cosmic-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-40 w-24"
                  />
                  <span className="text-slate-500 text-xs">→</span>
                  <input
                    type="time"
                    value={form[`${day.key}_end`]}
                    onChange={e => setForm(p => ({ ...p, [`${day.key}_end`]: e.target.value }))}
                    disabled={!startVal && !endVal}
                    className="bg-cosmic-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-40 w-24"
                  />
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[10px] font-mono text-slate-500">break</span>
                    <input
                      type="number"
                      value={brkVal || 0}
                      onChange={e => setForm(p => ({ ...p, [`${day.key}_break_mins`]: parseInt(e.target.value, 10) || 0 }))}
                      min={0}
                      max={240}
                      step={15}
                      disabled={!startVal}
                      className="bg-cosmic-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-40 w-16 text-center"
                    />
                    <span className="text-[10px] font-mono text-slate-500">min</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active toggle + notes */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 accent-purple-500"
              />
              <span className="text-xs font-mono text-slate-300">Set as active schedule</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">NOTES</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Optional shift notes..."
              className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-purple-400 transition-colors resize-none placeholder-slate-600"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm font-sans flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60 transition-all shadow-lg shadow-purple-500/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
              {editingSchedule ? 'Recalibrate Schedule' : 'Launch Schedule'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-cosmic-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-sans transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Schedule Card ────────────────────────────────────────────────────────────
function ScheduleCard({ schedule, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const totalHours = schedule.computed_weekly_hours || calculateWeeklyHours(schedule);

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      schedule.is_active
        ? 'border-purple-500/30 bg-purple-950/10'
        : 'border-slate-800 bg-cosmic-900/40 opacity-75'
    }`}>
      {/* Card Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={schedule.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${schedule.emp_code}`}
            alt=""
            className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white font-sans truncate">{schedule.full_name}</span>
              <span className="text-[10px] font-mono text-slate-400">{schedule.emp_code}</span>
              {schedule.is_active && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono border bg-purple-950/60 border-purple-500/30 text-purple-300">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Active
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {schedule.schedule_name} · {schedule.shift_pattern} · eff. {schedule.effective_date?.slice(0, 10)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden md:block">
            <div className="text-[10px] font-mono text-slate-400">WEEKLY ORBIT</div>
            <div className="text-lg font-bold font-mono text-quantum-cyan">{totalHours}h</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onEdit(schedule); }} className="p-1.5 rounded-lg bg-cosmic-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {!schedule.is_active && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(schedule); }} className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/40 border border-red-700/30 text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }}
              className="p-1.5 rounded-lg bg-cosmic-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              {expanded ? <X className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Visual Grid */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-slate-800/60">
          <WeeklyScheduleGrid schedule={schedule} />
        </div>
      )}
    </div>
  );
}

// ─── Main Working Schedule Setup View ────────────────────────────────────────
export default function WorkingScheduleSetup() {
  const { employees, addToast } = useZeroGravity();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter !== 'ALL') params.is_active = activeFilter === 'active';
      const res = await api.getSchedules(params);
      if (res.success) setSchedules(res.data);
    } catch (err) {
      addToast('Failed to load schedules: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, addToast]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleDelete = async (schedule) => {
    if (!window.confirm(`Remove schedule "${schedule.schedule_name}" for ${schedule.full_name}?`)) return;
    try {
      await api.deleteSchedule(schedule.id);
      addToast('Schedule removed from orbital planner', 'info');
      fetchSchedules();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openCreate = () => { setEditingSchedule(null); setIsFormOpen(true); };
  const openEdit = (s) => { setEditingSchedule(s); setIsFormOpen(true); };

  const filtered = schedules.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.emp_code || '').toLowerCase().includes(q) ||
      (s.schedule_name || '').toLowerCase().includes(q) ||
      (s.shift_pattern || '').toLowerCase().includes(q)
    );
  });

  const activeCount   = schedules.filter(s => s.is_active).length;
  const inactiveCount = schedules.filter(s => !s.is_active).length;
  const avgHours = schedules.filter(s => s.is_active && parseFloat(s.computed_weekly_hours) > 0).reduce((sum, s, _, arr) => {
    return sum + parseFloat(s.computed_weekly_hours) / arr.length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 animate-spin text-purple-300" />
              /orbital-schedule-engine
            </span>
            <span className="text-[11px] font-mono text-slate-400">Shift Planner v1.0</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">
            Working Schedule Setup
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans max-w-xl">
            Visual weekly time-block configuration with automated hours calculation.
            Shift pattern templates power the orbital schedule engine.
          </p>
        </div>
        <button
          onClick={openCreate}
          id="btn-new-schedule"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm font-sans shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Active Schedules', value: activeCount, color: 'text-purple-300', bg: 'from-purple-500/10' },
          { label: 'Inactive Schedules', value: inactiveCount, color: 'text-slate-400', bg: 'from-slate-500/10' },
          { label: 'Avg Weekly Hours', value: `${avgHours.toFixed(1)}h`, color: 'text-quantum-cyan', bg: 'from-cyan-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`p-4 rounded-2xl bg-gradient-to-br ${bg} to-transparent border border-slate-800 hover:border-slate-600 transition-colors`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">{label}</div>
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, pattern..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm font-sans focus:outline-none focus:border-purple-400 transition-colors placeholder-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'active', 'inactive'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                activeFilter === f
                  ? 'bg-gradient-to-r from-purple-500/20 to-indigo-600/10 text-purple-300 border border-purple-500/30'
                  : 'bg-cosmic-900 border border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
          <span className="text-slate-400 font-mono text-sm">Calibrating orbital planner...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarClock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">No schedules found</p>
          <p className="text-slate-500 text-xs mt-1">Create a new schedule to begin orbit tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ScheduleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingSchedule={editingSchedule}
        employees={employees}
        onSaved={fetchSchedules}
      />
    </div>
  );
}
