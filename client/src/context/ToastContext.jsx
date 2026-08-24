import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  AlertIcon,
  CheckCircleIcon,
  CloseIcon,
  InfoIcon,
} from "../components/ui/Icons";
import { cx } from "../components/ui";

// ==========================================================
// TOASTS
// ==========================================================
// Admin CRUD is a long chain of small saves; a toast is the
// least intrusive way to confirm each one. Bottom-centre on
// phones (thumb reach, clear of the bottom nav) and top-right on
// larger screens.
// ==========================================================

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 4500;

const TONE_STYLES = {
  success: "bg-success-soft text-success",
  error: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

const TONE_ICONS = {
  success: CheckCircleIcon,
  error: AlertIcon,
  warning: AlertIcon,
  info: InfoIcon,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );

    const timer = timers.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, tone = "info", options = {}) => {
      if (!message) return null;

      nextId.current += 1;

      const id = nextId.current;

      setToasts((current) => {
        // Cap the stack so a failing loop can't paper over the UI.
        const next = [
          ...current,
          { id, message, tone, title: options.title },
        ];

        return next.slice(-4);
      });

      const duration = options.duration ?? AUTO_DISMISS_MS;

      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), duration)
        );
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, options) =>
        push(message, "success", options),
      error: (message, options) =>
        push(message, "error", options),
      warning: (message, options) =>
        push(message, "warning", options),
      info: (message, options) =>
        push(message, "info", options),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-safe sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-auto sm:items-end sm:p-5"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((item) => {
            const ToneIcon =
              TONE_ICONS[item.tone] || InfoIcon;

            return (
              <div
                key={item.id}
                className={cx(
                  "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md px-4 py-3 text-sm shadow-pop",
                  TONE_STYLES[item.tone] || TONE_STYLES.info
                )}
                role={
                  item.tone === "error" ? "alert" : "status"
                }
              >
                <ToneIcon className="mt-0.5 size-5 shrink-0" />

                <div className="min-w-0 flex-1">
                  {item.title && (
                    <p className="font-semibold">
                      {item.title}
                    </p>
                  )}

                  <p
                    className={cx(
                      item.title && "mt-0.5",
                      "break-words"
                    )}
                  >
                    {item.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="-m-1 shrink-0 rounded p-1 opacity-70 hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside a <ToastProvider>"
    );
  }

  return context;
};
