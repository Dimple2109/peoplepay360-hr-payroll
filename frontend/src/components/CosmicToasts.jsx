import React from 'react';
import { useZeroGravity } from '../context/ZeroGravityContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function CosmicToasts() {
  const { toasts, removeToast } = useZeroGravity();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'border-cyan-500/30';
        let bgClass = 'bg-cosmic-900/95';
        let textClass = 'text-cyan-400';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-emerald-500/40';
          textClass = 'text-emerald-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-500/40';
          textClass = 'text-rose-400';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-500/40';
          textClass = 'text-amber-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl glass-panel-elevated border ${borderClass} ${bgClass} shadow-levitate flex items-start gap-3 text-xs animate-slideDown`}
          >
            <Icon className={`w-4 h-4 ${textClass} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 font-mono text-slate-200">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
