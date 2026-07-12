"use client";

import { useId } from "react";

import { ChartAxisTicks, ChartGrid } from "../chart-axis";
import { dashboardPanelTransitionClassName } from "../dashboard-styles";
import type { DashboardQueryProps } from "../dashboard-types";
import { hasDashboardValueData } from "../dashboard-utils";
import { SelectedProcessBar } from "../selected-process-bar";

export default function PortfolioSignalsSection(dashboardProps: DashboardQueryProps) {
  const { dashboardQuery, dashboardViewData } = dashboardProps;
  const showCompanySizeCard =
    dashboardQuery.isLoading || hasDashboardValueData(dashboardViewData.companySizeDistribution);
  const showSelectedProcessesCard =
    dashboardQuery.isLoading || hasDashboardValueData(dashboardViewData.selectedProcesses);

  if (!showCompanySizeCard && !showSelectedProcessesCard) {
    return null;
  }

  return (
    <section
      className="mt-4 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 xl:mt-5"
      aria-label="Portfolio signals"
    >
      {showCompanySizeCard ? <CompanySizeCard {...dashboardProps} /> : null}
      {showSelectedProcessesCard ? <SelectedProcessesCard {...dashboardProps} /> : null}
    </section>
  );
}

function CompanySizeCard({ dashboardViewData }: DashboardQueryProps) {
  const distribution = dashboardViewData.companySizeDistribution;
  const maxValue = dashboardViewData.companySizeAxisMax;
  const ticks = dashboardViewData.companySizeTicks;
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`min-h-[305px] min-w-0 rounded-md border border-[#00000014] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] ${dashboardPanelTransitionClassName}`}
    >
      <header className="flex min-h-[49px] items-center border-b border-[#00000014] px-4 py-3 sm:px-5">
        <h2
          id={titleId}
          className="text-[11px] font-semibold leading-[16.5px] tracking-[1.16px] text-[#86868B] uppercase"
        >
          By Company Size
        </h2>
      </header>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-x-2 sm:grid-cols-[fit-content(100px)_minmax(0,1fr)] sm:gap-x-2.5">
          <div>
            {distribution.map((item) => (
              <div
                key={item.label}
                className="flex h-[31.666px] items-center justify-end"
              >
                <p className="max-w-[86px] whitespace-pre-line break-words text-right text-[10px] leading-[100%] font-normal text-[#555555] sm:max-w-[100px]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div
            className="relative h-[190px] min-h-[190px] pl-0"
            role="img"
            aria-label={`Company size distribution across ${distribution.length} groups`}
          >
            <ChartGrid columns={4} className="inset-x-0 top-0 h-[190px]" />
            <div className="relative z-10" aria-hidden="true">
              {distribution.map((item) => (
                <div key={item.label} className="flex h-[31.666px] items-center">
                  <div
                    className="h-3.5 rounded-r-[4px] bg-[#007AFF] transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            {distribution.length === 0 ? (
              <p className="relative z-10 pt-2 pl-4 text-xs font-semibold text-[#86868B]">
                No company size data available yet.
              </p>
            ) : null}
            <ChartAxisTicks ticks={ticks} className="top-[198px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedProcessesCard({ dashboardViewData }: DashboardQueryProps) {
  const processes = dashboardViewData.selectedProcesses;
  const maxValue = dashboardViewData.selectedProcessesAxisMax;
  const ticks = dashboardViewData.selectedProcessesTicks;
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`min-h-[305px] min-w-0 rounded-md border border-[#00000014] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] ${dashboardPanelTransitionClassName}`}
    >
      <header className="flex min-h-[49px] items-center border-b border-[#00000014] px-4 py-3 sm:px-5">
        <h2
          id={titleId}
          className="text-[11px] font-semibold leading-[16.5px] tracking-[1.16px] text-[#86868B] uppercase"
        >
          Most-Selected Processes (Signal for Product Priorities)
        </h2>
      </header>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[fit-content(178px)_minmax(0,1fr)] sm:gap-x-5">
          <div className="space-y-[11.75px] pt-1">
            {processes.map((process) => (
              <div
                key={process.label}
                className="flex h-3 items-center justify-end"
              >
                <p className="max-w-[104px] whitespace-pre-line break-words text-right text-[10px] leading-[100%] font-normal text-[#555555] sm:max-w-[178px]">
                  {process.label}
                </p>
              </div>
            ))}
          </div>
          <div
            className="relative h-[190px] min-h-[190px]"
            role="img"
            aria-label={`Most-selected process distribution across ${processes.length} processes`}
          >
            <ChartGrid columns={4} className="inset-x-0 top-0 h-[190px]" />
            <div className="relative z-10 space-y-[11.75px] pt-1" aria-hidden="true">
              {processes.map((process) => (
                <div
                  key={process.label}
                  className="flex h-3 items-center"
                >
                  <SelectedProcessBar percent={(process.value / maxValue) * 100} />
                </div>
              ))}
            </div>
            {processes.length === 0 ? (
              <p className="relative z-10 pt-2 pl-4 text-xs font-semibold text-[#86868B]">
                No selected process data available yet.
              </p>
            ) : null}
            <ChartAxisTicks ticks={ticks} className="top-[198px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
