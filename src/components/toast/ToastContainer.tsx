import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import styles from "./toast.module.scss";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Use refs to avoid global mutable state
const toastIdRef = { current: 0 };
const toastFunctionRef = {
  current: null as
    | ((message: string, type?: ToastType, duration?: number) => void)
    | null,
};

interface ToastContainerProps {
  children?: ReactNode;
}

export function ToastContainer({ children }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Track timeouts to clean up on unmount
  const timeoutIdsRef = useRef<number[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      for (const id of timeoutIdsRef.current) {
        clearTimeout(id);
      }
      timeoutIdsRef.current = [];
    };
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 2000) => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;

      // Add new toast
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Auto remove after duration
      const exitTimeoutId = window.setTimeout(() => {
        // Mark as exiting for animation
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
        );

        // Actually remove after exit animation
        const removeTimeoutId = window.setTimeout(() => {
          removeToast(id);
          // Clean up timeout references
          timeoutIdsRef.current = timeoutIdsRef.current.filter(
            (tid) => tid !== exitTimeoutId && tid !== removeTimeoutId,
          );
        }, 300);

        timeoutIdsRef.current.push(removeTimeoutId);
      }, duration);

      timeoutIdsRef.current.push(exitTimeoutId);
    },
    [removeToast],
  );

  // Store toast function for external access
  toastFunctionRef.current = addToast;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ToastContextValue>(
    () => ({ toast: addToast }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className={styles.container}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${t.exiting ? styles.toastExiting : ""}`}
            role="alert"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use toast within components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op function if not within ToastContainer
    return { toast: () => {} };
  }
  return context;
}

/**
 * Show a toast message
 * @param message - The message to display
 * @param type - The type of toast (success, error, warning, info). Default: "info"
 * @param duration - Duration in milliseconds. Default: 2000
 *
 * @example
 * toast("Operation successful!", "success", 2000);
 * toast("Something went wrong", "error");
 * toast("Warning message", "warning");
 * toast("Info message");
 */
export function toast(
  message: string,
  type?: ToastType,
  duration?: number,
): void {
  if (toastFunctionRef.current) {
    toastFunctionRef.current(message, type ?? "info", duration ?? 2000);
  } else {
    console.warn(
      "ToastContainer is not mounted. Please wrap your app with ToastContainer.",
    );
  }
}
