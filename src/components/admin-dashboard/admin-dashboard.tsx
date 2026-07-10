"use client";

import { useId, useMemo, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Car,
  Clock,
  Home,
  LayoutGrid,
  Shield,
  ShoppingBag,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

import { AssessmentTrendChart } from "./assessment-trend-chart";
import {
  useDashboardData,
  type DashboardDataQuery,
} from "@/features/dashboard/queries";
import {
  createDashboardViewData,
  formatCompactBaseCurrency,
  formatRecentAssessmentUpdatedAt,
  getRecentAssessmentHighlightHref,
  normalizeDashboardLabel,
  normalizeStatusKey,
  type DashboardViewData,
} from "@/features/dashboard/utils/dashboard-view-data";

const statToneStyles = {
  neutral: "text-[#171717]",
  blue: "text-[#007AFF]",
  green: "text-[#10B981]",
} as const;

const statusStyles = {
  gray: { icon: "bg-[#9CA3AF]", chip: "bg-[#F5F5F5] text-[#555555]", dot: "bg-[#9CA3AF]", bar: "bg-[#F5F5F5]" },
  blueLight: { icon: "bg-[#6E9FF8]", chip: "bg-[#EEF5FF] text-[#4D7FEA]", dot: "bg-[#6E9FF8]", bar: "bg-[#EEF5FF]" },
  blue: { icon: "bg-[#007AFF]", chip: "bg-[#EAF3FF] text-[#007AFF]", dot: "bg-[#007AFF]", bar: "bg-[#EAF3FF]" },
  green: { icon: "bg-[#10B981]", chip: "bg-[#ECFDF5] text-[#10B981]", dot: "bg-[#10B981]", bar: "bg-[#ECFDF5]" },
  red: { icon: "bg-[#EF4444]", chip: "bg-[#FEF2F2] text-[#EF4444]", dot: "bg-[#EF4444]", bar: "bg-[#FEF2F2]" },
} as const;

const recentAssessmentGridClassName =
  "xl:grid-cols-[minmax(205px,1.35fr)_112px_64px_108px_100px_168px_150px_14px]";

const industryIconStyles: Record<string, { className: string; icon: LucideIcon; size?: number }> = {
  automotive: { className: "text-[#86868B]", icon: Car },
  banking: { className: "text-[#86868B]", icon: Building2 },
  healthcare: { className: "text-[#86868B]", icon: Stethoscope },
  insurance: { className: "text-[#86868B]", icon: Shield, size: 13 },
  "public sector": { className: "text-[#86868B]", icon: Building2 },
  "real estate": { className: "text-[#86868B]", icon: Home },
  retail: { className: "text-[#86868B]", icon: ShoppingBag },
};

type DashboardQueryProps = {
  dashboardQuery: DashboardDataQuery;
  dashboardViewData: DashboardViewData;
};

export function AdminDashboard() {
  const dashboardQuery = useDashboardData();
  const dashboardViewData = useMemo(
    () => createDashboardViewData(dashboardQuery.data),
    [dashboardQuery.data],
  );

  return (
    <AdminShell activeItem="Dashboard">
      <section className="lg:pr-6" aria-labelledby="business-dashboard-title">
        <header>
          <h1
            id="business-dashboard-title"
            className="text-[26px] leading-tight font-bold tracking-normal"
          >
            Business Dashboard
          </h1>
        </header>

        <DashboardStatsSection
          dashboardQuery={dashboardQuery}
          dashboardViewData={dashboardViewData}
        />
        <PipelineDistributionSection
          dashboardQuery={dashboardQuery}
          dashboardViewData={dashboardViewData}
        />
        <PipelineValueSection
          dashboardQuery={dashboardQuery}
          dashboardViewData={dashboardViewData}
        />
        <PipelineConversionSection
          dashboardQuery={dashboardQuery}
          dashboardViewData={dashboardViewData}
        />
        <PortfolioSignalsSection
          dashboardQuery={dashboardQuery}
          dashboardViewData={dashboardViewData}
        />
        <RecentAssessmentsList
          dashboardQuery={dashboardQuery}
          dashboardViewData={dashboardViewData}
        />
      </section>
    </AdminShell>
  );
}

function DashboardStatsSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-7 grid gap-5 xl:grid-cols-4"
      aria-label="Business dashboard summary"
    >
      <DashboardStatsCards {...dashboardProps} />
    </section>
  );
}

function PipelineDistributionSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-5 grid gap-5 xl:grid-cols-2"
      aria-label="Pipeline distribution"
    >
      <PipelineStatusCard {...dashboardProps} />
      <IndustryBreakdownCard {...dashboardProps} />
    </section>
  );
}

function PipelineValueSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(360px,1fr)]"
      aria-label="Pipeline trend and value"
    >
      <AssessmentTrendCard {...dashboardProps} />
      <WeightedPipelineCard {...dashboardProps} />
    </section>
  );
}

function PipelineConversionSection(dashboardProps: DashboardQueryProps) {
  return <PipelineConversionCard {...dashboardProps} />;
}

function PortfolioSignalsSection(dashboardProps: DashboardQueryProps) {
  return (
    <section
      className="mt-5 grid gap-5 xl:grid-cols-2"
      aria-label="Portfolio signals"
    >
      <CompanySizeCard {...dashboardProps} />
      <SelectedProcessesCard {...dashboardProps} />
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
          className="min-h-[118px] p-5"
        >
          <dl>
            <dt className="text-[10px] font-bold tracking-[0.14em] text-[#A1A1AA] uppercase">
              {stat.label}
            </dt>
            <dd className={`!mt-4 text-[30px] leading-none font-bold ${statToneStyles[stat.tone]}`}>
              {isLoading ? "--" : stat.value}
            </dd>
            <dd className="mt-2 text-xs font-semibold text-[#86868B]">
              {isLoading ? "Loading real dashboard data..." : stat.helper}
            </dd>
          </dl>
        </DashboardPanel>
      ))}
    </>
  );
}

function PipelineStatusCard({ dashboardQuery, dashboardViewData }: DashboardQueryProps) {
  const { error, isLoading } = dashboardQuery;
  const statuses = dashboardViewData.statuses;
  const errorMessage = error ? getErrorMessage(error) : "";
  const maxStatusCount = Math.max(1, ...statuses.map((status) => status.count));

  return (
    <DashboardPanel title="Pipeline by Status" className="min-h-[365px]">
      <ul className="mt-5 space-y-2" aria-label="Pipeline status counts">
        {statuses.map((status) => {
          const styles = statusStyles[status.tone];
          const fillWidth = status.count > 0 ? `${(status.count / maxStatusCount) * 100}%` : "0%";

          return (
            <li
              key={status.key || status.label}
              className="relative h-9 overflow-hidden rounded-md border border-black/[0.04] bg-white"
              aria-label={`${status.label}: ${status.count}`}
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-md ${styles.bar}`}
                aria-hidden="true"
                style={{ width: fillWidth }}
              />
              <div className="relative flex h-full items-center gap-3 px-3">
                <span className={`flex size-6 items-center justify-center rounded-md ${styles.icon}`} aria-hidden="true">
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#555555]">
                  {status.label}
                </span>
                <span
                  className={`text-xs font-bold ${status.tone === "green" ? "text-[#10B981]" : status.tone === "red" ? "text-[#EF4444]" : "text-[#007AFF]"}`}
                >
                  {status.count}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {isLoading ? (
        <p className="mt-4 text-xs font-semibold text-[#86868B]">Loading real pipeline counts...</p>
      ) : null}
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

  return (
    <DashboardPanel title="By Industry" className="min-h-[365px]">
      <ul className="mt-5 space-y-2" aria-label="Assessment count by industry">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
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
          industries.map((industry) => (
            <li
              key={industry.label}
              className="relative h-9 overflow-hidden rounded-md border border-black/[0.04] bg-white"
              aria-label={`${industry.label}: ${industry.count}`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-[#EAF3FF]"
                aria-hidden="true"
                style={{ width: `${(industry.count / maxCount) * 100}%` }}
              />
              <div className="relative flex h-full items-center gap-3 px-3">
                <span className="flex size-6 items-center justify-center rounded-md bg-[#007AFF] text-white" aria-hidden="true">
                  <Building2 size={13} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#555555]">
                  {industry.label}
                </span>
                <span className="text-xs font-bold text-[#007AFF]">{industry.count}</span>
              </div>
            </li>
          ))}
      </ul>
    </DashboardPanel>
  );
}

function AssessmentTrendCard({ dashboardViewData }: DashboardQueryProps) {
  const trend = dashboardViewData.assessmentTrend;

  return (
    <DashboardPanel title="New Assessments - Last 6 Months" className="min-h-[270px]">
      <AssessmentTrendChart data={trend} />
    </DashboardPanel>
  );
}

function WeightedPipelineCard({ dashboardQuery, dashboardViewData }: DashboardQueryProps) {
  const { isLoading } = dashboardQuery;
  const weightedPipelineStages = dashboardViewData.weightedPipelineStages;
  const weightedPipelineBaseCurrencyValue = dashboardViewData.weightedPipelineBaseCurrencyValue;

  return (
    <DashboardPanel title="Weighted Pipeline Value" className="min-h-[264px]">
      <p className="mt-10 text-[32px] leading-none font-bold">
        {isLoading ? "--" : formatCompactBaseCurrency(weightedPipelineBaseCurrencyValue)}
      </p>
      <p className="mt-2 text-xs font-semibold text-[#86868B]">
        Open deals x stage-probability using live pipeline counts and average assessment cost.
      </p>
      <ul className="mt-6 space-y-3" aria-label="Weighted pipeline stages">
        {weightedPipelineStages.map((stage) => {
          const weightLabel = `${stage.weightPercent}% weight`;

          return (
            <li
              key={stage.key || stage.label}
              className="flex items-center justify-between gap-4 text-xs font-bold"
            >
              <span className="text-[#86868B]">{stage.label}</span>
              <span className="text-[#171717]">
                {weightLabel} - {stage.count} deals
              </span>
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}

function PipelineConversionCard({ dashboardViewData }: DashboardQueryProps) {
  const conversion = dashboardViewData.pipelineConversion;

  return (
    <DashboardPanel title="Pipeline Conversion (of Active + Won Deals)" className="mt-5 min-h-[250px]">
      <ul className="mt-7 space-y-4" aria-label="Pipeline conversion percentages">
        {conversion.map((item) => (
          <li
            key={item.label}
            className="grid grid-cols-[140px_minmax(0,1fr)_62px] items-center gap-4 text-xs font-bold"
            aria-label={`${item.label}: ${item.percent}%, ${item.deals}`}
          >
            <span className="truncate text-[#86868B]">{item.label}</span>
            <div className="relative h-5 overflow-hidden rounded-full bg-[#F0F0F0]" aria-hidden="true">
              <div
                className="flex h-full items-center justify-end rounded-full bg-[#007AFF] pr-2 text-[10px] font-bold text-white"
                style={{ width: `${item.percent}%` }}
              >
                {item.percent}%
              </div>
            </div>
            <span className="text-right text-[#A1A1AA]">{item.deals}</span>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function CompanySizeCard({ dashboardViewData }: DashboardQueryProps) {
  const distribution = dashboardViewData.companySizeDistribution;
  const maxValue = dashboardViewData.companySizeAxisMax;
  const ticks = dashboardViewData.companySizeTicks;

  return (
    <DashboardPanel title="By Company Size" className="min-h-[310px]">
      <div className="mt-7 grid grid-cols-[112px_minmax(0,1fr)] gap-x-5">
        <div className="space-y-4 pt-1">
          {distribution.map((item) => (
            <p
              key={item.label}
              className="text-right text-[11px] leading-3 font-semibold whitespace-pre-line text-[#86868B]"
            >
              {item.label}
            </p>
          ))}
        </div>
        <div
          className="relative min-h-[190px] border-l border-black/[0.05] pl-0"
          role="img"
          aria-label={`Company size distribution across ${distribution.length} groups`}
        >
          <ChartGrid columns={4} />
          <div className="relative z-10 space-y-[21px] pt-2" aria-hidden="true">
            {distribution.map((item) => (
              <div
                key={item.label}
                className="h-3 rounded-r-full bg-[#007AFF]"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            ))}
          </div>
          {distribution.length === 0 ? (
            <p className="relative z-10 pt-2 pl-4 text-xs font-semibold text-[#86868B]">
              No company size data available yet.
            </p>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 text-center text-[11px] font-semibold text-[#C1C7D0]" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

function SelectedProcessesCard({ dashboardViewData }: DashboardQueryProps) {
  const processes = dashboardViewData.selectedProcesses;
  const maxValue = dashboardViewData.selectedProcessesAxisMax;
  const ticks = dashboardViewData.selectedProcessesTicks;

  return (
    <DashboardPanel
      title="Most-Selected Processes (Signal for Product Priorities)"
      className="min-h-[310px]"
    >
      <div className="mt-7 grid grid-cols-[150px_minmax(0,1fr)] gap-x-5">
        <div className="space-y-[9px] pt-1">
          {processes.map((process) => (
            <p
              key={process.label}
              className="text-right text-[11px] leading-3 font-semibold whitespace-pre-line text-[#86868B]"
            >
              {process.label}
            </p>
          ))}
        </div>
        <div
          className="relative min-h-[190px] border-l border-black/[0.05]"
          role="img"
          aria-label={`Most-selected process distribution across ${processes.length} processes`}
        >
          <ChartGrid columns={4} />
          <div className="relative z-10 space-y-[16px] pt-1" aria-hidden="true">
            {processes.map((process) => (
              <div
                key={process.label}
                className="h-3 rounded-r-full bg-[#10B981]"
                style={{ width: `${(process.value / maxValue) * 100}%` }}
              />
            ))}
          </div>
          {processes.length === 0 ? (
            <p className="relative z-10 pt-2 pl-4 text-xs font-semibold text-[#86868B]">
              No selected process data available yet.
            </p>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 text-center text-[11px] font-semibold text-[#C1C7D0]" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

function RecentAssessmentsList({ dashboardQuery }: DashboardQueryProps) {
  const { data, error, isLoading } = dashboardQuery;
  const assessments = data?.recentAssessments ?? [];
  const errorMessage = error ? getErrorMessage(error) : "";

  return (
    <section className="mt-7" aria-labelledby="recent-assessments-heading">
      <header className="mb-[18px] flex items-center justify-between gap-4">
        <h2
          id="recent-assessments-heading"
          className="text-[10px] leading-none font-bold tracking-[0.12em] text-[#86868B] uppercase"
        >
          Recently Updated
        </h2>
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1 text-xs leading-none font-bold text-[#007AFF]"
          aria-label="View all assessments"
        >
          View all
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </header>

      <div
        className={`hidden ${recentAssessmentGridClassName} gap-4 px-5 pb-2 text-[9px] leading-none font-bold tracking-[0.1em] text-[#A1A1AA] uppercase xl:grid`}
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
                className={`grid min-h-[60px] gap-4 rounded-md border border-black/[0.08] bg-white px-5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${recentAssessmentGridClassName} xl:items-center`}
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
                className={`recent-assessment-card grid min-h-[60px] gap-4 rounded-md border border-black/[0.08] bg-white px-5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${recentAssessmentGridClassName} xl:items-center`}
                aria-label={`Open ${assessment.company} in assessments`}
              >
                <div>
                  <p className="truncate text-sm leading-[1.2] font-bold text-[#171717]">{assessment.company}</p>
                  <p className="mt-1 truncate text-xs leading-[1.2] font-semibold text-[#86868B]">{assessment.contact}</p>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#555555]">
                  <IndustryIcon industry={assessment.industry} />
                  <span className="min-w-0 truncate">{assessment.industry}</span>
                </div>
                <p
                  className={`text-xs font-bold ${assessment.score === "--" ? "text-[#C1C7D0]" : "text-[#007AFF]"}`}
                >
                  {assessment.score}
                </p>
                <p className="text-xs font-bold text-[#555555]">{totalCostValue}</p>
                <p
                  className={`text-xs font-bold ${assessment.savings === "--" ? "text-[#10B981]" : "text-[#10B981]"}`}
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
                    <p className="truncate text-xs leading-[1.2] font-bold text-[#555555]">
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
                <StatusPill label={assessment.status} tone={statusTone} />
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

function IndustryIcon({ industry }: { industry: string }) {
  const industryKey = industry.trim().toLowerCase().replace(/\s+/g, " ");
  const iconConfig = industryIconStyles[industryKey];
  const Icon = iconConfig?.icon || LayoutGrid;

  return (
    <Icon
      size={iconConfig?.size || 12}
      strokeWidth={1.75}
      className={`shrink-0 ${iconConfig?.className || "text-[#86868B]"}`}
      aria-hidden="true"
    />
  );
}

function ChartGrid({ columns }: { columns: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <span key={index} className="border-r border-dashed border-black/[0.06]" />
      ))}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: keyof typeof statusStyles }) {
  const styles = statusStyles[tone];

  return (
    <span
      aria-label={`Status: ${label}`}
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold ${styles.chip}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function getStatusTone(status: string, statusKey = ""): keyof typeof statusStyles {
  const normalizedStatusKey = normalizeStatusKey(statusKey);

  if (normalizedStatusKey === "closed-won") {
    return "green";
  }

  if (normalizedStatusKey === "closed-lost") {
    return "red";
  }

  if (status === "Due Diligence" || status === "Results Ready") {
    return "blueLight";
  }

  if (status === "Processes In Progress") {
    return "gray";
  }

  return status === "Draft" ? "gray" : "blue";
}

function getRecentAssessmentDateTime(assessment: { createdAt?: string; updatedAt?: string }) {
  const date = new Date(assessment.updatedAt || assessment.createdAt || "");

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load dashboard pipeline status";
}

function DashboardPanel({
  ariaLabel,
  children,
  className = "",
  title,
}: {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const titleId = useId();

  return (
    <section
      aria-label={title ? undefined : ariaLabel}
      aria-labelledby={title ? titleId : undefined}
      className={`min-w-0 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}
    >
      {title ? (
        <h2
          id={titleId}
          className="text-[11px] font-bold tracking-[0.12em] text-[#86868B] uppercase"
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
