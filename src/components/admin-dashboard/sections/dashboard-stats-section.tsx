import { DashboardPanel } from "../dashboard-panel";
import { statToneStyles } from "../dashboard-styles";
import type { DashboardQueryProps } from "../dashboard-types";

export function DashboardStatsSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:mt-7 xl:grid-cols-4"
      aria-label="Business dashboard summary"
    >
      <DashboardStatsCards {...dashboardProps} />
    </section>
  );
}

function DashboardStatsCards({ dashboardQuery, dashboardViewData }: DashboardQueryProps) {
  const { isLoading } = dashboardQuery;
  const stats = dashboardViewData.stats;

  return (
    <>
      {stats.map((stat) => (
        <DashboardPanel
          key={stat.label}
          ariaLabel={`${stat.label} summary`}
          className="min-h-[112px] sm:min-h-[118px]"
        >
          <dl>
            <dt className="text-[10px] leading-[15px] font-semibold tracking-[1.12px] text-[#A1A1AA] uppercase">
              {stat.label}
            </dt>
            <dd
              className={`mt-2 text-[26px] leading-7 tracking-[0.32px] font-bold sm:text-[28px] sm:tracking-[0.38px] ${statToneStyles[stat.tone]}`}
            >
              {isLoading ? "--" : stat.value}
            </dd>
            <dd className="mt-2 text-[11px] font-normal leading-[16.5px] tracking-[0.06px] text-[#86868B]">
              {isLoading ? "Loading real dashboard data..." : stat.helper}
            </dd>
          </dl>
        </DashboardPanel>
      ))}
    </>
  );
}
