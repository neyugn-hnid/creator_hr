import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
    error: <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-top-2 max-w-md ${bgStyles[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium flex-1 leading-snug">{message}</p>
      <button 
        onClick={() => onClose(id)} 
        className="p-1 rounded-lg hover:bg-black/5 text-gray-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
