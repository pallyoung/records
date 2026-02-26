import { createPortal } from "react-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./confirm.module.scss";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

// Module-level refs for global confirm access
const confirmFunctionRef = {
  current: null as ((options: ConfirmOptions) => Promise<boolean>) | null,
};

interface ConfirmDialogProps {
  children?: React.ReactNode;
}

export function ConfirmDialog({ children }: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const openConfirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  // Store the confirm function for external access
  useEffect(() => {
    confirmFunctionRef.current = openConfirm;
  }, [openConfirm]);

  const handleConfirm = useCallback(() => {
    resolveRef.current(true);
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current(false);
    setIsOpen(false);
  }, []);

  return (
    <>
      {children}
      {isOpen &&
        createPortal(
          <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.dialog}>
              {options.title && (
                <div className={styles.title}>{options.title}</div>
              )}
              <div className={styles.message}>{options.message}</div>
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.cancelButton}`}
                  onClick={handleCancel}
                >
                  {options.cancelText || "取消"}
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.confirmButton}`}
                  onClick={handleConfirm}
                >
                  {options.confirmText || "确认"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * Show a confirmation dialog
 * @param options - Confirm options
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 *
 * @example
 * const ok = await confirm({ message: "确定要删除吗？" });
 * const ok = await confirm({ title: "确认删除", message: "确定要删除这个任务吗？" });
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (confirmFunctionRef.current) {
    return confirmFunctionRef.current(options);
  } else {
    console.warn(
      "ConfirmDialog is not mounted. Please wrap your app with ConfirmDialog.",
    );
    return Promise.resolve(false);
  }
}
