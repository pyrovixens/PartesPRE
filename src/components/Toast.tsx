import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Smooth entry fader
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(enterTimer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 350);
  };

  const getBorderAndBg = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/60 bg-slate-900/95 text-emerald-400 shadow-emerald-950/40';
      case 'error':
        return 'border-red-500/60 bg-slate-900/95 text-red-400 shadow-red-950/40';
      case 'warning':
        return 'border-amber-500/60 bg-slate-900/95 text-amber-400 shadow-amber-950/40';
      case 'info':
      default:
        return 'border-blue-500/60 bg-slate-900/95 text-blue-400 shadow-blue-950/40';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-350 ease-out transform ${getBorderAndBg()} ${
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-90'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
        {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400 animate-in zoom-in" />}
        {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 animate-in zoom-in" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 animate-in zoom-in" />}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-black tracking-wide text-white">{toast.title}</h4>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed font-medium">{toast.message}</p>
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        title="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 sm:top-auto sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-50 flex flex-col space-y-2.5 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
