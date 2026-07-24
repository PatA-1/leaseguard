import { useState, useCallback } from "react";

// Centralises inline feedback state so pages can call
// showSuccess / showError instead of alert().
export default function useToast() {
  const [toast, setToast] = useState({ message: "", type: "info" });

  const showSuccess = useCallback((message) => setToast({ message, type: "success" }), []);
  const showError = useCallback((message) => setToast({ message, type: "error" }), []);
  const showInfo = useCallback((message) => setToast({ message, type: "info" }), []);
  const clearToast = useCallback(() => setToast({ message: "", type: "info" }), []);

  return { toast, showSuccess, showError, showInfo, clearToast };
}
