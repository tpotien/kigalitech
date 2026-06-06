import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ type = 'info', title, message, duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_STYLES = {
  success: { bar: 'bg-emerald-500', icon: '✓', iconBg: 'bg-emerald-100 text-emerald-600', titleColor: 'text-emerald-800' },
  error:   { bar: 'bg-red-500',     icon: '✕', iconBg: 'bg-red-100 text-red-600',         titleColor: 'text-red-800' },
  info:    { bar: 'bg-sky-500',     icon: 'ℹ', iconBg: 'bg-sky-100 text-sky-600',          titleColor: 'text-sky-800' },
  warning: { bar: 'bg-amber-500',   icon: '!', iconBg: 'bg-amber-100 text-amber-600',       titleColor: 'text-amber-800' },
  cart:    { bar: 'bg-sky-600',     icon: '🛒', iconBg: 'bg-sky-50 text-sky-600',           titleColor: 'text-slate-900' },
  heart:   { bar: 'bg-red-500',     icon: '♥', iconBg: 'bg-red-50 text-red-500',            titleColor: 'text-slate-900' },
};

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-20 xl:bottom-6 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white border border-slate-100 shadow-xl px-4 py-3 min-w-[200px] max-w-[320px] toast-in"
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.iconBg}`}>
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <p className={`text-sm font-semibold leading-tight ${s.titleColor}`}>{t.title}</p>}
              {t.message && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors ml-1"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Progress bar */}
            <div className={`absolute bottom-0 left-0 h-0.5 rounded-b-2xl ${s.bar} toast-bar`} />
          </div>
        );
      })}
    </div>
  );
}
