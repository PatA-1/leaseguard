import { useEffect } from "react";

// Lightweight inline feedback banner used in place of alert().
// type: "success" | "error" | "info"
function Toast({ message, type = "info", onClose, autoHideMs = 4000 }) {
  useEffect(() => {
    if (!message) return;
    if (autoHideMs <= 0) return;
    const timer = setTimeout(() => onClose && onClose(), autoHideMs);
    return () => clearTimeout(timer);
  }, [message, autoHideMs, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-message">{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}

export default Toast;
