"use client";

import { useId } from "react";

import { dashboardPanelTransitionClassName } from "../dashboard-styles";
import type { DashboardQueryProps } from "../dashboard-types";

export default function PipelineConversionSection({ dashboardViewData }: DashboardQueryProps) {
  const conversion = dashboardViewData.pipelineConversion;
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`mt-4 min-h-[250px] min-w-0 rounded-md border border-[#00000014] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:mt-5 ${dashboardPanelTransitionClassName}`}
    >
      <header className="flex min-h-[49px] items-center border-b border-[#00000014] px-4 py-3 sm:px-6">
        <h2
          id={titleId}
          className="text-[10px] font-semibold leading-3.75 tracking-[1.12px] text-[#86868B] uppercase"
        >
          Pipeline Conversion (of Active + Won Deals)
        </h2>
      </header>
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <ul className="space-y-4 sm:space-y-3" aria-label="Pipeline conversion percentages">
          {conversion.map((item) => (
            <li
              key={item.label}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-[11px] leading-[16.5px] tracking-[0.06px] sm:grid-cols-[160px_minmax(0,1fr)_82px] sm:gap-4"
              aria-label={`${item.label}: ${item.percent}%, ${item.deals}`}
            >
              <span className="min-w-0 truncate font-medium text-[#555555]">
                {item.label}
              </span>
              <span className="justify-self-end rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none text-[#86868B] sm:order-3">
                {item.deals}
              </span>
              <div className="relative col-span-2 h-[18px] overflow-hidden rounded-full bg-[#F3F4F6] shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-[#00000008] sm:order-2 sm:col-span-1" aria-hidden="true">
                {item.percent > 0 ? (
                  <div
                    className="flex h-full min-w-10 items-center justify-end rounded-full bg-gradient-to-r from-[#0A84FF] to-[#007AFF] pr-2 text-[10px] font-semibold leading-none text-white shadow-[0_1px_3px_rgba(0,122,255,0.28)] transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: `${item.percent}%` }}
                  >
                    {item.percent}%
                  </div>
                ) : (
                  <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold leading-none text-[#A1A1AA]">
                    0%
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
