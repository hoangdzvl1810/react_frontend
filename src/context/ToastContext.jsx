import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let toastCount = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = ++toastCount;
      const newToast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (msg, duration) => showToast(msg, "success", duration),
    [showToast]
  );
  const error = useCallback(
    (msg, duration) => showToast(msg, "error", duration),
    [showToast]
  );
  const warning = useCallback(
    (msg, duration) => showToast(msg, "warning", duration),
    [showToast]
  );
  const info = useCallback(
    (msg, duration) => showToast(msg, "info", duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, removeToast, toasts }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-portal-container" aria-live="polite">
      {toasts.map((t) => {
        const getIcon = () => {
          switch (t.type) {
            case "success":
              return "fa-solid fa-circle-check";
            case "error":
              return "fa-solid fa-circle-xmark";
            case "warning":
              return "fa-solid fa-triangle-exclamation";
            default:
              return "fa-solid fa-circle-info";
          }
        };

        return (
          <div key={t.id} className={`toast-item toast-${t.type}`} role="alert">
            <div className="toast-icon">
              <i className={getIcon()}></i>
            </div>
            <div className="toast-content">{t.message}</div>
            <button
              type="button"
              className="toast-close"
              onClick={() => onRemove(t.id)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
            {t.duration > 0 && (
              <div
                className="toast-progress-bar"
                style={{ animationDuration: `${t.duration}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
