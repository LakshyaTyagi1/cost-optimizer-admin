"use client";

import type {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
} from "react";
import {
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  Home,
  Landmark,
  LayoutGrid,
  Percent,
  RotateCcw,
  Search,
  Shield,
  ShoppingBag,
  Stethoscope,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { AssessmentMobileMetric as MobileMetric } from "@/features/assessments/components/assessment-mobile-metric";
import { AssessmentStatusPill } from "@/features/assessments/components/assessment-status-pill";
import type {
  AssessmentSummary,
  SortDirection,
  SortKey,
} from "@/features/assessments/view-model";
import { formatDate } from "@/features/assessments/utils/formatters";
import { getStatusTone } from "@/features/assessments/utils/status";

const tableHeaderTextClass = "text-[10px] leading-[15px] font-semibold text-[#86868B]";
const tableHeaderTextStyle: CSSProperties = {
  color: "#86868B",
  fontFamily: "var(--font-inter), Inter, Arial, Helvetica, sans-serif",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.82px",
  lineHeight: "15px",
  textTransform: "uppercase",
};

const filterShellClassName =
  "h-10 rounded-md border border-[#DCE8F8] bg-white text-sm font-semibold text-[#171717] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#BBD6FF]";

const industryIconStyles: Record<string, { icon: LucideIcon }> = {
  Automotive: { icon: Car },
  Banking: { icon: Landmark },
  Healthcare: { icon: Stethoscope },
  Insurance: { icon: Shield },
  "Public Sector": { icon: Building2 },
  "Real Estate": { icon: Home },
  Retail: { icon: ShoppingBag },
};

type AssessmentsTableProps = {
  activePage: number;
  errorMessage: string;
  firstRowIndex: number;
  fromDateFilter: string;
  hasActiveFilters: boolean;
  highlightedAssessmentKey: string;
  industryFilter: string;
  industryOptions: string[];
  isAssessmentHighlighted: (
    assessment: AssessmentSummary,
    highlightedAssessmentKey: string,
  ) => boolean;
  isLoading: boolean;
  lastRowIndex: number;
  minimumScoreFilter: string;
  onFromDateFilterChange: (value: string) => void;
  onIndustryFilterChange: (value: string) => void;
  onMinimumScoreFilterChange: (value: string) => void;
  onOpenAssessment: (assessment: AssessmentSummary) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onSearchQueryChange: (value: string) => void;
  onSort: (sortKey: SortKey) => void;
  onStatusFilterChange: (value: string) => void;
  onToDateFilterChange: (value: string) => void;
  pageCount: number;
  pagedAssessments: AssessmentSummary[];
  searchQuery: string;
  sortDirection: SortDirection;
  sortKey: SortKey;
  statusFilter: string;
  statusOptions: string[];
  toDateFilter: string;
  totalAssessments: number;
  visibleAssessmentCount: number;
};

export function AssessmentsTable({
  activePage,
  errorMessage,
  firstRowIndex,
  fromDateFilter,
  hasActiveFilters,
  highlightedAssessmentKey,
  industryFilter,
  industryOptions,
  isAssessmentHighlighted,
  isLoading,
  lastRowIndex,
  minimumScoreFilter,
  onFromDateFilterChange,
  onIndustryFilterChange,
  onMinimumScoreFilterChange,
  onOpenAssessment,
  onPageChange,
  onResetFilters,
  onSearchQueryChange,
  onSort,
  onStatusFilterChange,
  onToDateFilterChange,
  pageCount,
  pagedAssessments,
  searchQuery,
  sortDirection,
  sortKey,
  statusFilter,
  statusOptions,
  toDateFilter,
  totalAssessments,
  visibleAssessmentCount,
}: AssessmentsTableProps) {
  return (
    <section className="mt-6 flex min-h-0 flex-1 flex-col lg:mt-8 lg:overflow-hidden" aria-label="Assessments table">
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.25fr)_minmax(128px,0.8fr)_minmax(118px,0.72fr)_minmax(84px,0.48fr)_minmax(124px,0.68fr)_18px_minmax(124px,0.68fr)_max-content] mb-[13px]">
        <SearchInput value={searchQuery} onChange={onSearchQueryChange} />
        <FilterSelect
          ariaLabel="Filter by industry"
          value={industryFilter}
          onChange={onIndustryFilterChange}
          className="w-full"
        >
          <option value="all">All industries</option>
          {industryOptions.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          ariaLabel="Filter by status"
          value={statusFilter}
          onChange={onStatusFilterChange}
          className="w-full"
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </FilterSelect>
        <MetricFilterInput
          value={minimumScoreFilter}
          onChange={onMinimumScoreFilterChange}
        />
        <DateInput
          ariaLabel="Updated from date"
          value={fromDateFilter}
          onChange={onFromDateFilterChange}
        />
        <span className="hidden h-10 items-center px-1 text-xs font-bold text-[#8E9AAB] xl:flex">
          to
        </span>
        <DateInput
          ariaLabel="Updated to date"
          value={toDateFilter}
          onChange={onToDateFilterChange}
        />
        <button
          type="button"
          onClick={onResetFilters}
          disabled={!hasActiveFilters}
          className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-[#DCE8F8] bg-white px-3 text-sm font-bold text-[#555555] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] disabled:cursor-not-allowed disabled:text-[#A1A1AA] disabled:opacity-60 sm:col-span-2 xl:col-span-1 xl:w-auto"
          aria-label="Reset assessment filters"
        >
          <RotateCcw size={13} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex-1 overflow-auto">
          <div className="space-y-2 p-3 md:hidden">
            {isLoading ? <AssessmentMobileCardsSkeleton /> : null}

            {!isLoading && pagedAssessments.length === 0 ? (
              <div className="rounded-md border border-black/[0.08] bg-white px-4 py-8 text-center text-sm font-semibold text-[#86868B]">
                {errorMessage || "No assessments found."}
              </div>
            ) : null}

            {!isLoading
              ? pagedAssessments.map((assessment) => (
                <AssessmentMobileCard
                  key={assessment.id}
                  assessment={assessment}
                  isHighlighted={isAssessmentHighlighted(
                    assessment,
                    highlightedAssessmentKey,
                  )}
                  onOpen={() => onOpenAssessment(assessment)}
                />
              ))
              : null}
          </div>

          <table className="hidden w-full min-w-[1170px] table-fixed border-collapse md:table">
            <colgroup>
              <col className="w-[294px]" />
              <col className="w-[139px]" />
              <col className="w-[105px]" />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
              <col className="w-[115px]" />
              <col className="w-[210px]" />
              <col className="w-[47px]" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="h-9 border-b border-black/[0.08] bg-[#FAFAFA] text-left">
                <SortableHeader
                  active={sortKey === "company"}
                  direction={sortDirection}
                  label="Company"
                  onSort={() => onSort("company")}
                />
                <TableHeader label="Industry" />
                <SortableHeader
                  active={sortKey === "score"}
                  direction={sortDirection}
                  label="DI Score"
                  onSort={() => onSort("score")}
                />
                <SortableHeader
                  active={sortKey === "cost"}
                  direction={sortDirection}
                  label="Total Cost"
                  onSort={() => onSort("cost")}
                />
                <SortableHeader
                  active={sortKey === "savings"}
                  direction={sortDirection}
                  label="Savings"
                  onSort={() => onSort("savings")}
                />
                <TableHeader label="Last Updated" />
                <TableHeader label="Status" />
                <th className="w-12 px-4 align-middle" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <AssessmentRowsSkeleton /> : null}

              {!isLoading && pagedAssessments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="h-32 px-5 text-center text-sm font-semibold text-[#86868B]"
                  >
                    {errorMessage || "No assessments found."}
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? pagedAssessments.map((assessment) => (
                  <AssessmentRow
                    key={assessment.id}
                    assessment={assessment}
                    isHighlighted={isAssessmentHighlighted(
                      assessment,
                      highlightedAssessmentKey,
                    )}
                    onOpen={() => onOpenAssessment(assessment)}
                  />
                ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex min-h-[44px] shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] px-5 py-2 text-[11px] font-normal leading-[16.5px] tracking-[0.06px] text-[#86868B]">
          <span>
            {visibleAssessmentCount
              ? `Showing ${firstRowIndex}-${lastRowIndex} of ${visibleAssessmentCount} users`
              : "Showing 0 of 0"}
            {totalAssessments > visibleAssessmentCount
              ? ` (${totalAssessments} total submissions)`
              : ""}
          </span>
          <PaginationControls
            page={activePage}
            pageCount={pageCount}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </section>
  );
}

function AssessmentRow({
  assessment,
  isHighlighted,
  onOpen,
}: {
  assessment: AssessmentSummary;
  isHighlighted: boolean;
  onOpen: () => void;
}) {
  const statusTone = getStatusTone(assessment.status, assessment.statusKey);
  const totalCostValue = assessment.totalCostInSavedCurrency || assessment.cost;

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <tr
      className={`h-[58px] cursor-pointer border-b border-black/[0.05] transition focus:outline-none last:border-b-0 ${isHighlighted
          ? "assessment-highlight-flash hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
          : "hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
        }`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <td className="py-3 pr-6 pl-[60px]">
        <p className="max-w-[280px] truncate text-[13px] font-semibold leading-[19.5px] tracking-[-0.08px] text-[#000000]">
          {assessment.company}
        </p>
        <p className="max-w-[280px] truncate text-[11px] font-normal leading-[16.5px] tracking-[0.06px] text-[#86868B]">
          {assessment.contact}
        </p>
      </td>
      <td className="px-0 py-3">
        <div className="flex max-w-[160px] items-center gap-2 text-xs font-normal leading-[18px] text-[#555555]">
          <IndustryIcon industry={assessment.industry} />
          <span className="truncate">{assessment.industry}</span>
        </div>
      </td>
      <td className="px-0 py-3 text-xs font-semibold leading-[18px] text-[#007AFF]">
        <MetricValue value={assessment.score} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-xs font-normal leading-[18px] text-[#171717]">
        <MetricValue value={totalCostValue} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-xs font-medium leading-[18px] text-[#10B981]">
        <MetricValue value={assessment.savings} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-[11px] font-semibold text-[#555555]">
        <MetricValue value={formatDate(assessment.updatedAt)} mutedValue="--" />
      </td>
      <td className="px-0 py-3">
        <AssessmentStatusPill label={assessment.status} tone={statusTone} />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled
          onClick={(event) => event.stopPropagation()}
          title="Delete/archive requires a backend admin endpoint."
          className="inline-flex size-7 cursor-not-allowed items-center justify-center rounded-md text-[#8E9AAB] opacity-70"
          aria-label={`Delete ${assessment.company}`}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function AssessmentMobileCard({
  assessment,
  isHighlighted,
  onOpen,
}: {
  assessment: AssessmentSummary;
  isHighlighted: boolean;
  onOpen: () => void;
}) {
  const statusTone = getStatusTone(assessment.status, assessment.statusKey);
  const totalCostValue = assessment.totalCostInSavedCurrency || assessment.cost;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-md border border-black/[0.08] bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:border-[#007AFF]/25 hover:bg-[#FAFCFF] ${isHighlighted ? "assessment-highlight-flash" : ""
        }`}
      aria-label={`Open ${assessment.company}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm leading-5 font-bold text-[#171717]">
            {assessment.company}
          </p>
          <p className="mt-1 break-words text-xs leading-4 font-semibold text-[#8E9AAB]">
            {assessment.contact}
          </p>
        </div>
        <AssessmentStatusPill label={assessment.status} tone={statusTone} />
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-2 text-xs font-semibold text-[#555555]">
        <IndustryIcon industry={assessment.industry} />
        <span className="min-w-0 truncate">{assessment.industry}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MobileMetric label="DI Score" tone="blue" value={assessment.score} />
        <MobileMetric label="Total Cost" value={totalCostValue} />
        <MobileMetric label="Savings" tone="green" value={assessment.savings} />
        <MobileMetric label="Submissions" value={String(assessment.assessments.length)} />
      </div>
    </button>
  );
}

function AssessmentMobileCardsSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading assessments">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-md border border-black/[0.08] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
        >
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-black/[0.06]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-black/[0.06]" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((__, itemIndex) => (
              <div key={itemIndex} className="h-12 animate-pulse rounded-md bg-black/[0.04]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssessmentRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <tr key={index} className="h-[58px] border-b border-black/[0.05]">
          <td className="py-3 pr-6 pl-[60px]">
            <div className="h-4 max-w-[280px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 max-w-[150px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 max-w-[88px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 max-w-[104px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 max-w-[104px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 max-w-[104px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 max-w-[180px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-4 py-3">
            <div className="ml-auto h-4 w-3 animate-pulse rounded-full bg-black/[0.04]" />
          </td>
        </tr>
      ))}
    </>
  );
}

function SearchInput({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`flex min-w-0 items-center gap-2 px-3 ${filterShellClassName}`}>
      <Search size={13} className="text-[#A1A1AA]" aria-hidden="true" />
      <input
        aria-label="Search company, contact, or region"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[19.5px] font-normal tracking-[-0.08px] text-[#171717] outline-none placeholder:text-[#17171780] focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
        placeholder="Search company, contact, region..."
        type="search"
      />
    </label>
  );
}

function FilterSelect({
  ariaLabel,
  children,
  className = "",
  onChange,
  value,
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`relative block min-w-0 ${filterShellClassName} ${className}`}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full cursor-pointer appearance-none rounded-md bg-transparent pr-9 pl-3 text-sm font-semibold text-[#171717] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#007AFF]"
        aria-hidden="true"
      />
    </label>
  );
}

function MetricFilterInput({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`flex min-w-0 items-center gap-2 px-3 ${filterShellClassName}`}>
      <Percent size={13} className="text-[#007AFF]" aria-hidden="true" />
      <input
        aria-label="Minimum DI score"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#171717] outline-none placeholder:text-[#A1A1AA] focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
        inputMode="numeric"
        placeholder="DI min"
      />
    </label>
  );
}

function DateInput({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`flex min-w-0 items-center gap-2 px-3 ${filterShellClassName}`}>
      <CalendarDays size={13} className="text-[#007AFF]" aria-hidden="true" />
      <input
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-semibold text-[#171717] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
        type="date"
      />
    </label>
  );
}

function SortableHeader({
  active,
  direction,
  label,
  onSort,
}: {
  active: boolean;
  direction: SortDirection;
  label: string;
  onSort: () => void;
}) {
  const headerPadding = label === "Company" ? "py-0 pr-0 pl-[60px]" : "px-0 py-0";

  return (
    <th className={`${headerPadding} align-middle`}>
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex h-9 items-center gap-[6px] whitespace-nowrap ${tableHeaderTextClass}`}
        style={tableHeaderTextStyle}
      >
        {label}
        <SortGlyph reversed={active && direction === "desc"} />
      </button>
    </th>
  );
}

function TableHeader({ label }: { label: string }) {
  return (
    <th className="px-0 py-0 align-middle">
      <span
        className={`inline-flex h-9 items-center whitespace-nowrap ${tableHeaderTextClass}`}
        style={tableHeaderTextStyle}
      >
        {label}
      </span>
    </th>
  );
}

function SortGlyph({ reversed }: { reversed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-[9px] shrink-0 transition-transform ${reversed ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 9 9"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.25 6L6.75 7.5L5.25 6" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
      <path d="M6.75 7.5V1.5" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
      <path d="M1.5 3L3 1.5L4.5 3" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
      <path d="M3 1.5V7.5" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
    </svg>
  );
}

function MetricValue({ mutedValue, value }: { mutedValue: string; value: string }) {
  if (!value || value === mutedValue) {
    return <span className="text-[#A1A1AA]">{mutedValue}</span>;
  }

  return <span>{value}</span>;
}

function IndustryIcon({ industry }: { industry: string }) {
  const Icon = industryIconStyles[industry]?.icon || LayoutGrid;

  return <Icon size={12} className="shrink-0 text-[#86868B]" aria-hidden="true" />;
}

function PaginationControls({
  onPageChange,
  page,
  pageCount,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
}) {
  const pages = getVisiblePages(page, pageCount);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
        aria-label="Previous page"
      >
        &lt;
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${item === page
              ? "border-[#007AFF] bg-[#007AFF] text-white"
              : "border-black/[0.08] bg-white text-[#555555]"
            }`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
        aria-label="Next page"
      >
        &gt;
      </button>
    </div>
  );
}

function getVisiblePages(page: number, pageCount: number) {
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
