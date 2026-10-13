import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

export interface ToastState {
  msg: string;
  type: 'success' | 'error' | 'info' | 'loading';
  id: number;
}

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

const styles = {
  success: 'bg-emerald-600 text-white shadow-emerald-900/30',
  error: 'bg-red-600 text-white shadow-red-900/30',
  info: 'bg-slate-900 text-white shadow-slate-900/30',
  loading: 'bg-blue-700 text-white shadow-blue-900/30',
};

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast || toast.type === 'loading') return;
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icon =
    toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertTriangle : Info;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] w-[92%] max-w-md no-print animate-toast">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border border-white/10 ${
          styles[toast.type]
        }`}
      >
        {toast.type === 'loading' ? (
          <Loader2 size={20} className="animate-spin flex-shrink-0" />
        ) : (
          <Icon size={20} className="flex-shrink-0" />
        )}
        <p className="text-sm font-black leading-relaxed flex-1">{toast.msg}</p>
        {toast.type !== 'loading' && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-all"
            aria-label="إغلاق التنبيه"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
