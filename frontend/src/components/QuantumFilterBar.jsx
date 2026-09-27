import React from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { 
  Search, 
  LayoutList, 
  Kanban, 
  Filter, 
  X, 
  SlidersHorizontal,
  Building2,
  Sparkles
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Astronauts' },
  { id: 'Active', label: 'Active (Sync)' },
  { id: 'Onboarding', label: 'Onboarding' },
  { id: 'On-Leave', label: 'On-Leave' },
  { id: 'Suspended', label: 'Suspended' },
];

export default function QuantumFilterBar() {
  const { 
    viewMode, 
    setViewMode, 
    searchQuery, 
    setSearchQuery, 
    selectedDept, 
    setSelectedDept, 
    selectedStatus, 
    setSelectedStatus, 
    departments,
    employees
  } = useZeroGravity();

  return (
    <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/20 mb-6 space-y-3.5">
      {/* Top Row: Search, Department, and View Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-quantum-cyan/70" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by astronaut name, callsign ID, position, or frequency..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-cosmic-900/90 border border-slate-700/80 text-xs font-sans text-slate-100 placeholder-slate-400 focus:outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan/50 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Department Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[210px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-cosmic-900/90 border border-slate-700/80 text-xs font-sans text-slate-200 focus:outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan/50 appearance-none cursor-pointer"
            >
              <option value="ALL">All Orbital Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.code}>
                  {dept.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* View Mode Toggle: List vs Zero-G Kanban */}
          <div className="flex items-center p-1 rounded-xl bg-cosmic-900 border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 text-quantum-cyan border border-quantum-cyan/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Matrix List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-cyan-500/25 to-purple-600/25 text-quantum-cyan border border-quantum-cyan/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zero-Gravity Kanban Pipeline"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">Zero-G Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Status Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-cosmic-800/50 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter matches badge */}
        <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <span>Telemetry Stream:</span>
          <span className="text-quantum-cyan font-bold">{employees.length}</span>
          <span>astronauts synchronized</span>
        </div>
      </div>
    </div>
  );
}
