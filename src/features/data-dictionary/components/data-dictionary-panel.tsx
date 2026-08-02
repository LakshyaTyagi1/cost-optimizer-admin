import type { ReactNode } from "react";
import { Plus } from "lucide-react";

export function DataDictionaryPanel({
  actionLabel,
  actionSlot,
  children,
  className = "",
  onAction,
  title,
}: {
  actionLabel?: string;
  actionSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  onAction?: () => void;
  title?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-md border border-black/8 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}
    >
      {title || actionLabel || actionSlot ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.08]">
          {title ? (
            <p className="text-[11px] leading-[16.5px] font-semibold tracking-[1.16px] text-[#86868B] uppercase">
              {title}
            </p>
          ) : (
            <span />
          )}
          {actionSlot ?? (actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#007AFF]"
            >
              <Plus size={12} aria-hidden="true" />
              {actionLabel}
            </button>
          ) : null)}
        </div>
      ) : null}
      {children}
    </section>
  );
}
