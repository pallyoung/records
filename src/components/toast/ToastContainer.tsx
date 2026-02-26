import {
  createContext,
  useContext,
  useState,
  useCallback,
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

let toastId = 0;
let toastFunction:
  | ((message: string, type?: ToastType, duration?: number) => void)
  | null = null;

interface ToastContainerProps {
  children?: ReactNode;
}

export function ToastContainer({ children }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 2000) => {
      const id = ++toastId;

      // Add new toast
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Auto remove after duration
      setTimeout(() => {
        // Mark as exiting for animation
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
        );

        // Actually remove after exit animation
        setTimeout(() => {
          removeToast(id);
        }, 300);
      }, duration);
    },
    [removeToast],
  );

  // Store toast function for external access
  toastFunction = addToast;

  // Context value with toast function
  const contextValue: ToastContextValue = {
    toast: addToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${t.exiting ? styles.toastExiting : ""}`}
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
  if (toastFunction) {
    toastFunction(message, type ?? "info", duration ?? 2000);
  } else {
    console.warn(
      "ToastContainer is not mounted. Please wrap your app with ToastContainer.",
    );
  }
}
