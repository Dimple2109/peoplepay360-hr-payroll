// ====================================================================
// PeoplePay360: Stellar Payroll Dashboard Cockpit
// /stellar-payroll-dashboard — Real-time KPI aggregation, monthly net trends,
// department cost distribution, and attendance health alerts
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { api } from '../services/api';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Shield,
  Zap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  Users,
  Clock,
  ArrowRight,
  RefreshCw,
  Cpu,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

export default function PayrollDashboard() {
  const { setActiveNav, addToast } = useZeroGravity();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await api.getPayrollDashboardMetrics();
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      addToast(`Dashboard metrics sync error: ${err.message}`, 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ─── Header & Skills Banner ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-quantum-cyan border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-quantum-cyan animate-spin" />
              /stellar-payroll-dashboard
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Anti-Gravity Multi-Planetary Compensation Hub
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-3">
            Zero-G Payroll Cockpit
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl font-sans">
            Real-time compensation analytics aggregated across active orbital contracts, attendance shift logs,
            and quantum ledger disbursements.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveNav('payruns')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 flex items-center gap-2 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Launch /orbital-payrun-wizard</span>
          </button>

          <button
            onClick={() => fetchMetrics(false)}
            disabled={loading}
            className="p-2 rounded-xl bg-cosmic-900 border border-slate-700 text-slate-400 hover:text-white"
            title="Refresh metrics telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-quantum-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Stellar KPI Cards Row ─── */}
      {metrics?.kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-cyan-500/30 col-span-2 sm:col-span-1 shadow-lg bg-gradient-to-br from-cosmic-900 to-cyan-950/40">
            <span className="text-[10px] font-mono uppercase text-quantum-cyan font-bold block">Monthly Net Payout</span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {formatCurrency(metrics.kpis.total_net)}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +2.4% vs last cycle
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cosmic-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Gross Payroll</span>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">
              {formatCurrency(metrics.kpis.total_gross)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Pre-deductions</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cosmic-900/80 border border-emerald-500/20">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block">Zero-G & Propulsion</span>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
              +{formatCurrency(metrics.kpis.total_allowances)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Flight bonuses</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cosmic-900/80 border border-purple-500/20">
            <span className="text-[10px] font-mono uppercase text-purple-400 block">Average Net Salary</span>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1">
              {formatCurrency(metrics.kpis.average_net_salary)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Per astronaut/mo</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cosmic-900/80 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Crew on Payroll</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {metrics.kpis.crew_on_payroll}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{metrics.kpis.active_payruns} cycle active</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cosmic-900/80 border border-teal-500/20">
            <span className="text-[10px] font-mono uppercase text-teal-400 block flex items-center gap-1">
              <Send className="w-3 h-3" /> Teleport Rate
            </span>
            <div className="text-xl font-bold font-mono text-teal-300 mt-1">
              {metrics.kpis.teleport_success_rate}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Disbursal nominal</span>
          </div>
        </div>
      )}

      {/* ─── Middle Section: Monthly Trend Chart & Department Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 6-Month Net vs Gross Salary Trend */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-quantum-cyan" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                6-Month Net vs Gross Compensation Curve (USD)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> Gross
              </span>
              <span className="flex items-center gap-1 text-quantum-cyan">
                <span className="w-2.5 h-2.5 rounded-sm bg-quantum-cyan"></span> Net Disbursed
              </span>
            </div>
          </div>

          {/* CSS SVG Bar/Area Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800/80">
            {metrics?.trend_data?.map((item) => {
              const maxVal = 170000;
              const grossH = Math.round((item.gross / maxVal) * 100);
              const netH = Math.round((item.net / maxVal) * 100);

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Gross Bar */}
                    <div
                      className="w-1/3 rounded-t-md bg-purple-600/40 border border-purple-500/50 hover:brightness-125 transition-all relative"
                      style={{ height: `${grossH}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-cosmic-950 px-2 py-0.5 rounded text-[9px] font-mono text-purple-300 border border-purple-500/30 pointer-events-none whitespace-nowrap z-10">
                        {formatCurrency(item.gross)}
                      </div>
                    </div>
                    {/* Net Bar */}
                    <div
                      className="w-1/3 rounded-t-md bg-cyan-400/80 border border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)] hover:brightness-125 transition-all relative"
                      style={{ height: `${netH}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-cosmic-950 px-2 py-0.5 rounded text-[9px] font-mono text-quantum-cyan border border-cyan-500/30 pointer-events-none whitespace-nowrap z-10">
                        {formatCurrency(item.net)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{item.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Cycle Baseline: <strong className="text-white">Earth-Sync & Lunar High-G</strong></span>
            <span>Tax Withholding: <strong className="text-emerald-400">15% Standard Quantum Rate</strong></span>
          </div>
        </div>

        {/* Right 1 Col: Department Cost Distribution */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Deck Budget Burn
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">5 Orbital Decks</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
            {metrics?.department_costs?.map((dept) => (
              <div key={dept.id} className="p-2.5 rounded-xl bg-cosmic-900/60 border border-slate-800 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[160px]">{dept.name}</span>
                  <span className="text-quantum-cyan font-bold">{formatCurrency(dept.monthly_cost)}/mo</span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-cosmic-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                    style={{ width: `${Math.min(100, dept.budget_utilization_pct || 25)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{dept.crew_count} Astronauts</span>
                  <span>{dept.budget_utilization_pct}% annual budget</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Attendance Correlation Alerts & Recent Payruns ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Attendance Health Correlation Alerts */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Operational Anomaly Alerts
            </h3>
          </div>

          <div className="space-y-2.5">
            {metrics?.health_alerts?.map((alert, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{alert.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/30 text-amber-400">
                    {alert.module}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/90">{alert.detail}</p>
              </div>
            ))}

            {(!metrics?.health_alerts || metrics.health_alerts.length === 0) && (
              <div className="p-4 rounded-xl bg-cosmic-900/60 border border-slate-800 text-center text-slate-400 text-xs font-mono">
                No active payroll anomalies. All propulsion shifts correlated.
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Recent Payruns & Direct Actions */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-quantum-cyan" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Recent Payrun Cycles
              </h3>
            </div>
            <button
              onClick={() => setActiveNav('payruns')}
              className="text-xs font-mono text-quantum-cyan hover:underline flex items-center gap-1"
            >
              <span>View All Payruns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {metrics?.recent_payruns?.map((run) => (
              <div
                key={run.id}
                className="p-3 rounded-xl bg-cosmic-900/70 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      run.status === 'Paid'
                        ? 'bg-emerald-400'
                        : run.status === 'Validated'
                        ? 'bg-cyan-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-white font-sans text-xs">{run.run_name}</div>
                    <div className="text-[10px] text-slate-400">{run.run_code} • Disbursed: {formatDate(run.payment_date)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-white font-bold">{formatCurrency(run.total_net)}</span>
                    <span className="text-[10px] text-slate-500 block">{run.total_employees} Crew</span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      run.status === 'Paid'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                        : run.status === 'Validated'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                        : 'bg-amber-950 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {run.status}
                  </span>

                  <button
                    onClick={() => setActiveNav('payruns')}
                    className="p-1 rounded-lg bg-cosmic-800 hover:bg-slate-700 text-quantum-cyan"
                    title="Open in /orbital-payrun-wizard"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
