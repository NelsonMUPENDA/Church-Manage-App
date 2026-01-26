import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function Toast({ toast, onClose }) {
  const color =
    toast.type === 'success'
      ? 'bg-emerald-600'
      : toast.type === 'error'
        ? 'bg-rose-600'
        : toast.type === 'warning'
          ? 'bg-amber-600'
          : 'bg-indigo-600';

  return (
    <div className={`text-white ${color} shadow-lg rounded-xl px-4 py-3 flex items-start gap-3`}>
      <div className="flex-1">
        <div className="font-semibold text-sm">{toast.title}</div>
        {toast.message ? <div className="text-sm opacity-90 mt-0.5">{toast.message}</div> : null}
      </div>
      <button
        onClick={onClose}
        className="text-white/90 hover:text-white text-sm font-bold px-2"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const toast = {
      id,
      type: t.type || 'info',
      title: t.title || 'Info',
      message: t.message || '',
      ttl: typeof t.ttl === 'number' ? t.ttl : 3500,
    };

    setToasts((prev) => [toast, ...prev]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, toast.ttl);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] w-[340px] max-w-[calc(100vw-2rem)] space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
