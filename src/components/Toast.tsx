import React from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
            t.type === 'success'
              ? 'bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-950/30'
              : t.type === 'error'
              ? 'bg-slate-900/95 text-white border-red-500/50 shadow-red-950/30'
              : t.type === 'warning'
              ? 'bg-slate-900/95 text-white border-amber-500/50 shadow-amber-950/30'
              : 'bg-slate-900/95 text-white border-blue-500/50 shadow-blue-950/30'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black tracking-wide text-white">{t.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
