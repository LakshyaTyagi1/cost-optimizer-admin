import type { ReactNode } from "react";

import { dashboardPanelTransitionClassName, recentAssessmentGridClassName } from "../dashboard-styles";

export function PipelineValueSectionSkeleton() {
  return (
    <section
      className="mt-4 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.42fr)_minmax(320px,1fr)] xl:mt-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(360px,1fr)]"
      aria-hidden="true"
    >
      <SkeletonPanel className="min-h-[270px] sm:h-[270px]">
        <div className="h-3 w-48 rounded-full bg-black/[0.06]" />
        <div className="mt-8 h-[170px] rounded-md bg-black/[0.03]" />
      </SkeletonPanel>
      <SkeletonPanel className="min-h-[270px] sm:h-[270px]">
        <div className="h-3 w-40 rounded-full bg-black/[0.06]" />
        <div className="mt-8 h-7 w-32 rounded-full bg-black/[0.06]" />
        <div className="mt-3 h-3 w-full max-w-[320px] rounded-full bg-black/[0.05]" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="h-3 w-32 rounded-full bg-black/[0.05]" />
              <span className="h-3 w-20 rounded-full bg-black/[0.05]" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    </section>
  );
}

export function PipelineConversionSectionSkeleton() {
  return (
    <SkeletonPanel className="mt-4 min-h-[250px] sm:mt-5" ariaHidden>
      <div className="h-3 w-full max-w-72 rounded-full bg-black/[0.06]" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_82px] items-center gap-x-3 gap-y-2 sm:grid-cols-[160px_minmax(0,1fr)_82px] sm:gap-4">
            <span className="h-3 rounded-full bg-black/[0.05]" />
            <span className="h-5 rounded-full bg-black/[0.05] sm:order-3" />
            <span className="col-span-2 h-[18px] rounded-full bg-black/[0.05] sm:order-2 sm:col-span-1" />
          </div>
        ))}
      </div>
    </SkeletonPanel>
  );
}

export function PortfolioSignalsSectionSkeleton() {
  return (
    <section className="mt-4 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 xl:mt-5" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, panelIndex) => (
        <SkeletonPanel key={panelIndex} className="h-[305px]">
          <div className="h-3 w-44 rounded-full bg-black/[0.06]" />
          <div className="mt-8 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-x-5">
            <div className="space-y-[18px]">
              {Array.from({ length: 6 }).map((__, index) => (
                <div key={index} className="ml-auto h-3 w-20 rounded-full bg-black/[0.05]" />
              ))}
            </div>
            <div className="space-y-[18px]">
              {Array.from({ length: 6 }).map((__, index) => (
                <div key={index} className="h-3.5 rounded-r-[4px] bg-black/[0.05]" style={{ width: `${100 - index * 10}%` }} />
              ))}
            </div>
          </div>
        </SkeletonPanel>
      ))}
    </section>
  );
}

export function RecentAssessmentsSectionSkeleton() {
  return (
    <section className="mt-7" aria-labelledby="recent-assessments-heading-skeleton" aria-hidden="true">
      <header className="mb-4 flex items-center justify-between gap-4 sm:mb-[18px]">
        <h2
          id="recent-assessments-heading-skeleton"
          className="text-[10px] font-semibold leading-3.75 tracking-[1.12px] text-[#86868B] uppercase"
        >
          Recently Updated
        </h2>
        <span className="h-4 w-12 rounded-full bg-black/[0.05]" />
      </header>

      <div
        className={`hidden ${recentAssessmentGridClassName} gap-4 px-5 pb-2 text-[9px] font-semibold leading-[13.5px] tracking-[0.8px] text-[#86868B] uppercase xl:grid`}
      >
        <span>Company</span>
        <span>Industry</span>
        <span>DI Score</span>
        <span>Total Cost</span>
        <span>Savings</span>
        <span>Last Updated</span>
        <span>Status</span>
        <span />
      </div>

      <ul className="m-0 list-none space-y-2 p-0">
        {Array.from({ length: 4 }).map((_, index) => (
          <li
            key={index}
            className={`grid min-h-[60px] gap-3 rounded-md border border-black/[0.08] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:gap-4 sm:px-5 sm:py-3 ${recentAssessmentGridClassName} xl:items-center`}
          >
            {Array.from({ length: 7 }).map((__, itemIndex) => (
              <span
                key={itemIndex}
                className="h-4 animate-pulse rounded-full bg-black/[0.06]"
              />
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkeletonPanel({
  ariaHidden = false,
  children,
  className = "",
}: {
  ariaHidden?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-hidden={ariaHidden || undefined}
      className={`min-w-0 rounded-md border border-[#00000014] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5 ${dashboardPanelTransitionClassName} ${className}`}
    >
      <div className="animate-pulse">{children}</div>
    </section>
  );
}
