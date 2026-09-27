import React from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { Users, DollarSign, Activity, Database, TrendingUp, Sparkles } from 'lucide-react';

export default function StatCards() {
  const { stats, telemetry, employees } = useZeroGravity();

  const totalEmployees = stats?.totals?.total_employees || employees.length || 0;
  const totalPayroll = parseFloat(stats?.totals?.total_base_payroll || 0);
  const totalGravityAllowances = parseFloat(stats?.totals?.total_gravity_allowances || 0);
  const combinedCompensation = totalPayroll + totalGravityAllowances;

  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onboardingCount = employees.filter(e => e.status === 'Onboarding').length;
  const onLeaveCount = employees.filter(e => e.status === 'On-Leave').length;

  const thrustScore = telemetry?.systemThrustRating || 99.2;
  const avgLatency = telemetry?.avgLatencyMs || 2.1;
  const poolActive = telemetry?.quantumPool?.activeConnections ?? 1;
  const poolTotal = telemetry?.quantumPool?.totalConnections ?? 4;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Astronauts */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 zero-g-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Astronaut Roster</span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-quantum-cyan">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalEmployees}</span>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +100% Orbit Sync
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="text-emerald-400">{activeCount} Active</span>
          <span>•</span>
          <span className="text-amber-400">{onboardingCount} Onboarding</span>
          <span>•</span>
          <span className="text-purple-400">{onLeaveCount} Leave</span>
        </div>
      </div>

      {/* 2. Total Quantum Payroll & Gravity Allowances */}
      <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 zero-g-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Quantum Payroll & Allowances</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {formatCurrency(combinedCompensation)}
          </span>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
            / ANNUM
          </span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <span>Base: {formatCurrency(totalPayroll)}</span>
          <span className="text-quantum-cyan flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Allowances: {formatCurrency(totalGravityAllowances)}
          </span>
        </div>
      </div>

      {/* 3. Propulsion Velocity Tracking */}
      <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 zero-g-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Propulsion Velocity</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">{thrustScore}%</span>
          <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            MAX THRUST
          </span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <span>Query Latency: <span className="text-emerald-400 font-semibold">{avgLatency} ms</span></span>
          <span className="text-slate-400 font-mono">0 Inversion Faults</span>
        </div>
      </div>

      {/* 4. Quantum Database Pool Health */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 zero-g-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Quantum Connection Pool</span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-quantum-cyan">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold font-mono text-quantum-cyan tracking-tight">SUPERCONDUCTING</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <span>Port 5433 (PostgreSQL 18)</span>
          <span className="text-purple-300 font-mono">Max: 20 Sockets</span>
        </div>
      </div>
    </div>
  );
}
