"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export type DefaultsWorkspaceDialogProps = {
  children: ReactNode;
  controls: ReactNode;
  description: ReactNode;
  descriptionId: string;
  footer: ReactNode;
  icon: ReactNode;
  isBusy: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
};

export function DefaultsWorkspaceDialog({
  children,
  controls,
  description,
  descriptionId,
  footer,
  icon,
  isBusy,
  onClose,
  title,
  titleId,
}: DefaultsWorkspaceDialogProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isBusy, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 backdrop-blur-[1px] sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#F7FAFC] shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:h-[min(720px,calc(100dvh-32px))] sm:max-w-[1120px] sm:rounded-xl sm:border sm:border-[#B3D7FF]"
      >
        <header className="shrink-0 border-b border-black/[0.08] bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#007AFF]">
                  {icon}
                </span>
                <h2 id={titleId} className="text-base font-bold text-[#171717] sm:text-lg">
                  {title}
                </h2>
              </div>
              <p
                id={descriptionId}
                className="mt-2 max-w-[820px] text-xs leading-5 font-medium text-[#68686D]"
              >
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#68686D] transition hover:bg-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Close ${title.toLowerCase()} dialog`}
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-black/[0.08] bg-[#F0F8FF] px-4 py-3 sm:px-6">
          <div className="rounded-xl border border-[#D7E7F6] bg-white/60 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            {controls}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-white" tabIndex={0}>
          {children}
        </div>

        <footer
          className="shrink-0 border-t border-black/[0.08] bg-white px-4 py-2.5 sm:px-6"
          aria-live="polite"
        >
          {footer}
        </footer>
      </div>
    </div>
  );
}
