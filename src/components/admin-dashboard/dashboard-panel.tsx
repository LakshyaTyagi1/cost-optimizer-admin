"use client";

import { useId, type ReactNode } from "react";

import { dashboardPanelTransitionClassName } from "./dashboard-styles";

export function DashboardPanel({
  ariaLabel,
  children,
  className = "",
  hideHeaderBorder = false,
  title,
}: {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  hideHeaderBorder?: boolean;
  title?: string;
}) {
  const titleId = useId();

  return (
    <section
      aria-label={title ? undefined : ariaLabel}
      aria-labelledby={title ? titleId : undefined}
      className={`relative min-w-0 rounded-md border border-[#00000014] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5 ${dashboardPanelTransitionClassName} ${className}`}
    >
      {title ? (
        <>
          <h2
            id={titleId}
            className="text-[10px] font-semibold leading-3.75 tracking-[1.12px] text-[#86868B] uppercase"
          >
            {title}
          </h2>
          {!hideHeaderBorder ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-[49px] border-t border-[#00000014]"
              aria-hidden="true"
            />
          ) : null}
        </>
      ) : null}
      {children}
    </section>
  );
}
