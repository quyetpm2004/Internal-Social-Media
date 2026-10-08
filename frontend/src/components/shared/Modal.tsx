import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Replaces the default Cancel / Confirm row. */
  footer?: ReactNode;
  /** Hides every footer, including a custom one. */
  hideFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  /** Submit this form when Confirm is pressed. */
  formId?: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  hideCancel?: boolean;
  hideClose?: boolean;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  variant?: "danger" | "primary";
  size?: ModalSize;
  className?: string;
  containerClassName?: string;
  footerClassName?: string;
};

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  hideFooter = false,
  confirmText,
  cancelText,
  onConfirm,
  formId,
  loading = false,
  confirmDisabled = false,
  hideCancel = false,
  hideClose = false,
  closeOnOverlay = true,
  closeOnEscape = true,
  variant = "primary",
  size = "md",
  className,
  containerClassName,
  footerClassName,
}: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape && !loading) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, closeOnEscape, onClose]);

  if (!open) return null;

  const requestClose = () => {
    if (!loading) onClose();
  };

  const confirmClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-primary hover:bg-primary/90";

  const showDefaultFooter =
    !hideFooter && footer === undefined && Boolean(onConfirm || formId);
  const showCustomFooter = !hideFooter && footer !== undefined;

  const defaultFooter = (
    <>
      {!hideCancel && (
        <button
          type="button"
          disabled={loading}
          onClick={requestClose}
          className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelText ?? t("common.cancel")}
        </button>
      )}
      <button
        type={formId ? "submit" : "button"}
        form={formId}
        disabled={loading || confirmDisabled}
        onClick={formId ? undefined : onConfirm}
        className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? t("common.processing") : (confirmText ?? t("common.confirm"))}
      </button>
    </>
  );

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        containerClassName,
      )}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => {
          if (closeOnOverlay) requestClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative flex max-h-[min(90vh,40rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeClass[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex shrink-0 items-start justify-between gap-4">
            {title ? (
              <h2
                id={titleId}
                className="font-headline text-lg font-semibold text-slate-900"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!hideClose && (
              <button
                type="button"
                aria-label={t("common.close")}
                disabled={loading}
                onClick={requestClose}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        {description && (
          <div
            id={descriptionId}
            className="mt-2 shrink-0 text-sm leading-relaxed text-slate-500"
          >
            {description}
          </div>
        )}

        {children && (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>
        )}

        {(showDefaultFooter || showCustomFooter) && (
          <div
            className={cn(
              "mt-6 flex shrink-0 justify-end gap-2",
              footerClassName,
            )}
          >
            {showCustomFooter ? footer : defaultFooter}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
