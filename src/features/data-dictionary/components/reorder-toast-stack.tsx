"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type ReorderToastState = {
  description?: string;
  id: string;
  message: string;
  tone: "success" | "error" | "processing";
};

export function ReorderToastStack({
  ariaLabel = "Industry and domain mapping notifications",
  onDismiss,
  successDescription = "Industry and domain mapping",
  toasts,
}: {
  ariaLabel?: string;
  onDismiss: (toastId: string) => void;
  successDescription?: string;
  toasts: ReorderToastState[];
}) {
  const visibleToasts = toasts.slice(0, 3);
  const [isExpanded, setIsExpanded] = useState(false);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`pointer-events-auto fixed right-5 bottom-5 z-[70] w-[min(440px,calc(100vw-40px))] ${
        isExpanded
          ? "flex max-h-[calc(100vh-40px)] flex-col-reverse gap-2.5 overflow-y-auto"
          : "h-28"
      }`}
      aria-label={ariaLabel}
      onBlur={() => setIsExpanded(false)}
      onFocus={() => setIsExpanded(true)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <style>
        {`
          @keyframes mapping-toast-enter {
            from {
              opacity: 0;
              transform: translate3d(0, 18px, 0) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
        `}
      </style>
      {visibleToasts.map((toast, index) => {
        const isFrontToast = index === 0;
        const isError = toast.tone === "error";
        const isProcessing = toast.tone === "processing";
        const toastDescription = isProcessing
          ? "Changes are being saved."
          : isError
            ? "Please retry this action."
            : toast.description || successDescription;

        return (
          <div
            key={toast.id}
            aria-hidden={!isExpanded && !isFrontToast}
            aria-live={isError ? "assertive" : "polite"}
            className={`${
              isExpanded ? "relative shrink-0" : "absolute right-0 bottom-0"
            } min-h-[72px] w-full overflow-hidden rounded-[11px] border border-black/[0.08] bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]`}
            role={isExpanded || isFrontToast ? (isError ? "alert" : "status") : undefined}
            style={{
              animation: isFrontToast ? "mapping-toast-enter 180ms ease-out" : undefined,
              opacity: isExpanded ? 1 : 1 - index * 0.14,
              transform: isExpanded
                ? "translateY(0) scale(1)"
                : `translateY(${index * 15}px) scale(${1 - index * 0.035})`,
              transition: "transform 180ms ease, opacity 180ms ease, box-shadow 180ms ease",
              zIndex: visibleToasts.length - index,
            }}
          >
            {isExpanded || isFrontToast ? (
              <div className="flex items-start gap-3">
                {isProcessing ? (
                  <span
                    className="mt-1 size-3 shrink-0 animate-spin rounded-full border-2 border-[#D1D5DB] border-t-[#007AFF]"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className={`mt-[5px] size-2.5 shrink-0 rounded-full ${
                      isError ? "bg-[#EF4444]" : "bg-[#10B981]"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block break-words whitespace-normal text-sm leading-5 font-bold text-[#171717]">
                    {toast.message}
                  </span>
                  <span className="mt-0.5 block break-words whitespace-normal text-xs leading-4 font-semibold text-[#86868B]">
                    {toastDescription}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  className="-mt-1 -mr-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#171717] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007AFF]"
                  aria-label={`Dismiss notification: ${toast.message}`}
                  title="Dismiss notification"
                >
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

