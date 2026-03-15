import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none w-[90%] max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start shadow-xl rounded-xl p-4 transition-all duration-300 backdrop-blur-sm ${
              toast.type === 'error'
                ? 'bg-red-50/95 border border-red-200 text-red-700'
                : 'bg-[#e6f7e6]/95 border border-[#4bad40]/30 text-[#4bad40]'
            }`}
            style={{ animation: 'toast-slide-down 0.3s ease-out forwards' }}
          >
            <span className="mr-3 text-xl drop-shadow-sm">
              {toast.type === 'error' ? '⚠️' : '✅'}
            </span>
            <span className="text-sm font-bold flex-1 pt-0.5 leading-snug">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-xl font-medium opacity-50 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <style>
        {`
          @keyframes toast-slide-down {
            0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}
      </style>
    </ToastContext.Provider>
  );
};
