import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(list => [...list, { id, type, message }]);
    setTimeout(() => {
      setToasts(list => list.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const api = useMemo(() => ({
    success: msg => push('success', msg),
    error: msg => push('error', msg),
    info: msg => push('info', msg),
  }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id}
               className={`px-4 py-3 rounded shadow text-white ${
                 t.type==='success' ? 'bg-green-600' :
                 t.type==='error' ? 'bg-red-600' : 'bg-gray-800'
               }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}