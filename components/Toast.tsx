
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-400" size={20} />,
    error: <AlertCircle className="text-red-400" size={20} />,
    info: <Info className="text-indigo-400" size={20} />,
    warning: <AlertTriangle className="text-amber-400" size={20} />
  };

  const borders = {
    success: 'border-emerald-500/20 bg-emerald-900/10',
    error: 'border-red-500/20 bg-red-900/10',
    info: 'border-indigo-500/20 bg-indigo-900/10',
    warning: 'border-amber-500/20 bg-amber-900/10'
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-lg animate-slideIn min-w-[300px] max-w-md ${borders[toast.type]}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <p className="text-sm text-white font-medium flex-1">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="text-slate-400 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: CustomEvent<ToastMessage>) => {
      setToasts((prev) => [...prev, e.detail]);
    };

    // Listen to custom event
    document.addEventListener('meti-toast', handleToastEvent as EventListener);

    return () => {
      document.removeEventListener('meti-toast', handleToastEvent as EventListener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
};
