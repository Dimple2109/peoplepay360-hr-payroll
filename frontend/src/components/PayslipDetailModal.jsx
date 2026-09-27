// ====================================================================
// PeoplePay360: Payslip Detail & Holographic Preview Modal
// /quantum-payslip-engine — Detailed component breakdown & audit trace
// /teleport-pdf-disbursal — Printable PDF & individual email transmission
// ====================================================================

import React, { useState } from 'react';
import { api } from '../services/api';
import {
  FileText,
  Printer,
  Send,
  X,
  Shield,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  DollarSign,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default function PayslipDetailModal({ payslip, onClose, onRefresh, addToast }) {
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'trace'
  const [sending, setSending] = useState(false);

  if (!payslip) return null;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  // Handle Send Email
  const handleSendEmail = async () => {
    setSending(true);
    try {
      const res = await api.sendSinglePayslipEmail(payslip.id);
      if (res.success) {
        addToast(res.message, 'success');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  // Open Printable PDF
  const handlePrintPdf = () => {
    window.open(`/api/payslips/${payslip.id}/pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl glass-panel-elevated rounded-2xl border border-cyan-500/40 shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-cosmic-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-quantum-cyan">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-quantum-cyan">{payslip.slip_number}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    payslip.status === 'Paid'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      : payslip.status === 'Sent'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                      : 'bg-purple-950 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {payslip.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight font-sans">
                {payslip.full_name} • Quantum Flight Payslip
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="px-3 py-1.5 rounded-xl bg-cosmic-800 hover:bg-cosmic-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Open Printable PDF"
            >
              <Printer className="w-3.5 h-3.5 text-quantum-cyan" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Teleport encrypted payslip to astronaut comm beacon"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Teleporting...' : 'Send Beacon'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-cosmic-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-800/80 bg-cosmic-950/60 flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'breakdown'
                ? 'border-quantum-cyan text-quantum-cyan font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Salary Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('trace')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'trace'
                ? 'border-purple-400 text-purple-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>/quantum-payslip-engine Trace</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono flex-1">
          {activeTab === 'breakdown' ? (
            <>
              {/* Astronaut Bio Grid */}
              <div className="p-3.5 rounded-xl bg-cosmic-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Astronaut</span>
                  <span className="text-white font-semibold">{payslip.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Employee Code</span>
                  <span className="text-quantum-cyan font-bold">{payslip.emp_code}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Role / Deck</span>
                  <span className="text-slate-200">{payslip.job_position}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Clearance</span>
                  <span className="text-purple-300 font-bold">{payslip.clearance_tier || 'Level-2 Specialist'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Payrun Period</span>
                  <span className="text-slate-200">{formatDate(payslip.start_date)} → {formatDate(payslip.end_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Disbursal Date</span>
                  <span className="text-slate-200">{formatDate(payslip.payment_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Worked Duty</span>
                  <span className="text-emerald-400 font-bold">{payslip.worked_days} Days ({payslip.total_hours}h)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Contract Ref</span>
                  <span className="text-slate-300">{payslip.contract_ref || 'CTR-DEFAULT'}</span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="p-4 rounded-xl bg-cosmic-900/80 border border-emerald-500/20 space-y-2">
                  <div className="text-[11px] uppercase font-bold text-emerald-400 flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Earnings</span>
                    <span>Amount</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Base Salary</span>
                      <span className="text-white font-bold">{formatCurrency(payslip.base_salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Zero-G Flight Allowance</span>
                      <span className="text-emerald-300">+{formatCurrency(payslip.gravity_allowance)}</span>
                    </div>
                    {parseFloat(payslip.propulsion_bonus) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Propulsion Overtime Bonus</span>
                        <span className="text-cyan-300">+{formatCurrency(payslip.propulsion_bonus)}</span>
                      </div>
                    )}
                    {parseFloat(payslip.hazard_allowance) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cosmic Hazard Pay</span>
                        <span className="text-amber-300">+{formatCurrency(payslip.hazard_allowance)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-emerald-400">
                    <span>Gross Compensation</span>
                    <span>{formatCurrency(payslip.gross_pay)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-4 rounded-xl bg-cosmic-900/80 border border-red-500/20 space-y-2">
                  <div className="text-[11px] uppercase font-bold text-red-400 flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> Deductions</span>
                    <span>Amount</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantum Tax (15% Base)</span>
                      <span className="text-red-300">-{formatCurrency(payslip.quantum_tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Atmospheric Decompression Fund</span>
                      <span className="text-red-300">-{formatCurrency(payslip.medical_decompression_fund)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deep-Space Pension Fund</span>
                      <span className="text-red-300">-{formatCurrency(payslip.planetary_pension)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-red-400">
                    <span>Total Deductions</span>
                    <span>-{formatCurrency(payslip.total_deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Disbursed Highlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-purple-950/60 to-cosmic-900/90 border border-quantum-cyan/40 flex items-center justify-between shadow-xl">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-quantum-cyan animate-pulse" />
                    Total Net Disbursed Compensation
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Beacon Transmission: {payslip.email || 'Registered Comms Channel'}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-quantum-cyan tracking-tight font-mono">
                  {formatCurrency(payslip.net_pay)}
                </div>
              </div>
            </>
          ) : (
            /* Computation Trace Tab */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-purple-300 uppercase">
                    /quantum-payslip-engine Computation Trace
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Cryptographic execution path derived from active contract #{payslip.contract_id || 'DEFAULT'} and attendance hours correlation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cosmic-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Applied Formula</span>
                  <div className="p-2 rounded bg-cosmic-900 border border-slate-800 text-quantum-cyan mt-1">
                    {payslip.computation_trace?.formula || 'Net = Gross - (Tax[15%] + MedicalAtmosphere[2.5%] + PlanetaryPension[5%])'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded bg-cosmic-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Tax Bracket</span>
                    <div className="text-white font-bold mt-0.5">
                      {payslip.computation_trace?.tax_bracket || 'Orbital Tier-A (15%)'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-cosmic-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Quantum Engine Status</span>
                    <div className="text-emerald-400 font-bold mt-0.5">
                      {payslip.computation_trace?.status || 'NOMINAL_CALIBRATED'}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase text-[10px] block mb-1">Raw Trace Metadata</span>
                  <pre className="p-3 rounded-xl bg-cosmic-900 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(payslip.computation_trace, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-cosmic-900/90 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-500 text-[10px]">
            SLIP-ID: {payslip.slip_number} • /teleport-pdf-disbursal
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cosmic-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
