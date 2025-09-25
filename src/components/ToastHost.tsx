import React, { useEffect } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ToastHostProps {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

export default function ToastHost({ toasts, onRemoveToast }: ToastHostProps) {
  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        onRemoveToast(toast.id);
      }, 3000);

      return () => clearTimeout(timer);
    });
  }, [toasts, onRemoveToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.slice(-3).map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} rounded-lg shadow-lg p-4 min-w-80 animate-slide-in`}
        >
          <div className="flex items-center gap-3">
            <span className="toast-icon">
              {toast.type === 'success' ? <CheckCircle size={16} /> : 
               toast.type === 'warning' ? <AlertTriangle size={16} /> : 
               toast.type === 'error' ? <XCircle size={16} /> : <Info size={16} />}
            </span>
            <span className="flex-1 text-sm toast-text">{toast.text}</span>
            <button
              className="toast-close"
              onClick={() => onRemoveToast(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}