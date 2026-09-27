import React, { useState } from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { 
  Shield, 
  Activity, 
  Database, 
  UserPlus, 
  RotateCw, 
  Zap, 
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

const CLEARANCE_OPTIONS = [
  { level: 'Level-5 Fleet Admiral', color: 'text-quantum-plasma border-quantum-plasma/40 bg-purple-950/30' },
  { level: 'Level-4 Commander', color: 'text-quantum-cyan border-quantum-cyan/40 bg-cyan-950/30' },
  { level: 'Level-3 Officer', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30' },
  { level: 'Level-2 Specialist', color: 'text-amber-400 border-amber-500/40 bg-amber-950/30' },
  { level: 'Level-1 Cadet', color: 'text-slate-400 border-slate-600/40 bg-slate-900/30' },
];

export default function Navbar() {
  const { 
    telemetry, 
    clearanceLevel, 
    setClearanceLevel, 
    openCreateModal, 
    refreshData, 
    loading,
    actionLoading 
  } = useZeroGravity();

  const [clearanceDropdownOpen, setClearanceDropdownOpen] = useState(false);

  const poolStatus = telemetry?.quantumPool?.status || 'SUPERCONDUCTING';
  const thrustScore = telemetry?.systemThrustRating || 99.2;
  const currentOption = CLEARANCE_OPTIONS.find(o => o.level === clearanceLevel) || CLEARANCE_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/20 px-4 lg:px-8 py-3.5 flex items-center justify-between backdrop-blur-2xl">
      {/* Brand & Orbital Status */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 via-purple-600/20 to-blue-900/40 border border-quantum-cyan/40 shadow-quantum-glow group cursor-pointer">
          <div className="absolute inset-0 rounded-xl bg-quantum-cyan/10 animate-ping opacity-25" />
          <Zap className="w-5 h-5 text-quantum-cyan animate-pulse" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-cyan-100 to-quantum-cyan bg-clip-text text-transparent font-sans">
              PeoplePay<span className="text-quantum-cyan font-mono">360</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest bg-cyan-950/80 border border-quantum-cyan/30 text-quantum-cyan shadow-sm">
              ANTI-GRAVITY CORE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-tight flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Orbital HR & Compensation Matrix • v1.0-STABLE
          </p>
        </div>
      </div>

      {/* Center: Live Anti-Gravity Telemetry Bar */}
      <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 rounded-2xl bg-cosmic-900/80 border border-slate-800/80">
        {/* Propulsion Thrust */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-quantum-cyan">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Propulsion Thrust</div>
            <div className="text-xs font-semibold font-mono text-quantum-cyan flex items-center gap-1">
              <span>{thrustScore}%</span>
              <span className="text-[9px] text-emerald-400 font-normal">NOMINAL</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Quantum Database Pooling */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Quantum DB Pool</div>
            <div className="text-xs font-semibold font-mono text-purple-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
              {poolStatus}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Query Propulsion Latency */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Thrust Velocity:</span>
          <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
            {telemetry?.avgLatencyMs || '1.8'} ms
          </span>
        </div>
      </div>

      {/* Right Actions: Levitation RBAC Clearance & New Astronaut */}
      <div className="flex items-center gap-3">
        {/* Levitation RBAC Tier Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setClearanceDropdownOpen(!clearanceDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all ${currentOption.color} hover:brightness-125`}
            title="Switch Simulated Levitation Clearance Tier"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{clearanceLevel}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {clearanceDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-dropdown rounded-xl p-2 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 mb-1">
                /levitation-auth Clearance Tier
              </div>
              {CLEARANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.level}
                  onClick={() => {
                    setClearanceLevel(opt.level);
                    setClearanceDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-mono transition-colors ${
                    clearanceLevel === opt.level ? 'bg-cyan-500/15 text-quantum-cyan' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{opt.level}</span>
                  {clearanceLevel === opt.level && <Sparkles className="w-3 h-3 text-quantum-cyan" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={() => refreshData()}
          disabled={loading || actionLoading}
          className="p-2 rounded-xl bg-cosmic-800 border border-slate-700/60 text-slate-300 hover:text-quantum-cyan hover:border-quantum-cyan/40 transition-colors disabled:opacity-50"
          title="Refresh Orbital Telemetry"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-quantum-cyan' : ''}`} />
        </button>

        {/* Enroll New Astronaut Button */}
        <button
          onClick={openCreateModal}
          className="relative group overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-quantum-cyan via-teal-400 to-cyan-500 text-cosmic-950 font-semibold text-xs tracking-wide shadow-levitate hover:shadow-levitate-hover transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <UserPlus className="w-4 h-4 text-cosmic-950 stroke-[2.5]" />
          <span>Enroll Astronaut</span>
        </button>
      </div>
    </header>
  );
}
