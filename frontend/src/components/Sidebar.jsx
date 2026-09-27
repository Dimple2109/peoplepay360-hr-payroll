import React from 'react';
import { 
  Users, 
  Layers, 
  ShieldCheck, 
  CreditCard, 
  CalendarClock, 
  Activity, 
  Compass, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { useZeroGravity } from '../context/ZeroGravityContext';

const NAV_ITEMS = [
  { id: 'employees', label: 'Employee Master', icon: Users, active: true, countKey: 'total_employees' },
  { id: 'departments', label: 'Orbital Departments', icon: Layers, active: false, badge: '5 Decks' },
  { id: 'roles', label: 'Clearance & Roles', icon: ShieldCheck, active: false, badge: '10 Tiers' },
  { id: 'payroll', label: 'Zero-G Payroll', icon: CreditCard, active: false, tag: 'Turn 2' },
  { id: 'schedules', label: 'Flight Shifts', icon: CalendarClock, active: false, tag: 'Turn 3' },
  { id: 'telemetry', label: 'Propulsion Telemetry', icon: Activity, active: false, badge: 'LIVE' },
];

export default function Sidebar() {
  const { stats, reseedDatabase, actionLoading } = useZeroGravity();

  return (
    <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-cyan-500/15 p-4 min-h-[calc(100vh-65px)] justify-between select-none">
      {/* Top Nav List */}
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono tracking-widest uppercase text-slate-400">
            Navigation Matrix
          </div>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium font-sans transition-all duration-200 group ${
                    item.active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/10 text-quantum-cyan border border-quantum-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-cosmic-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                      item.active ? 'text-quantum-cyan' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cosmic-900 border border-slate-700/60 text-slate-400">
                      {item.badge}
                    </span>
                  )}

                  {item.tag && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                      {item.tag}
                    </span>
                  )}

                  {item.countKey && stats?.totals && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30">
                      {stats.totals.total_employees}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operational Modules Section */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="px-3 mb-2 text-[10px] font-mono tracking-widest uppercase text-slate-400">
            Anti-Gravity Skills Active
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-cosmic-900/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                /zero-gravity-state
              </span>
              <span className="text-[10px] text-cyan-400">Active</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-cosmic-900/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                /quantum-pooling
              </span>
              <span className="text-[10px] text-purple-400">Online</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-cosmic-900/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                /levitation-auth
              </span>
              <span className="text-[10px] text-emerald-400">Armed</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-cosmic-900/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                /propulsion-logging
              </span>
              <span className="text-[10px] text-amber-400">Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Station Status Card */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-cosmic-900/90 border border-cyan-500/20 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-quantum-cyan" /> Orbital Vector
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              0.02 G Zero-G
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-200">Orbital Station Alpha</div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Geo-sync: Deck 01 to 05</p>
        </div>

        {/* Reseed / Reset Data Button for Demo */}
        <button
          onClick={reseedDatabase}
          disabled={actionLoading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cosmic-800 hover:bg-cosmic-700/80 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors disabled:opacity-50"
          title="Reset database to factory demo seed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin text-quantum-cyan' : ''}`} />
          <span>Reseed Demo Registry</span>
        </button>
      </div>
    </aside>
  );
}
