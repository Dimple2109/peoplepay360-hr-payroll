import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useZeroGravity } from '../context/ZeroGravityContext';
import {
  FileText, Plus, CheckCircle2, Clock, Archive, Search,
  AlertTriangle, Edit3, Trash2, Zap, ChevronDown, ChevronUp,
  DollarSign, Calendar, Filter, X, RefreshCw, Sparkles, Shield
} from 'lucide-react';

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_META = {
  active:     { label: 'Active',     color: 'text-emerald-400',  bg: 'bg-emerald-950/60 border-emerald-500/30',  icon: CheckCircle2 },
  draft:      { label: 'Draft',      color: 'text-amber-400',    bg: 'bg-amber-950/60 border-amber-500/30',     icon: Clock },
  historical: { label: 'Historical', color: 'text-slate-400',    bg: 'bg-slate-800/60 border-slate-600/30',     icon: Archive },
};

const SALARY_STRUCTURES = [
  'Standard Quantum Compensation',
  'Senior Orbital Package',
  'Executive Warp-Tier',
  'Contractor Mission-Pay',
  'Zero-G Probationary',
  'Dual-Clearance Senior',
  'Fleet Admiral Compensation',
];

const CONTRACT_TYPES = [
  'Full-Time Quantum Sync',
  'Part-Time Gravitational',
  'Contract-Mission Based',
  'Internship Anti-Gravity',
  'Freelance Orbital',
];

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ─── Contract Status Badge ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${meta.bg} ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

// ─── Contract Form Modal ──────────────────────────────────────────────────────
function ContractFormModal({ isOpen, onClose, editingContract, employees, onSaved }) {
  const { addToast } = useZeroGravity();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    base_salary: 100000,
    gravity_allowance: 12000,
    salary_structure: 'Standard Quantum Compensation',
    currency: 'USD',
    contract_type: 'Full-Time Quantum Sync',
    status: 'draft',
    notes: '',
  });

  useEffect(() => {
    if (editingContract) {
      setForm({
        employee_id: editingContract.employee_id || '',
        start_date: editingContract.start_date?.slice(0, 10) || '',
        end_date: editingContract.end_date?.slice(0, 10) || '',
        base_salary: editingContract.base_salary || 100000,
        gravity_allowance: editingContract.gravity_allowance || 12000,
        salary_structure: editingContract.salary_structure || 'Standard Quantum Compensation',
        currency: editingContract.currency || 'USD',
        contract_type: editingContract.contract_type || 'Full-Time Quantum Sync',
        status: editingContract.status || 'draft',
        notes: editingContract.notes || '',
      });
    } else {
      setForm({
        employee_id: '', start_date: '', end_date: '',
        base_salary: 100000, gravity_allowance: 12000,
        salary_structure: 'Standard Quantum Compensation',
        currency: 'USD', contract_type: 'Full-Time Quantum Sync',
        status: 'draft', notes: '',
      });
    }
  }, [editingContract, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingContract) {
        await api.updateContract(editingContract.id, form);
        addToast('Contract recalibrated successfully', 'success');
      } else {
        await api.createContract(form);
        addToast('New contract drafted into orbital registry', 'success');
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

  const totalComp = parseFloat(form.base_salary || 0) + parseFloat(form.gravity_allowance || 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel-elevated rounded-3xl overflow-hidden shadow-2xl border border-cyan-500/30">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-cosmic-900 to-cosmic-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <FileText className="w-5 h-5 text-quantum-cyan" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                {editingContract ? 'Recalibrate Contract' : 'Draft New Contract'}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">/temporal-contract-sync • /gravitational-wage-tier</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Employee select */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1.5">CREW MEMBER *</label>
              <select
                value={form.employee_id}
                onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                required
                disabled={!!editingContract}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-quantum-cyan transition-colors disabled:opacity-50"
              >
                <option value="">— Select Crew Member —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_id} • {emp.first_name} {emp.last_name} — {emp.job_position}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">MISSION START DATE *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                required
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-quantum-cyan transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">MISSION END DATE <span className="text-slate-500">(blank = open-ended)</span></label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-quantum-cyan transition-colors"
              />
            </div>
          </div>

          {/* Wage Tier */}
          <div className="p-4 rounded-2xl bg-cosmic-900/80 border border-cyan-500/10 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-mono text-quantum-cyan uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" /> /gravitational-wage-tier
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">BASE SALARY (USD) *</label>
                <input
                  type="number"
                  value={form.base_salary}
                  onChange={e => setForm(p => ({ ...p, base_salary: e.target.value }))}
                  min={30000}
                  step={500}
                  required
                  className="w-full bg-cosmic-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-quantum-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">GRAVITY ALLOWANCE (USD)</label>
                <input
                  type="number"
                  value={form.gravity_allowance}
                  onChange={e => setForm(p => ({ ...p, gravity_allowance: e.target.value }))}
                  min={0}
                  step={500}
                  className="w-full bg-cosmic-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-quantum-cyan transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">Total Annual Package:</span>
              <span className="text-sm font-bold font-mono text-quantum-cyan">{formatCurrency(totalComp)}</span>
            </div>
          </div>

          {/* Structure & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">SALARY STRUCTURE *</label>
              <select
                value={form.salary_structure}
                onChange={e => setForm(p => ({ ...p, salary_structure: e.target.value }))}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-quantum-cyan transition-colors"
              >
                {SALARY_STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">CONTRACT TYPE</label>
              <select
                value={form.contract_type}
                onChange={e => setForm(p => ({ ...p, contract_type: e.target.value }))}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-quantum-cyan transition-colors"
              >
                {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Status (only when editing) */}
          {editingContract && (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">CONTRACT STATUS</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                disabled={editingContract.status === 'historical'}
                className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-quantum-cyan transition-colors disabled:opacity-50"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="historical">Historical</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">MISSION NOTES</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Optional contract notes..."
              className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-quantum-cyan transition-colors resize-none placeholder-slate-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-sm font-sans flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60 transition-all shadow-lg shadow-cyan-500/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {editingContract ? 'Recalibrate Contract' : 'Draft Contract'}
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

// ─── Contract Row ─────────────────────────────────────────────────────────────
function ContractRow({ contract, onEdit, onDelete, onActivate }) {
  const { addToast } = useZeroGravity();
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await onActivate(contract.id);
    } finally {
      setActivating(false);
    }
  };

  const rowStyle = contract.status === 'active'
    ? 'border-l-2 border-emerald-400/60 bg-emerald-950/10'
    : contract.status === 'draft'
    ? 'border-l-2 border-amber-400/40 bg-amber-950/5'
    : 'border-l-2 border-slate-600/30 opacity-80';

  return (
    <div className={`p-4 rounded-xl mb-2 border border-slate-800 hover:border-slate-600 transition-all duration-200 ${rowStyle}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={contract.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${contract.emp_code}`}
            alt={contract.full_name}
            className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white font-sans truncate">{contract.full_name}</span>
              <span className="text-[10px] font-mono text-slate-400">{contract.emp_code}</span>
              <StatusBadge status={contract.status} />
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
              {contract.contract_ref || `CTR-${contract.id}`} · {contract.salary_structure}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-mono shrink-0">
          <div className="text-right">
            <div className="text-slate-400 text-[10px]">PERIOD</div>
            <div className="text-slate-200">{formatDate(contract.start_date)} → {formatDate(contract.end_date)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-[10px]">BASE SALARY</div>
            <div className="text-slate-200">{formatCurrency(contract.base_salary)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-[10px]">TOTAL PACKAGE</div>
            <div className="text-quantum-cyan font-bold">{formatCurrency(contract.total_compensation)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {contract.status === 'draft' && (
            <button
              onClick={handleActivate}
              disabled={activating}
              title="Activate Contract"
              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 transition-colors disabled:opacity-50"
            >
              {activating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            </button>
          )}
          {contract.status !== 'historical' && (
            <button onClick={() => onEdit(contract)} title="Edit Contract" className="p-1.5 rounded-lg bg-cosmic-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {contract.status !== 'active' && (
            <button onClick={() => onDelete(contract)} title="Delete Contract" className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/40 border border-red-700/30 text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile compensation row */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono md:hidden">
        <span className="text-slate-400">{formatDate(contract.start_date)} → {formatDate(contract.end_date)}</span>
        <span className="text-slate-200">{formatCurrency(contract.base_salary)}</span>
        <span className="text-quantum-cyan font-bold">{formatCurrency(contract.total_compensation)}</span>
      </div>
    </div>
  );
}

// ─── Main Contract Management View ───────────────────────────────────────────
export default function ContractManagement() {
  const { employees, addToast } = useZeroGravity();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [payrollPeriod, setPayrollPeriod] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (payrollPeriod) params.payroll_period = payrollPeriod;
      const res = await api.getContracts(params);
      if (res.success) setContracts(res.data);
    } catch (err) {
      addToast('Failed to load contracts: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, payrollPeriod, addToast]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleDelete = async (contract) => {
    if (!window.confirm(`Decommission contract ${contract.contract_ref || `#${contract.id}`}?`)) return;
    try {
      await api.deleteContract(contract.id);
      addToast('Contract decommissioned', 'info');
      fetchContracts();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleActivate = async (id) => {
    try {
      const res = await api.activateContract(id);
      if (res.success) {
        addToast(res.message, 'success');
        fetchContracts();
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openCreate = () => { setEditingContract(null); setIsFormOpen(true); };
  const openEdit = (c) => { setEditingContract(c); setIsFormOpen(true); };

  // Filtered by local search
  const filtered = contracts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.emp_code || '').toLowerCase().includes(q) ||
      (c.contract_ref || '').toLowerCase().includes(q) ||
      (c.salary_structure || '').toLowerCase().includes(q)
    );
  });

  // Stats
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const draftCount  = contracts.filter(c => c.status === 'draft').length;
  const histCount   = contracts.filter(c => c.status === 'historical').length;
  const totalActive = contracts.filter(c => c.status === 'active').reduce((s, c) => s + parseFloat(c.total_compensation || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-quantum-cyan border border-cyan-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 animate-spin" />
              /temporal-contract-sync
            </span>
            <span className="text-[11px] font-mono text-slate-400">Contract Registry v1.0</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">
            Contract Management
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans max-w-xl">
            Period-based compensation agreements with anti-concurrent active contract enforcement.
            Payroll engine targets only the contract valid for the billing period.
          </p>
        </div>
        <button
          onClick={openCreate}
          id="btn-new-contract"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-sm font-sans shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Draft Contract
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Contracts', value: activeCount, color: 'text-emerald-400', Icon: CheckCircle2, bg: 'from-emerald-500/10 to-transparent' },
          { label: 'Draft Contracts', value: draftCount, color: 'text-amber-400', Icon: Clock, bg: 'from-amber-500/10 to-transparent' },
          { label: 'Historical', value: histCount, color: 'text-slate-400', Icon: Archive, bg: 'from-slate-500/10 to-transparent' },
          { label: 'Active Payroll Exposure', value: formatCurrency(totalActive), color: 'text-quantum-cyan', Icon: DollarSign, bg: 'from-cyan-500/10 to-transparent' },
        ].map(({ label, value, color, Icon, bg }) => (
          <div key={label} className={`p-4 rounded-2xl bg-gradient-to-br ${bg} border border-slate-800 hover:border-slate-600 transition-colors`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
            </div>
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, reference..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-cosmic-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm font-sans focus:outline-none focus:border-quantum-cyan transition-colors placeholder-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['ALL', 'active', 'draft', 'historical'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                statusFilter === s
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/10 text-quantum-cyan border border-quantum-cyan/30'
                  : 'bg-cosmic-900 border border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Payroll Period Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={payrollPeriod}
            onChange={e => setPayrollPeriod(e.target.value)}
            title="Filter contracts valid on this payroll date"
            className="bg-cosmic-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-quantum-cyan transition-colors"
          />
          {payrollPeriod && (
            <button onClick={() => setPayrollPeriod('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contract List */}
      <div>
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-mono text-sm flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-quantum-cyan" />
            Synchronizing contract registry...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-mono text-sm">No contracts found</p>
            <p className="text-slate-500 text-xs mt-1">Adjust filters or draft a new contract</p>
          </div>
        ) : (
          <div>
            {filtered.map(c => (
              <ContractRow
                key={c.id}
                contract={c}
                onEdit={openEdit}
                onDelete={handleDelete}
                onActivate={handleActivate}
              />
            ))}
          </div>
        )}
      </div>

      <ContractFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingContract={editingContract}
        employees={employees}
        onSaved={fetchContracts}
      />
    </div>
  );
}
