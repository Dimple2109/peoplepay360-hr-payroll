// ====================================================================
// /propulsion-logging & /quantum-database-pooling: Live Telemetry HUD
// Real-time HUD showing microsecond latency, thrust velocity,
// quantum pool status, and recent execution pulses
// ====================================================================

import React from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { 
  Activity, 
  Database, 
  Zap, 
  ChevronUp, 
  ChevronDown, 
  Radio, 
  Flame, 
  ShieldAlert 
} from 'lucide-react';

export default function TelemetryHUD() {
  const { telemetry, isHudExpanded, setIsHudExpanded } = useZeroGravity();

  if (!telemetry) return null;

  const pool = telemetry.quantumPool || {};
  const pulses = telemetry.recentPulses || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 transition-all duration-300">
      {/* HUD Header Strip */}
      <div 
        onClick={() => setIsHudExpanded(!isHudExpanded)}
        className="glass-panel border-t border-cyan-500/30 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-cosmic-900/90 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-quantum-cyan animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-quantum-cyan uppercase">
              PROPULSION & QUANTUM HUD
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Thrust: <strong className="text-white">{telemetry.systemThrustRating || 99.2}%</strong>
            </span>
            <span>•</span>
            <span>
              Latency: <strong className="text-emerald-400">{telemetry.avgLatencyMs || '1.8'} ms</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Pool: <strong className="text-purple-300">{pool.status || 'SUPERCONDUCTING'}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="hidden md:inline text-[10px] text-slate-400">
            {isHudExpanded ? 'Click to Minimize HUD' : 'Click to Expand Telemetry'}
          </span>
          {isHudExpanded ? (
            <ChevronDown className="w-4 h-4 text-quantum-cyan" />
          ) : (
            <ChevronUp className="w-4 h-4 text-quantum-cyan" />
          )}
        </div>
      </div>

      {/* Expanded HUD Panel */}
      {isHudExpanded && (
        <div className="glass-panel-elevated border-t border-slate-800 p-4 bg-cosmic-950/95 backdrop-blur-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-xs font-mono">
            {/* 1. Propulsion Velocity Specs */}
            <div className="p-3 rounded-xl bg-cosmic-900/90 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Propulsion Flight Metrics
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Total Pulses:</span>
                  <div className="text-white font-bold">{telemetry.totalRequests} calls</div>
                </div>
                <div>
                  <span className="text-slate-400">Avg Latency:</span>
                  <div className="text-emerald-400 font-bold">{telemetry.avgLatencyMs} ms</div>
                </div>
                <div>
                  <span className="text-slate-400">Peak Velocity:</span>
                  <div className="text-amber-400 font-bold">{telemetry.peakLatencyMs} ms</div>
                </div>
                <div>
                  <span className="text-slate-400">Warp Rating:</span>
                  <div className="text-quantum-cyan font-bold">{telemetry.systemThrustRating}%</div>
                </div>
              </div>
            </div>

            {/* 2. Quantum Pool Superconducting Telemetry */}
            <div className="p-3 rounded-xl bg-cosmic-900/90 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-purple-400" /> /quantum-database-pooling
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Pool State:</span>
                  <div className="text-purple-300 font-bold">{pool.status || 'SUPERCONDUCTING'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Active / Idle:</span>
                  <div className="text-white font-bold">{pool.activeConnections ?? 0} / {pool.idleConnections ?? 1}</div>
                </div>
                <div>
                  <span className="text-slate-400">PostgreSQL Port:</span>
                  <div className="text-cyan-400 font-bold">{pool.port || 5433}</div>
                </div>
                <div>
                  <span className="text-slate-400">Lifetime Queries:</span>
                  <div className="text-slate-300 font-bold">{pool.lifetimeQueries ?? 0} executed</div>
                </div>
              </div>
            </div>

            {/* 3. Operational Integrity & RBAC */}
            <div className="p-3 rounded-xl bg-cosmic-900/90 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-quantum-cyan" /> Gravitational Field Status
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mode:</span>
                  <span className="text-emerald-400 font-bold">WARP_READY_NOMINAL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inversion Errors:</span>
                  <span className="text-slate-300">0 critical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telemetry Pulse:</span>
                  <span className="text-quantum-cyan animate-pulse">Synchronized (4s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Pulse Activity Log Ticker */}
          <div className="border-t border-slate-800/80 pt-2.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Live Propulsion Activity Log (Last {pulses.length} Pulses)</span>
              <span className="text-emerald-400 font-normal">Real-Time WebSocket/Polling Channel</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 text-[10px] font-mono">
              {pulses.length === 0 ? (
                <div className="text-slate-400 italic">Awaiting API propulsion pulses...</div>
              ) : (
                pulses.slice(0, 6).map((pulse) => (
                  <div
                    key={pulse.id}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-cosmic-900 border border-slate-800/80 flex items-center gap-2"
                  >
                    <span className={`px-1 rounded text-[9px] font-bold ${
                      pulse.method === 'GET' ? 'bg-cyan-950 text-cyan-400' :
                      pulse.method === 'POST' ? 'bg-emerald-950 text-emerald-400' :
                      pulse.method === 'PATCH' || pulse.method === 'PUT' ? 'bg-purple-950 text-purple-400' :
                      'bg-rose-950 text-rose-400'
                    }`}>
                      {pulse.method}
                    </span>
                    <span className="text-slate-300 truncate max-w-[120px]">{pulse.route}</span>
                    <span className="text-emerald-400 font-bold">{pulse.durationMs}ms</span>
                    <span className="text-slate-400">{pulse.thrustScore}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
