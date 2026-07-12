import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import {
  formatRecentAssessmentUpdatedAt,
  getRecentAssessmentHighlightHref,
  normalizeDashboardLabel,
} from "@/features/dashboard/utils/dashboard-view-data";

import { getRecentAssessmentDateTime, getStatusTone, getErrorMessage } from "../dashboard-utils";
import { IndustryIcon } from "../industry-icon";
import { recentAssessmentGridClassName } from "../dashboard-styles";
import type { DashboardQueryProps } from "../dashboard-types";
import { StatusPill } from "../status-pill";

export default function RecentAssessmentsSection({ dashboardQuery }: DashboardQueryProps) {
  const { data, error, isLoading } = dashboardQuery;
  const assessments = data?.recentAssessments ?? [];
  const errorMessage = error ? getErrorMessage(error) : "";

  return (
    <section className="mt-7" aria-labelledby="recent-assessments-heading">
      <header className="mb-4 flex items-center justify-between gap-4 sm:mb-[18px]">
        <h2
          id="recent-assessments-heading"
          className="text-[10px] font-semibold leading-3.75 tracking-[1.12px] text-[#86868B] uppercase"
        >
          Recently Updated
        </h2>
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1 text-xs leading-4.5 font-medium text-[#007AFF]"
          aria-label="View all assessments"
        >
          View all
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </header>

      <div
        className={`hidden ${recentAssessmentGridClassName} gap-4 px-5 pb-2 text-[9px] font-semibold leading-[13.5px] tracking-[0.8px] text-[#86868B] uppercase xl:grid`}
        aria-hidden="true"
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
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <li
                key={index}
                className={`grid min-h-[60px] gap-3 rounded-md border border-black/[0.08] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:gap-4 sm:px-5 sm:py-3 ${recentAssessmentGridClassName} xl:items-center`}
                aria-hidden="true"
              >
                {Array.from({ length: 7 }).map((__, itemIndex) => (
                  <span
                    key={itemIndex}
                    className="h-4 animate-pulse rounded-full bg-black/[0.06]"
                  />
                ))}
              </li>
            ))
          : null}

        {!isLoading && assessments.length === 0 ? (
          <li>
            <p className="rounded-md border border-black/[0.08] bg-white px-5 py-5 text-sm font-semibold text-[#86868B] shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
              {errorMessage || "No recently updated assessments yet."}
            </p>
          </li>
        ) : null}

        {!isLoading && assessments.map((assessment) => {
          const statusTone = getStatusTone(assessment.status, assessment.statusKey);
          const lastUpdated = formatRecentAssessmentUpdatedAt(assessment);
          const lastUpdatedDateTime = getRecentAssessmentDateTime(assessment);
          const owner = normalizeDashboardLabel(assessment.owner);
          const totalCostValue = assessment.totalCostInSavedCurrency || assessment.cost;

          return (
            <li key={assessment.id}>
              <Link
                href={getRecentAssessmentHighlightHref(assessment)}
                className={`recent-assessment-card grid min-h-[60px] gap-3 rounded-md border border-black/[0.08] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:gap-4 sm:px-5 sm:py-3 ${recentAssessmentGridClassName} xl:items-center`}
                aria-label={`Open ${assessment.company} in assessments`}
              >
                <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                  <p className="truncate text-[13px] font-semibold leading-[19.5px] tracking-[-0.08px] text-[#000000]">{assessment.company}</p>
                  <p className="mt-1 truncate text-[11px] font-normal leading-[16.5px] tracking-[0.06px] text-[#86868B]">{assessment.contact}</p>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-xs font-normal leading-4.5 text-[#555555]">
                  <IndustryIcon industry={assessment.industry} />
                  <span className="min-w-0 truncate">{assessment.industry}</span>
                </div>
                <p
                  className={`text-xs font-semibold leading-4.5 ${assessment.score === "--" ? "text-[#C1C7D0]" : "text-[#007AFF]"}`}
                >
                  {assessment.score}
                </p>
                <p className="text-xs font-normal leading-4.5 text-[#000000]">{totalCostValue}</p>
                <p
                  className={`text-xs font-medium ${assessment.savings === "--" ? "text-[#10B981]" : "text-[#10B981]"}`}
                >
                  {assessment.savings}
                </p>
                <div className="flex min-w-0 items-start gap-2 text-xs font-semibold text-[#555555]">
                  <Clock
                    size={14}
                    className="mt-0.5 shrink-0 text-[#007AFF]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs leading-[1.2] font-medium text-[#555555]">
                      {lastUpdatedDateTime ? (
                        <time dateTime={lastUpdatedDateTime}>{lastUpdated}</time>
                      ) : (
                        lastUpdated
                      )}
                    </p>
                    {owner ? (
                      <p className="mt-1 truncate text-xs leading-[1.2] font-semibold text-[#86868B]">
                        by {owner}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="min-w-0 xl:min-w-0">
                  <StatusPill label={assessment.status} tone={statusTone} />
                </span>
                <span className="hidden text-[#C1C7D0] xl:block" aria-hidden="true">
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
