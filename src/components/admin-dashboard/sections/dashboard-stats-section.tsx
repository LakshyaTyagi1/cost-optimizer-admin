import { DashboardPanel } from "../dashboard-panel";
import { statToneStyles } from "../dashboard-styles";
import type { DashboardQueryProps } from "../dashboard-types";

export function DashboardStatsSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-4 xl:mt-7"
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
          className="min-h-[104px] sm:min-h-[118px]"
        >
          <dl>
            <dt className="text-[9px] leading-3 font-semibold tracking-[0.58px] text-[#A1A1AA] uppercase sm:text-[9.5px] sm:leading-[13px] sm:tracking-[0.78px] lg:text-[10px] lg:leading-[15px] lg:tracking-[1.12px]">
              {stat.label}
            </dt>
            <dd
              className={`mt-2 text-[21px] leading-6 tracking-[0.14px] font-bold sm:text-[24px] sm:leading-7 sm:tracking-[0.24px] lg:text-[28px] lg:tracking-[0.38px] ${statToneStyles[stat.tone]}`}
            >
              {isLoading ? "--" : stat.value}
            </dd>
            <dd className="mt-2 text-[10px] font-normal leading-[15px] tracking-normal text-[#86868B] sm:text-[10.5px] sm:leading-[16px] lg:text-[11px] lg:leading-[16.5px] lg:tracking-[0.06px]">
              {isLoading ? "Loading real dashboard data..." : stat.helper}
            </dd>
          </dl>
        </DashboardPanel>
      ))}
    </>
  );
}
