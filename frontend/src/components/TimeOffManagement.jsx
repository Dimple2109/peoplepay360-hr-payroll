// ====================================================================
// PeoplePay360: Time Off Management Cockpit
// /zero-g-timeoff-allocator — Automated leave approvals, balance deductions,
// and validity period tracking
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { api } from '../services/api';
import {
  CalendarCheck,
  Palmtree,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Layers,
  Sparkles,
  Zap,
  TrendingDown,
  UserCheck,
  FileText,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function TimeOffManagement() {
  const { employees, departments, addToast, clearanceLevel } = useZeroGravity();

  // Data states
  const [types, setTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // 'ALL' | 'Pending' | 'Approved' | 'Refused'
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [refusalModal, setRefusalModal] = useState({ isOpen: false, requestId: null, requestRef: '', reason: '' });

  // Request form state
  const [requestForm, setRequestForm] = useState({
    employee_id: '',
    time_off_type_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    duration_days: 3,
    reason: '',
  });

  // Balance lookup for the currently selected employee & type in modal
  const [selectedBalance, setSelectedBalance] = useState(null);

  // Fetch all time-off data
  const fetchTimeOffData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [typesRes, allocRes, reqRes, statsRes] = await Promise.all([
        api.getTimeOffTypes(),
        api.getTimeOffAllocations({
          employee_id: filterEmployeeId || undefined,
          year: 2026,
        }),
        api.getTimeOffRequests({
          status: selectedStatusTab !== 'ALL' ? selectedStatusTab : undefined,
          employee_id: filterEmployeeId || undefined,
          department_id: filterDepartment !== 'ALL' ? filterDepartment : undefined,
        }),
        api.getTimeOffStats(),
      ]);

      if (typesRes.success) setTypes(typesRes.data);
      if (allocRes.success) setAllocations(allocRes.data);
      if (reqRes.success) setRequests(reqRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      addToast(`Time-off orbital sync error: ${err.message}`, 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [selectedStatusTab, filterEmployeeId, filterDepartment, addToast]);

  useEffect(() => {
    fetchTimeOffData();
  }, [fetchTimeOffData]);

  // Recalculate duration when dates change in request modal
  useEffect(() => {
    if (requestForm.start_date && requestForm.end_date) {
      const s = new Date(requestForm.start_date);
      const e = new Date(requestForm.end_date);
      if (e >= s) {
        const days = Math.round((e - s) / (1000 * 3600 * 24)) + 1;
        setRequestForm((prev) => ({ ...prev, duration_days: days }));
      }
    }
  }, [requestForm.start_date, requestForm.end_date]);

  // Update selected balance preview when employee or type changes in form
  useEffect(() => {
    if (requestForm.employee_id && requestForm.time_off_type_id) {
      const match = allocations.find(
        (a) =>
          a.employee_id === parseInt(requestForm.employee_id, 10) &&
          a.time_off_type_id === parseInt(requestForm.time_off_type_id, 10)
      );
      setSelectedBalance(match || null);
    } else {
      setSelectedBalance(null);
    }
  }, [requestForm.employee_id, requestForm.time_off_type_id, allocations]);

  // Open Create Request Modal
  const openCreateRequestModal = () => {
    const defaultEmp = filterEmployeeId || (employees.length > 0 ? employees[0].id : '');
    const defaultType = types.length > 0 ? types[0].id : '';
    setRequestForm({
      employee_id: defaultEmp,
      time_off_type_id: defaultType,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      duration_days: 3,
      reason: '',
    });
    setIsRequestModalOpen(true);
  };

  // Submit Leave Request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.employee_id || !requestForm.time_off_type_id) {
      addToast('Please select astronaut and leave policy', 'warning');
      return;
    }

    if (selectedBalance && parseFloat(selectedBalance.remaining_days) < requestForm.duration_days) {
      addToast(
        `/zero-g-timeoff-allocator: Cannot submit request. Remaining balance (${selectedBalance.remaining_days} days) is less than requested ${requestForm.duration_days} days.`,
        'error'
      );
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.createTimeOffRequest(requestForm);
      if (res.success) {
        addToast(res.message, 'success');
        setIsRequestModalOpen(false);
        await fetchTimeOffData(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Approve Leave Request
  const handleApproveRequest = async (reqId, ref) => {
    setActionLoading(true);
    try {
      const res = await api.approveTimeOffRequest(reqId);
      if (res.success) {
        addToast(
          `Request ${ref || `#${reqId}`} Approved! /zero-g-timeoff-allocator deducted leave days atomically.`,
          'success'
        );
        await fetchTimeOffData(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Refusal Modal
  const openRefusalModal = (req) => {
    setRefusalModal({
      isOpen: true,
      requestId: req.id,
      requestRef: req.request_ref || `#${req.id}`,
      reason: '',
    });
  };

  // Confirm Refusal
  const handleConfirmRefusal = async () => {
    if (!refusalModal.requestId) return;
    setActionLoading(true);
    try {
      const res = await api.refuseTimeOffRequest(refusalModal.requestId, refusalModal.reason);
      if (res.success) {
        addToast(`Request ${refusalModal.requestRef} marked Refused`, 'info');
        setRefusalModal({ isOpen: false, requestId: null, requestRef: '', reason: '' });
        await fetchTimeOffData(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel / Delete Request
  const handleDeleteRequest = async (reqId, ref) => {
    if (!window.confirm(`Disengage leave request ${ref || `#${reqId}`}?`)) return;
    setActionLoading(true);
    try {
      const res = await api.deleteTimeOffRequest(reqId);
      if (res.success) {
        addToast(res.message, 'info');
        await fetchTimeOffData(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests by search
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(term) ||
      r.request_ref?.toLowerCase().includes(term) ||
      r.type_name?.toLowerCase().includes(term) ||
      r.reason?.toLowerCase().includes(term) ||
      r.department_name?.toLowerCase().includes(term)
    );
  });

  // Calculate grouped balance preview for top cards
  const displayAllocations = filterEmployeeId
    ? allocations.filter((a) => a.employee_id === parseInt(filterEmployeeId, 10))
    : types.map((t) => {
        const typeAllocs = allocations.filter((a) => a.time_off_type_id === t.id);
        const total = typeAllocs.reduce((acc, curr) => acc + parseFloat(curr.total_days || 0), 0);
        const used = typeAllocs.reduce((acc, curr) => acc + parseFloat(curr.used_days || 0), 0);
        const rem = Math.max(0, total - used);
        return {
          id: t.id,
          type_code: t.code,
          type_name: t.name,
          color_hex: t.color_hex,
          is_paid: t.is_paid,
          total_days: total,
          used_days: used,
          remaining_days: rem,
          usage_percentage: total > 0 ? ((used / total) * 100).toFixed(1) : 0,
          valid_from: '2026-01-01',
          valid_to: '2026-12-31',
        };
      });

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
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
              TURN 2 / ZERO-G TIME OFF MATRIX
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Validity Year 2026 • Atomic Balance Deductions
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-3">
            Zero-G Time Off & Leave Allocator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            Interplanetary leave policy tracking powered by{' '}
            <code className="text-emerald-400 font-mono">/zero-g-timeoff-allocator</code>.
            Automatic quota validation, atomic balance reductions upon approval, and validity period controls.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateRequestModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Request Time Off</span>
          </button>
        </div>
      </div>

      {/* ─── Operational KPI Stat Cards ─── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-amber-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending Approvals
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">{stats.pending_requests_count || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Awaiting Admiral review</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-emerald-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Approved This Month
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{stats.approved_this_month || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Quota deducted</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-cyan-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-quantum-cyan flex items-center gap-1">
              <Palmtree className="w-3 h-3" /> On-Leave Today
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{stats.crew_on_leave_today || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Rotated off station</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-purple-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400">Total Days Granted</div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1">{stats.total_days_allocated || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">2026 fleet quota</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-slate-800">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Days Consumed</div>
            <div className="text-xl font-bold font-mono text-white mt-1">{stats.total_days_used || 0}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Deducted via sync</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-teal-500/20">
            <div className="text-[10px] font-mono uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Days Remaining
            </div>
            <div className="text-xl font-bold font-mono text-teal-300 mt-1">{stats.total_days_remaining || 0}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Available for booking</div>
          </div>
        </div>
      )}

      {/* ─── Live Allocation Balance Cards (/zero-g-timeoff-allocator) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Live Allocation Balance Cards ({filterEmployeeId ? 'Selected Astronaut' : 'Fleet Wide Aggregate'})
            </h3>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span>Validity Period:</span>
            <span className="text-emerald-400">2026-01-01 → 2026-12-31</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayAllocations.map((alloc) => {
            const usagePercent = Math.min(100, Math.round((alloc.used_days / (alloc.total_days || 1)) * 100));
            const color = alloc.color_hex || '#00f0ff';

            return (
              <div
                key={alloc.id || alloc.type_code}
                className="p-4 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: color }}
                />

                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                    style={{
                      color: color,
                      borderColor: `${color}40`,
                      backgroundColor: `${color}15`,
                    }}
                  >
                    {alloc.type_code}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {alloc.is_paid ? 'Paid Orbital' : 'Unpaid'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white font-sans">{alloc.type_name}</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-white">
                      {parseFloat(alloc.remaining_days).toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      / {parseFloat(alloc.total_days).toFixed(1)} days left
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Used: {parseFloat(alloc.used_days).toFixed(1)}d</span>
                    <span>{usagePercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-cosmic-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${usagePercent}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span>Valid: {formatDate(alloc.valid_from)}</span>
                  <span>Until: {formatDate(alloc.valid_to)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Requests Management Dashboard ─── */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
        {/* Top Controls: Status Tabs & Filters */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-cosmic-950 border border-slate-800 text-xs font-mono w-full lg:w-auto">
            {['ALL', 'Pending', 'Approved', 'Refused'].map((tab) => {
              const isActive = selectedStatusTab === tab;
              const count = tab === 'ALL'
                ? requests.length
                : requests.filter((r) => r.status === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setSelectedStatusTab(tab)}
                  className={`flex-1 lg:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-cosmic-800 text-quantum-cyan border border-quantum-cyan/30 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cosmic-900 border border-slate-700 text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end text-xs font-mono">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search request ref or crew..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-cosmic-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-52"
              />
            </div>

            {/* Astronaut Selector */}
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="bg-cosmic-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Astronauts</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employee_id} • {e.full_name}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="bg-cosmic-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Decks</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={() => fetchTimeOffData(false)}
              disabled={loading}
              className="p-1.5 rounded-lg bg-cosmic-950 border border-slate-700 text-slate-400 hover:text-white"
              title="Refresh time-off requests"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {loading && requests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="font-mono text-xs">Synchronizing with /zero-g-timeoff-allocator ledger...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No time-off requests found matching current filter parameters.
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isPending = req.status === 'Pending';
              const isApproved = req.status === 'Approved';
              const isRefused = req.status === 'Refused';
              const typeColor = req.color_hex || '#00f0ff';

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl glass-panel border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                    isPending
                      ? 'border-amber-500/30 bg-amber-950/10'
                      : isApproved
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-slate-800 bg-cosmic-950/40'
                  }`}
                >
                  {/* Left: Astronaut info & Type badge */}
                  <div className="flex items-center gap-3.5">
                    <img
                      src={req.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${req.emp_code}`}
                      alt={req.full_name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-cosmic-900 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-sans text-sm">{req.full_name}</span>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded border"
                          style={{
                            color: typeColor,
                            borderColor: `${typeColor}40`,
                            backgroundColor: `${typeColor}15`,
                          }}
                        >
                          {req.type_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{req.request_ref}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{req.emp_code}</span>
                        <span>•</span>
                        <span>{req.job_position}</span>
                        <span>•</span>
                        <span className="text-slate-300">{req.department_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Date span, Duration, Reason */}
                  <div className="flex-1 lg:px-6 space-y-1 text-xs font-mono">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold">{formatDate(req.start_date)}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                      <span className="font-bold">{formatDate(req.end_date)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-cosmic-900 border border-slate-700 text-quantum-cyan text-[11px] font-bold">
                        {req.duration_days} {req.duration_days === 1 ? 'day' : 'days'}
                      </span>
                      {req.current_balance_remaining !== undefined && (
                        <span className="text-[10px] text-slate-400">
                          (Bal: {req.current_balance_remaining}d left)
                        </span>
                      )}
                    </div>
                    {req.reason && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-1">
                        "{req.reason}"
                      </p>
                    )}
                    {isRefused && req.rejection_reason && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Refusal Reason: {req.rejection_reason}
                      </p>
                    )}
                    {isApproved && req.approved_by && (
                      <p className="text-[10px] text-emerald-400/80 flex items-center gap-1 font-mono">
                        <UserCheck className="w-3 h-3" /> Approved by {req.approved_by} on {formatDate(req.approved_at)}
                      </p>
                    )}
                  </div>

                  {/* Right: Status badge & Action buttons */}
                  <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    {/* Status Badge */}
                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : isApproved
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-950/80 text-red-400 border-red-500/40'
                      }`}
                    >
                      {isPending && <Clock className="w-3 h-3 animate-spin" />}
                      {isApproved && <CheckCircle2 className="w-3 h-3" />}
                      {isRefused && <XCircle className="w-3 h-3" />}
                      <span>{req.status}</span>
                    </span>

                    {/* Simple 1-Click Approve / Refuse Workflow */}
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveRequest(req.id, req.request_ref)}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40 shadow-sm"
                          title="Approve leave request & deduct allocation balance"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => openRefusalModal(req)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-xs flex items-center gap-1 transition-all disabled:opacity-40"
                          title="Refuse leave request"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Refuse</span>
                        </button>
                      </div>
                    )}

                    {/* Delete / Cancel button */}
                    <button
                      onClick={() => handleDeleteRequest(req.id, req.request_ref)}
                      className="p-1.5 rounded-lg bg-cosmic-900 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                      title="Disengage request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Modal: Request Time Off ─── */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel-elevated rounded-2xl border border-emerald-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-cosmic-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                /zero-g-timeoff-allocator
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-sans">
              Request Orbital Time Off
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-5 font-sans">
              Leave balance is automatically validated against remaining 2026 fleet quotas before submission.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-mono">
              {/* Astronaut Selector */}
              <div>
                <label className="block text-slate-400 mb-1">Astronaut</label>
                <select
                  value={requestForm.employee_id}
                  onChange={(e) => setRequestForm({ ...requestForm, employee_id: e.target.value })}
                  className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_id} • {emp.full_name} ({emp.job_position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Policy Type */}
              <div>
                <label className="block text-slate-400 mb-1">Leave Policy Type</label>
                <select
                  value={requestForm.time_off_type_id}
                  onChange={(e) => setRequestForm({ ...requestForm, time_off_type_id: e.target.value })}
                  className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.default_days_per_year}d/year)
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Remaining Balance Card */}
              {selectedBalance && (
                <div className="p-3 rounded-xl bg-cosmic-950/80 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Available Balance in Policy</div>
                      <div className="text-sm font-bold text-white font-mono">
                        {parseFloat(selectedBalance.remaining_days).toFixed(1)} days remaining
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Requested: </span>
                    <span
                      className={`text-xs font-bold ${
                        requestForm.duration_days > parseFloat(selectedBalance.remaining_days)
                          ? 'text-red-400 font-bold'
                          : 'text-emerald-400'
                      }`}
                    >
                      {requestForm.duration_days} days
                    </span>
                  </div>
                </div>
              )}

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={requestForm.start_date}
                    onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
                    className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={requestForm.end_date}
                    onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
                    className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-400 mb-1">Reason / Flight Mission Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Decompression acclimation at Earth Biosphere station"
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-cosmic-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading ||
                    (selectedBalance && parseFloat(selectedBalance.remaining_days) < requestForm.duration_days)
                  }
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold font-mono shadow-md hover:brightness-110 flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Refusal Reason Prompt ─── */}
      {refusalModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md glass-panel-elevated rounded-2xl border border-red-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setRefusalModal({ isOpen: false, requestId: null, requestRef: '', reason: '' })}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-cosmic-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white tracking-tight font-sans flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Refuse Time Off Request {refusalModal.requestRef}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 font-sans">
              Please document the operational flight mission constraint or schedule conflict reason.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Refusal Justification</label>
                <textarea
                  rows="3"
                  placeholder="e.g., Mandatory station review and thruster array inspection scheduled during requested period"
                  value={refusalModal.reason}
                  onChange={(e) => setRefusalModal({ ...refusalModal, reason: e.target.value })}
                  className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefusalModal({ isOpen: false, requestId: null, requestRef: '', reason: '' })}
                  className="px-4 py-2 rounded-xl bg-cosmic-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefusal}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono shadow-md flex items-center gap-1.5"
                >
                  <span>Confirm Refusal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
