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

// Store the trigger element to restore focus after dialog closes
let triggerElementRef: HTMLElement | null = null;

interface ConfirmDialogProps {
  children?: React.ReactNode;
}

export function ConfirmDialog({ children }: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const resolveRef = useRef<(value: boolean) => void>(() => {});
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Use refs to store handlers for use in event listeners
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const closeDialog = useCallback((value: boolean) => {
    resolveRef.current(value);
    setIsOpen(false);
  }, []);

  const openConfirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    // Store the currently focused element to restore focus later
    triggerElementRef = document.activeElement as HTMLElement;
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  // Store the confirm function for external access and clean up on unmount
  useEffect(() => {
    confirmFunctionRef.current = openConfirm;

    return () => {
      confirmFunctionRef.current = null;
    };
  }, [openConfirm]);

  // Focus the confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpenRef.current && event.key === "Escape") {
        closeDialog(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDialog]);

  // Clean up resolveRef when component unmounts while dialog is open
  useEffect(() => {
    return () => {
      if (resolveRef.current) {
        resolveRef.current(false);
      }
    };
  }, []);

  // Restore focus to trigger element when dialog closes
  useEffect(() => {
    if (!isOpen && triggerElementRef) {
      triggerElementRef.focus();
      triggerElementRef = null;
    }
  }, [isOpen]);

  // Generate unique IDs for ARIA attributes
  const dialogId = `confirm-dialog-${Date.now()}`;
  const titleId = `${dialogId}-title`;
  const messageId = `${dialogId}-message`;

  return (
    <>
      {children}
      {isOpen &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby={options.title ? titleId : undefined}
            aria-describedby={messageId}
          >
            <div className={styles.dialog} id={dialogId}>
              {options.title && (
                <div className={styles.title} id={titleId}>
                  {options.title}
                </div>
              )}
              <div className={styles.message} id={messageId}>
                {options.message}
              </div>
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.cancelButton}`}
                  onClick={() => closeDialog(false)}
                >
                  {options.cancelText || "取消"}
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  className={`${styles.button} ${styles.confirmButton}`}
                  onClick={() => closeDialog(true)}
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
