// ====================================================================
// PeoplePay360: Orbital Payrun Setup Wizard & Processing Screen
// /orbital-payrun-wizard   — Two-step pay run creation & batching
// /quantum-payslip-engine  — Automated salary computation & contract syncing
// /teleport-pdf-disbursal  — Bulk encrypted PDF payslip transmission
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { api } from '../services/api';
import PayslipDetailModal from './PayslipDetailModal';
import {
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  Printer,
  Eye,
  Trash2,
  RefreshCw,
  PlusCircle,
  Calendar,
  Layers,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Shield,
  FileText,
  DollarSign,
  Clock,
  X,
  UserCheck,
} from 'lucide-react';

export default function PayrunWizard() {
  const { employees, departments, addToast, clearanceLevel } = useZeroGravity();

  // Payruns list & detail states
  const [payruns, setPayruns] = useState([]);
  const [activePayrun, setActivePayrun] = useState(null); // when null, shows list
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Wizard modal state (Step 1 -> Step 2)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    run_name: '',
    start_date: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
    end_date: new Date().toISOString().split('T')[0],
    payment_date: new Date().toISOString().split('T')[0],
    salary_structure: 'Standard Quantum Compensation',
    notes: '',
  });
  const [batchSelectedEmpIds, setBatchSelectedEmpIds] = useState([]);
  const [batchDeptFilter, setBatchDeptFilter] = useState('ALL');
  const [batchSearch, setBatchSearch] = useState('');

  // Selected payslip modal state
  const [viewingPayslip, setViewingPayslip] = useState(null);

  // Fetch payruns
  const fetchPayruns = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await api.getPayruns({
        status: selectedStatusTab !== 'ALL' ? selectedStatusTab : undefined,
      });
      if (res.success) setPayruns(res.data);
    } catch (err) {
      addToast(`Telemetry payrun sync error: ${err.message}`, 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [selectedStatusTab, addToast]);

  useEffect(() => {
    fetchPayruns();
  }, [fetchPayruns]);

  // Open Payrun Detail View
  const handleOpenPayrun = async (payrunId) => {
    setLoading(true);
    try {
      const res = await api.getPayrunById(payrunId);
      if (res.success) {
        setActivePayrun(res.data);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Launch New Wizard
  const handleLaunchWizard = () => {
    const today = new Date();
    const yearMonth = today.toISOString().slice(0, 7);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[today.getMonth()];
    
    setWizardForm({
      run_name: `${currentMonthName} ${today.getFullYear()} Orbital Cycle`,
      start_date: `${yearMonth}-01`,
      end_date: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0],
      payment_date: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0],
      salary_structure: 'Standard Quantum Compensation',
      notes: 'Calibrated via /orbital-payrun-wizard',
    });
    // Default select all active employees
    setBatchSelectedEmpIds(employees.filter(e => e.status !== 'Suspended').map(e => e.id));
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Submit Wizard (Create Payrun)
  const handleCreatePayrunSubmit = async () => {
    if (!wizardForm.run_name || !wizardForm.start_date || !wizardForm.end_date) {
      addToast('Please complete period details in Step 1', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        ...wizardForm,
        employee_ids: batchSelectedEmpIds,
      };
      const res = await api.createPayrun(payload);
      if (res.success) {
        addToast(res.message, 'success');
        setIsWizardOpen(false);
        await fetchPayruns(true);
        if (res.data?.id) {
          await handleOpenPayrun(res.data.id);
        }
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Run /quantum-payslip-engine Compute
  const handleCompute = async () => {
    if (!activePayrun) return;
    setActionLoading(true);
    try {
      const res = await api.computePayrun(activePayrun.id);
      if (res.success) {
        addToast(res.message, 'success');
        await handleOpenPayrun(activePayrun.id);
        await fetchPayruns(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Run Pre-Flight Validation
  const handleValidate = async () => {
    if (!activePayrun) return;
    setActionLoading(true);
    try {
      const res = await api.validatePayrun(activePayrun.id);
      if (res.success) {
        addToast(res.message, 'success');
        await handleOpenPayrun(activePayrun.id);
        await fetchPayruns(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Paid / Disburse Payments
  const handleMarkPaid = async () => {
    if (!activePayrun) return;
    if (!window.confirm(`Disburse total $${activePayrun.total_net} to all ${activePayrun.total_employees} crew members?`)) return;
    setActionLoading(true);
    try {
      const res = await api.markPayrunPaid(activePayrun.id);
      if (res.success) {
        addToast(res.message, 'success');
        await handleOpenPayrun(activePayrun.id);
        await fetchPayruns(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Teleport Emails
  const handleBulkSendEmails = async () => {
    if (!activePayrun) return;
    setActionLoading(true);
    try {
      const res = await api.bulkSendEmails(activePayrun.id);
      if (res.success) {
        addToast(res.message, 'success');
        await handleOpenPayrun(activePayrun.id);
        await fetchPayruns(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Payrun
  const handleDeletePayrun = async (id, name) => {
    if (!window.confirm(`Decommission payrun '${name}'?`)) return;
    setActionLoading(true);
    try {
      const res = await api.deletePayrun(id);
      if (res.success) {
        addToast(res.message, 'info');
        setActivePayrun(null);
        await fetchPayruns(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  // Filtered batch astronauts for Step 2
  const filteredBatchCrew = employees.filter((emp) => {
    const matchesDept = batchDeptFilter === 'ALL' || emp.department_code === batchDeptFilter || emp.department_id?.toString() === batchDeptFilter;
    const matchesSearch = !batchSearch || emp.full_name?.toLowerCase().includes(batchSearch.toLowerCase()) || emp.employee_id?.toLowerCase().includes(batchSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb & Top Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-quantum-cyan border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3 h-3 text-quantum-cyan animate-pulse" />
              /orbital-payrun-wizard & /quantum-payslip-engine
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Station Deck 03 • Quantum Vault & Ledgers
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activePayrun && (
              <button
                onClick={() => setActivePayrun(null)}
                className="p-1 rounded-lg bg-cosmic-800 hover:bg-cosmic-700 text-slate-300 hover:text-white"
                title="Back to all payruns"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              {activePayrun ? activePayrun.run_name : 'Orbital Payruns & Wizard'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            {activePayrun
              ? `Payrun Cycle ${activePayrun.run_code} • Period: ${formatDate(activePayrun.start_date)} to ${formatDate(activePayrun.end_date)}`
              : 'Autonomous two-step pay run generation with explicit crew batching, contract salary sync, and bulk encrypted email delivery.'}
          </p>
        </div>

        {/* Action Header Button */}
        <div className="flex items-center gap-2.5">
          {!activePayrun ? (
            <button
              onClick={handleLaunchWizard}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Launch /orbital-payrun-wizard</span>
            </button>
          ) : (
            <button
              onClick={() => setActivePayrun(null)}
              className="px-3.5 py-1.5 rounded-xl bg-cosmic-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono"
            >
              All Payruns
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VIEW A: PAYRUN DETAIL & PROCESSING VIEW (When payrun is open)
      ───────────────────────────────────────────────────────────── */}
      {activePayrun ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Progress Stepper & State Machine */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono w-full md:w-auto">
              {[
                { step: 'Draft', label: '1. Draft & Batch' },
                { step: 'Computed', label: '2. /quantum-payslip-engine' },
                { step: 'Validated', label: '3. Validated' },
                { step: 'Paid', label: '4. Disbursed & Teleported' },
              ].map(({ step, label }, idx) => {
                const isCurrent = activePayrun.status === step;
                const isPassed =
                  (step === 'Draft' && ['Computed', 'Validated', 'Paid'].includes(activePayrun.status)) ||
                  (step === 'Computed' && ['Validated', 'Paid'].includes(activePayrun.status)) ||
                  (step === 'Validated' && activePayrun.status === 'Paid');

                return (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-quantum-cyan/20 border border-quantum-cyan text-quantum-cyan font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : isPassed
                          ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-medium'
                          : 'bg-cosmic-950 border border-slate-800 text-slate-500'
                      }`}
                    >
                      {isPassed && <CheckCircle2 className="w-3 h-3" />}
                      {label}
                    </span>
                    {idx < 3 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Processing Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {activePayrun.status === 'Draft' && (
                <button
                  onClick={handleCompute}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run /quantum-payslip-engine</span>
                </button>
              )}

              {activePayrun.status === 'Computed' && (
                <>
                  <button
                    onClick={handleCompute}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Compute</span>
                  </button>
                  <button
                    onClick={handleValidate}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Validate Payrun</span>
                  </button>
                </>
              )}

              {activePayrun.status === 'Validated' && (
                <>
                  <button
                    onClick={handleMarkPaid}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Disburse Payments</span>
                  </button>
                  <button
                    onClick={handleBulkSendEmails}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-xs font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Teleport Crew Emails</span>
                  </button>
                </>
              )}

              {activePayrun.status === 'Paid' && (
                <button
                  onClick={handleBulkSendEmails}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 border border-slate-700"
                >
                  <Send className="w-3.5 h-3.5 text-quantum-cyan" />
                  <span>Re-Send Teleport Emails ({activePayrun.emails_sent_count || 0} sent)</span>
                </button>
              )}

              <button
                onClick={() => handleDeletePayrun(activePayrun.id, activePayrun.run_name)}
                disabled={actionLoading}
                className="p-1.5 rounded-lg bg-cosmic-900 border border-slate-800 text-slate-500 hover:text-red-400"
                title="Decommission cycle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation Warnings Box (if any) */}
          {activePayrun.validation_warnings && activePayrun.validation_warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Pre-Flight Validation Advisories ({activePayrun.validation_warnings.length})</span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-300">
                {activePayrun.validation_warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Aggregates Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Total Astronauts</span>
              <div className="text-xl font-bold font-mono text-white mt-1">{activePayrun.total_employees || 0}</div>
              <span className="text-[10px] text-slate-500 font-mono">Batched crew</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Gross Compensation</span>
              <div className="text-xl font-bold font-mono text-slate-200 mt-1">{formatCurrency(activePayrun.total_gross)}</div>
              <span className="text-[10px] text-slate-500 font-mono">Pre-deductions</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-emerald-500/20">
              <span className="text-[10px] font-mono uppercase text-emerald-400">Allowances & Bonuses</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">+{formatCurrency(activePayrun.total_allowances)}</div>
              <span className="text-[10px] text-slate-400 font-mono">Zero-G & propulsion</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-red-500/20">
              <span className="text-[10px] font-mono uppercase text-red-400">Quantum Deductions</span>
              <div className="text-xl font-bold font-mono text-red-300 mt-1">-{formatCurrency(activePayrun.total_deductions)}</div>
              <span className="text-[10px] text-slate-400 font-mono">Tax, Medical, Pension</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cosmic-900/80 border border-cyan-500/40 col-span-2 sm:col-span-1 shadow-lg bg-gradient-to-br from-cosmic-900 to-cyan-950/40">
              <span className="text-[10px] font-mono uppercase text-quantum-cyan font-bold">Total Net Disbursed</span>
              <div className="text-2xl font-black font-mono text-quantum-cyan mt-1">{formatCurrency(activePayrun.total_net)}</div>
              <span className="text-[10px] text-slate-400 font-mono">Final crew payout</span>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-quantum-cyan" />
                Generated Flight Payslips ({activePayrun.payslips?.length || 0})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-cosmic-900/90 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Slip #</th>
                    <th className="py-3 px-4">Astronaut / Crew</th>
                    <th className="py-3 px-4">Contract Ref</th>
                    <th className="py-3 px-4">Duty Hours</th>
                    <th className="py-3 px-4">Gross Pay</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Salary</th>
                    <th className="py-3 px-4">Disbursal Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-cosmic-950/60">
                  {activePayrun.payslips?.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-slate-500">
                        No payslips generated for this cycle yet. Run <code className="text-quantum-cyan">/quantum-payslip-engine</code> above.
                      </td>
                    </tr>
                  ) : (
                    activePayrun.payslips?.map((slip) => (
                      <tr key={slip.id} className="hover:bg-cosmic-900/50 transition-colors">
                        <td className="py-3 px-4 text-quantum-cyan font-bold">{slip.slip_number}</td>

                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={slip.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${slip.emp_code}`}
                              alt={slip.full_name}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-700 bg-cosmic-900"
                            />
                            <div>
                              <div className="font-semibold text-white text-xs">{slip.full_name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{slip.emp_code} • {slip.job_position}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-300">{slip.contract_ref || 'CTR-ACTIVE'}</td>

                        <td className="py-3 px-4 text-slate-400">
                          {slip.worked_days}d ({slip.total_hours}h)
                        </td>

                        <td className="py-3 px-4 text-slate-200 font-bold">{formatCurrency(slip.gross_pay)}</td>

                        <td className="py-3 px-4 text-red-400">-{formatCurrency(slip.total_deductions)}</td>

                        <td className="py-3 px-4 text-quantum-cyan font-bold text-sm">{formatCurrency(slip.net_pay)}</td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              slip.status === 'Paid'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                                : slip.status === 'Sent'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                                : 'bg-purple-950 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {slip.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingPayslip(slip)}
                              className="p-1 rounded-lg bg-cosmic-800 hover:bg-slate-700 text-quantum-cyan"
                              title="View Payslip Breakdown & Trace"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => window.open(`/api/payslips/${slip.id}/pdf`, '_blank')}
                              className="p-1 rounded-lg bg-cosmic-800 hover:bg-slate-700 text-slate-300"
                              title="Print / Save PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            VIEW B: PAYRUNS LIST OVERVIEW (When no payrun is open)
        ───────────────────────────────────────────────────────────── */
        <div className="space-y-4 animate-fadeIn">
          {/* Status Tabs & Search Bar */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
            {/* Status Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-cosmic-950 border border-slate-800 w-full md:w-auto">
              {['ALL', 'Draft', 'Computed', 'Validated', 'Paid'].map((tab) => {
                const count = tab === 'ALL'
                  ? payruns.length
                  : payruns.filter((p) => p.status === tab).length;
                const isActive = selectedStatusTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedStatusTab(tab)}
                    className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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

            {/* Search */}
            <div className="relative w-full md:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search payrun cycle name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-cosmic-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quantum-cyan w-full md:w-64"
              />
            </div>
          </div>

          {/* Payruns Cards / Table */}
          <div className="grid grid-cols-1 gap-3">
            {payruns
              .filter((p) => !searchQuery || p.run_name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((run) => (
                <div
                  key={run.id}
                  className="p-4 rounded-2xl glass-panel border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-quantum-cyan">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-sans text-sm">{run.run_name}</span>
                        <span className="text-xs font-mono text-quantum-cyan">{run.run_code}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            run.status === 'Paid'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                              : run.status === 'Validated'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                              : run.status === 'Computed'
                              ? 'bg-purple-950 text-purple-300 border-purple-500/30'
                              : 'bg-amber-950 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">
                        Period: {formatDate(run.start_date)} → {formatDate(run.end_date)} • Disbursal: {formatDate(run.payment_date)}
                      </div>
                    </div>
                  </div>

                  {/* Financials & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block">Total Net Salary</span>
                      <span className="text-base font-bold text-quantum-cyan">{formatCurrency(run.total_net)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block">Crew Slips</span>
                      <span className="text-white font-bold">{run.actual_payslips_count || run.total_employees} Slips</span>
                    </div>

                    <button
                      onClick={() => handleOpenPayrun(run.id)}
                      className="px-4 py-2 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 text-white font-mono text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Cycle</span>
                      <ChevronRight className="w-3.5 h-3.5 text-quantum-cyan" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TWO-STEP WIZARD MODAL (/orbital-payrun-wizard)
      ───────────────────────────────────────────────────────────── */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl glass-panel-elevated rounded-2xl border border-cyan-500/40 p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-cosmic-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Wizard Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-quantum-cyan border border-cyan-500/30">
                /orbital-payrun-wizard
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-sans">
              Orbital Payrun Setup Wizard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4 font-sans">
              Step {wizardStep} of 2 • {wizardStep === 1 ? 'Scope & Period Selection' : 'Explicit Employee Batch Filtering'}
            </p>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-3 mb-5 text-xs font-mono">
              <div
                className={`flex-1 p-2 rounded-xl text-center border ${
                  wizardStep === 1
                    ? 'bg-quantum-cyan/20 border-quantum-cyan text-quantum-cyan font-bold'
                    : 'bg-cosmic-900 border-slate-800 text-emerald-400'
                }`}
              >
                1. Scope & Dates
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <div
                className={`flex-1 p-2 rounded-xl text-center border ${
                  wizardStep === 2
                    ? 'bg-quantum-cyan/20 border-quantum-cyan text-quantum-cyan font-bold'
                    : 'bg-cosmic-900 border-slate-800 text-slate-500'
                }`}
              >
                2. Crew Batch Selection ({batchSelectedEmpIds.length})
              </div>
            </div>

            {/* Step 1: Scope & Period */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs font-mono overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-slate-400 mb-1">Payrun Cycle Name <span className="text-quantum-cyan">*</span></label>
                  <input
                    type="text"
                    value={wizardForm.run_name}
                    onChange={(e) => setWizardForm({ ...wizardForm, run_name: e.target.value })}
                    placeholder="e.g., October 2026 Flight Rotation"
                    className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Period Start Date <span className="text-quantum-cyan">*</span></label>
                    <input
                      type="date"
                      value={wizardForm.start_date}
                      onChange={(e) => setWizardForm({ ...wizardForm, start_date: e.target.value })}
                      className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Period End Date <span className="text-quantum-cyan">*</span></label>
                    <input
                      type="date"
                      value={wizardForm.end_date}
                      onChange={(e) => setWizardForm({ ...wizardForm, end_date: e.target.value })}
                      className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Disbursal / Payment Date</label>
                    <input
                      type="date"
                      value={wizardForm.payment_date}
                      onChange={(e) => setWizardForm({ ...wizardForm, payment_date: e.target.value })}
                      className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Target Salary Structure</label>
                    <select
                      value={wizardForm.salary_structure}
                      onChange={(e) => setWizardForm({ ...wizardForm, salary_structure: e.target.value })}
                      className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                    >
                      <option value="Standard Quantum Compensation">Standard Quantum Compensation</option>
                      <option value="Executive Propulsion Compensation">Executive Propulsion Compensation</option>
                      <option value="Cadet Trainee Schedule">Cadet Trainee Schedule</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Operational Notes</label>
                  <textarea
                    rows="2"
                    value={wizardForm.notes}
                    onChange={(e) => setWizardForm({ ...wizardForm, notes: e.target.value })}
                    className="w-full bg-cosmic-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-quantum-cyan"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Explicit Employee Batch Filtering */}
            {wizardStep === 2 && (
              <div className="space-y-3 text-xs font-mono overflow-y-auto flex-1 pr-1">
                {/* Batch Filters */}
                <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-cosmic-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <select
                      value={batchDeptFilter}
                      onChange={(e) => setBatchDeptFilter(e.target.value)}
                      className="bg-cosmic-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 text-xs"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>{d.name}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Filter astronaut..."
                      value={batchSearch}
                      onChange={(e) => setBatchSearch(e.target.value)}
                      className="bg-cosmic-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs w-40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBatchSelectedEmpIds(employees.filter(e => e.status !== 'Suspended').map(e => e.id))}
                      className="text-[10px] text-quantum-cyan hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setBatchSelectedEmpIds([])}
                      className="text-[10px] text-slate-400 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Astronauts Selection Matrix */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredBatchCrew.map((emp) => {
                    const isSelected = batchSelectedEmpIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          if (isSelected) {
                            setBatchSelectedEmpIds(prev => prev.filter(id => id !== emp.id));
                          } else {
                            setBatchSelectedEmpIds(prev => [...prev, emp.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/40 shadow-sm'
                            : 'bg-cosmic-900/60 border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="rounded bg-cosmic-950 border-slate-700 text-quantum-cyan focus:ring-0"
                          />
                          <img
                            src={emp.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${emp.employee_id}`}
                            alt={emp.full_name}
                            className="w-7 h-7 rounded-lg object-cover bg-cosmic-950"
                          />
                          <div>
                            <div className="font-bold text-white font-sans text-xs">{emp.full_name}</div>
                            <div className="text-[10px] text-slate-400">{emp.employee_id} • {emp.job_position}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-slate-200 font-bold">{formatCurrency(emp.base_salary / 12)}/mo</div>
                          <div className="text-[10px] text-emerald-400">+{formatCurrency(emp.gravity_allowance / 12)} GA</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="pt-4 border-t border-slate-800 bg-cosmic-900/90 flex items-center justify-between text-xs font-mono">
              {wizardStep === 1 ? (
                <div></div>
              ) : (
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 rounded-xl bg-cosmic-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back: Scope</span>
                </button>
              )}

              {wizardStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2 rounded-xl bg-quantum-cyan text-black font-bold flex items-center gap-1.5 hover:brightness-110"
                >
                  <span>Next: Batch Filtering</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreatePayrunSubmit}
                  disabled={actionLoading || batchSelectedEmpIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-md hover:brightness-110 flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create & Initialize Payrun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PAYSLIP DETAIL & COMPONENT BREAKDOWN MODAL
      ───────────────────────────────────────────────────────────── */}
      {viewingPayslip && (
        <PayslipDetailModal
          payslip={viewingPayslip}
          onClose={() => setViewingPayslip(null)}
          onRefresh={() => handleOpenPayrun(activePayrun.id)}
          addToast={addToast}
        />
      )}
    </div>
  );
}
