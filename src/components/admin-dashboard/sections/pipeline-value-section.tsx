"use client";

import { useId } from "react";

import { formatCompactBaseCurrency } from "@/features/dashboard/utils/dashboard-view-data";

import { AssessmentTrendChart } from "../assessment-trend-chart";
import { DashboardPanel } from "../dashboard-panel";
import { dashboardPanelTransitionClassName } from "../dashboard-styles";
import type { DashboardQueryProps } from "../dashboard-types";

export default function PipelineValueSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-5 lg:grid-cols-[minmax(0,1.42fr)_minmax(320px,1fr)] xl:mt-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(360px,1fr)]"
      aria-label="Pipeline trend and value"
    >
      <AssessmentTrendCard {...dashboardProps} />
      <WeightedPipelineCard {...dashboardProps} />
    </section>
  );
}

function AssessmentTrendCard({ dashboardViewData }: DashboardQueryProps) {
  const trend = dashboardViewData.assessmentTrend;
  const titleId = useId();

  return (
    <DashboardPanel ariaLabel="New Assessments - Last 6 Months" className="relative min-h-[226px] sm:h-[270px]">
      <div
        className="pointer-events-none absolute inset-x-0 top-[49px] border-t border-[#00000014]"
        aria-hidden="true"
      />
      <h2
        id={titleId}
        className="text-[10px] font-semibold leading-3.75 tracking-[1.12px] text-[#86868B] uppercase"
      >
        New Assessments - Last 6 Months
      </h2>
      <AssessmentTrendChart data={trend} />
    </DashboardPanel>
  );
}

function WeightedPipelineCard({ dashboardQuery, dashboardViewData }: DashboardQueryProps) {
  const { isLoading } = dashboardQuery;
  const weightedPipelineStages = dashboardViewData.weightedPipelineStages;
  const weightedPipelineBaseCurrencyValue = dashboardViewData.weightedPipelineBaseCurrencyValue;
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`min-h-[270px] min-w-0 rounded-md border border-[#00000014] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] ${dashboardPanelTransitionClassName}`}
    >
      <header className="flex min-h-[49px] items-center border-b border-[#00000014] px-4 py-3 sm:px-6">
        <h2
          id={titleId}
          className="text-[10px] leading-[15px] font-semibold tracking-[1.12px] text-[#86868B] uppercase"
        >
          Weighted Pipeline Value
        </h2>
      </header>
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-[26px] font-bold leading-7 tracking-[0.32px] text-[#000000] sm:text-[28px] sm:tracking-[0.38px]">
          {isLoading ? "--" : formatCompactBaseCurrency(weightedPipelineBaseCurrencyValue)}
        </p>
        <p className="mt-1 text-[11px] font-normal leading-[16.5px] tracking-[0.06px] text-[#86868B]">
          Open deals &times; stage-probability &mdash; a more realistic forecast than raw pipeline cost.
        </p>
        <ul className="mt-4 space-y-1.75" aria-label="Weighted pipeline stages">
          {weightedPipelineStages.map((stage) => (
            <li
              key={stage.key || stage.label}
              className="flex items-center justify-between gap-4 text-[11px] leading-[16.5px] sm:gap-6"
            >
              <span className="min-w-0 truncate font-normal tracking-[0.06px] text-[#86868B]">
                {stage.label}
              </span>
              <span className="shrink-0 font-medium tracking-[0.06px] text-[#000000]">
                {stage.weightPercent}% weight
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
