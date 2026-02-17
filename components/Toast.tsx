import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export type ToastType = 'loading' | 'success' | 'error';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 2500 }) => {
  useEffect(() => {
    if (type !== 'loading' && onClose && duration > 0) {
      const t = setTimeout(onClose, duration);
      return () => clearTimeout(t);
    }
  }, [type, onClose, duration]);

  const icon =
    type === 'loading' ? (
      <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white flex items-center justify-center animate-spin">
        <span className="sr-only">Завантаження</span>
      </div>
    ) : type === 'success' ? (
      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
        <Check size={22} className="text-white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
        <X size={22} className="text-white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </div>
    );

  const bgColor =
    type === 'loading' ? 'bg-slate-800' : type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl ${bgColor} shadow-xl text-white font-medium text-sm animate-toast-in`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
};
