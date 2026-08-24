import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "./Icons";
import { cx, Spinner } from "./index";

// ==========================================================
// MODAL
// ==========================================================
// Portalled to <body> so a parent's overflow or transform can't
// clip it. Full-height sheet on phones, centred dialog from `sm`
// up — the admin forms are long, and a centred box that can't
// scroll is unusable on a 375px screen.
// ==========================================================

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
};

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}) => {
  const panelRef = useRef(null);

  // Restore focus to whatever opened the modal on close.
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      // Keep Tab inside the dialog.
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    // Lock the page behind the modal.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first field so a keyboard user lands inside.
    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector(
        'input:not([type="hidden"]), textarea, select, button'
      );

      target?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);

      if (openerRef.current instanceof HTMLElement) {
        openerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        className={cx(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-pop",
          "rounded-t-xl sm:rounded-xl",
          SIZES[size] || SIZES.md
        )}
      >
        {/* Drag affordance on mobile sheets */}
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden"
          aria-hidden="true"
        />

        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink sm:text-lg">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-sm text-muted">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon -mt-1 -mr-1 shrink-0"
            aria-label="Close"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-4 py-3.5 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
};

// ==========================================================
// CONFIRM DIALOG
// ==========================================================
// Every destructive admin action routes through this, so no
// delete can fire on a single click.
// ==========================================================

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}) => {
  const handleConfirm = useCallback(() => {
    if (loading) return;

    onConfirm?.();
  }, [loading, onConfirm]);

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!loading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-outline sm:w-auto"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cx(
              "btn",
              tone === "danger" ? "btn-danger" : "btn-primary"
            )}
          >
            {loading && <Spinner className="size-4" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        {message}
      </p>
    </Modal>
  );
};

export default Modal;
