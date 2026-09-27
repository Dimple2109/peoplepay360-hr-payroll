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
  Cpu,
  FileText,
  Clock,
  CalendarCheck,
  Palmtree,
  AlertTriangle,
} from 'lucide-react';
import { useZeroGravity } from '../context/ZeroGravityContext';

const NAV_ITEMS = [
  { id: 'employees',  label: 'Employee Master',       icon: Users,         countKey: 'total_employees' },
  { id: 'contracts',  label: 'Contract Management',   icon: FileText,      tag: 'Turn 1' },
  { id: 'schedules',  label: 'Working Schedules',     icon: CalendarClock, tag: 'Turn 1' },
  { id: 'attendance', label: 'Orbital Attendance',    icon: Clock,         tag: 'Turn 2', highlight: true },
  { id: 'timeoff',    label: 'Zero-G Time Off',       icon: CalendarCheck, tag: 'Turn 2', highlight: true },
  { id: 'departments',label: 'Orbital Departments',   icon: Layers,        badge: '5 Decks' },
  { id: 'roles',      label: 'Clearance & Roles',     icon: ShieldCheck,   badge: '10 Tiers' },
  { id: 'payroll',    label: 'Zero-G Payroll',        icon: CreditCard,    badge: 'Coming' },
  { id: 'telemetry',  label: 'Propulsion Telemetry',  icon: Activity,      badge: 'LIVE' },
];

export default function Sidebar() {
  const { stats, reseedDatabase, actionLoading, activeNav, setActiveNav } = useZeroGravity();

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
              const isActive = activeNav === item.id;
              const isEnabled = ['employees', 'contracts', 'schedules', 'attendance', 'timeoff'].includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => isEnabled && setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium font-sans transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/10 text-quantum-cyan border border-quantum-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold'
                      : isEnabled
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-cosmic-800/60 border border-transparent cursor-pointer'
                      : 'text-slate-600 border border-transparent cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'text-quantum-cyan' : isEnabled ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cosmic-900 border border-slate-700/60 text-slate-400">
                      {item.badge}
                    </span>
                  )}

                  {item.tag && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      item.tag === 'Turn 1'
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                        : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    }`}>
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
            {[
              { key: 'orbital-attendance-sync',  color: 'cyan',    status: 'Tracking', pulse: true },
              { key: 'zero-g-timeoff-allocator', color: 'emerald', status: 'Allocating', pulse: true },
              { key: 'gravity-exception-detector', color: 'amber', status: 'Alerting', pulse: true },
              { key: 'temporal-contract-sync',   color: 'sky',     status: 'Armed' },
              { key: 'orbital-schedule-engine',  color: 'violet',  status: 'Online' },
              { key: 'quantum-database-pooling', color: 'purple',  status: 'Online' },
              { key: 'levitation-auth-middleware', color: 'teal',  status: 'Armed' },
            ].map(({ key, color, status, pulse }) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-cosmic-900/60 border border-slate-800">
                <span className={`text-slate-400 flex items-center gap-1.5 text-[10px]`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-${color}-400 ${pulse ? 'animate-ping' : ''}`}></span>
                  /{key}
                </span>
                <span className={`text-[10px] text-${color}-400`}>{status}</span>
              </div>
            ))}
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
