import { normalizeStatusKey } from "@/features/dashboard/utils/dashboard-view-data";

import { DashboardPanel } from "../dashboard-panel";
import {
  industryBreakdownIconStyles,
  LayoutGrid,
  pipelineStatusRowStyles,
  statusStyles,
} from "../dashboard-styles";
import type { DashboardQueryProps } from "../dashboard-types";
import { getErrorMessage } from "../dashboard-utils";

export function PipelineDistributionSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5 xl:mt-5"
      aria-label="Pipeline distribution"
    >
      <PipelineStatusCard {...dashboardProps} />
      <IndustryBreakdownCard {...dashboardProps} />
    </section>
  );
}

function PipelineStatusCard({ dashboardQuery, dashboardViewData }: DashboardQueryProps) {
  const { error, isLoading } = dashboardQuery;
  const statuses = dashboardViewData.statuses;
  const errorMessage = error ? getErrorMessage(error) : "";
  const maxStatusCount = Math.max(1, ...statuses.map((status) => status.count));

  return (
    <DashboardPanel title="Pipeline by Status" className="min-h-[345px] sm:min-h-[365px]" hideHeaderBorder>
      <ul className="mt-3.25 space-y-2" aria-label="Pipeline status counts">
        {statuses.map((status) => {
          const styles = statusStyles[status.tone];
          const fillWidth = status.count > 0 ? `${(status.count / maxStatusCount) * 100}%` : "0%";
          const statusKey = normalizeStatusKey(status.key || status.label);
          const rowStyles = pipelineStatusRowStyles[statusKey] ?? {
            bar: styles.bar,
            count:
              status.tone === "green"
                ? "text-[#10B981]"
                : status.tone === "red"
                  ? "text-[#EF4444]"
                  : "text-[#007AFF]",
            icon: styles.icon,
          };

          return (
            <li
              key={status.key || status.label}
              className="relative min-h-9 overflow-hidden rounded-md border border-[#0000000D] bg-white"
              aria-label={`${status.label}: ${status.count}`}
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-l-md transition-[width] duration-700 ease-out motion-reduce:transition-none ${rowStyles.bar}`}
                aria-hidden="true"
                style={{ width: fillWidth }}
              />
              <div className="relative flex min-h-9 items-center gap-2.5 px-2.5 sm:gap-3 sm:px-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-md ${rowStyles.icon}`}
                  aria-hidden="true"
                >
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium leading-4.5 text-[#000000]">
                  {status.label}
                </span>
                <span className={`text-xs font-bold ${rowStyles.count}`}>
                  {status.count}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {!isLoading && errorMessage ? (
        <p className="mt-4 text-xs font-semibold text-[#EF4444]">{errorMessage}</p>
      ) : null}
    </DashboardPanel>
  );
}

function IndustryBreakdownCard({ dashboardQuery, dashboardViewData }: DashboardQueryProps) {
  const { error, isLoading } = dashboardQuery;
  const industries = dashboardViewData.industryBreakdown;
  const maxCount = Math.max(1, ...industries.map((industry) => industry.count));
  const errorMessage = error ? getErrorMessage(error) : "";
  const shouldScrollIndustries = industries.length > 7;

  return (
    <DashboardPanel title="By Industry" className="min-h-[345px] sm:min-h-[365px]" hideHeaderBorder>
      <ul
        className={`mt-3.75 space-y-2 ${shouldScrollIndustries ? "max-h-[300px] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" : ""}`}
        aria-label="Assessment count by industry"
      >
        {isLoading
          ? Array.from({ length: 7 }).map((_, index) => (
              <li
                key={index}
                className="h-9 animate-pulse rounded-md border border-black/[0.04] bg-black/[0.04]"
              />
            ))
          : null}
        {!isLoading && industries.length === 0 ? (
          <li>
            <p className="rounded-md border border-black/[0.04] bg-white px-3 py-3 text-xs font-semibold text-[#86868B]">
              {errorMessage || "No industry data available yet."}
            </p>
          </li>
        ) : null}
        {!isLoading &&
          industries.map((industry) => {
            const industryKey = industry.label.trim().toLowerCase().replace(/\s+/g, " ");
            const iconConfig = industryBreakdownIconStyles[industryKey];
            const Icon = iconConfig?.icon || LayoutGrid;

            return (
              <li
                key={industry.label}
                className="relative min-h-9 overflow-hidden rounded-md border border-black/[0.04] bg-white"
                aria-label={`${industry.label}: ${industry.count}`}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-l-md bg-[#EFF6FF]"
                  aria-hidden="true"
                  style={{ width: `${(industry.count / maxCount) * 100}%` }}
                />
                <div className="relative flex min-h-9 items-center gap-2.5 px-2.5 sm:gap-3 sm:px-3">
                  <span className="flex size-6 items-center justify-center rounded-md bg-[#007AFF] text-white" aria-hidden="true">
                    <Icon
                      size={iconConfig?.size || 14}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium leading-4.5 text-[#000000]">
                    {industry.label}
                  </span>
                  <span className="text-xs font-bold text-[#007AFF]">{industry.count}</span>
                </div>
              </li>
            );
          })}
      </ul>
    </DashboardPanel>
  );
}
