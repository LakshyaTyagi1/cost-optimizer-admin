"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronUp,
  Home,
  Landmark,
  LayoutGrid,
  Percent,
  RotateCcw,
  Search,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
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
  "h-11 rounded-md border border-[#DCE8F8] bg-white text-sm font-semibold text-[#171717] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#BBD6FF] focus-within:border-[#007AFF]/50 focus-within:ring-2 focus-within:ring-[#007AFF]/15 sm:h-10";

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const advancedFiltersRef = useRef<HTMLDivElement>(null);
  const moreFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const hiddenFilterCount = [
    industryFilter !== "all" ? industryFilter : "",
    statusFilter !== "all" ? statusFilter : "",
    minimumScoreFilter.trim(),
    fromDateFilter,
    toDateFilter,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!showAdvancedFilters) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (
        !advancedFiltersRef.current?.contains(event.target) &&
        !moreFiltersButtonRef.current?.contains(event.target)
      ) {
        setShowAdvancedFilters(false);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setShowAdvancedFilters(false);
      if (moreFiltersButtonRef.current?.getClientRects().length) {
        moreFiltersButtonRef.current.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAdvancedFilters]);

  function handleResetFilters() {
    onResetFilters();
    setShowAdvancedFilters(false);
  }

  return (
    <section className="mt-4 max-sm:flex max-sm:flex-1 max-sm:flex-col sm:mt-6 lg:mt-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden" aria-label="Assessments table">
      <div className="@container/assessment-filters mb-3 space-y-2 sm:mb-[13px]">
        <div className="relative grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,0.55fr)] @min-[980px]/assessment-filters:grid-cols-[minmax(170px,1.2fr)_minmax(110px,0.75fr)_minmax(110px,0.75fr)_minmax(78px,0.45fr)_minmax(132px,0.75fr)_minmax(132px,0.75fr)_40px]">
          <SearchInput
            className="@min-[980px]/assessment-filters:col-span-1"
            value={searchQuery}
            onChange={onSearchQueryChange}
          />

          <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2 @min-[980px]/assessment-filters:hidden">
            <button
              ref={moreFiltersButtonRef}
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-md border border-[#DCE8F8] bg-white px-3 text-sm font-semibold text-[#555555] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] sm:h-10 sm:text-xs"
              aria-controls="assessment-advanced-filters"
              aria-expanded={showAdvancedFilters}
            >
              <SlidersHorizontal size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate">More filters</span>
              {hiddenFilterCount ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[10px] font-bold text-[#007AFF]">
                  {hiddenFilterCount}
                  <span className="sr-only"> active filters</span>
                </span>
              ) : null}
              {showAdvancedFilters ? (
                <ChevronUp size={13} className="shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown size={13} className="shrink-0" aria-hidden="true" />
              )}
            </button>
            <ResetFiltersButton
              disabled={!hasActiveFilters}
              onClick={handleResetFilters}
            />
          </div>

          <div
            ref={advancedFiltersRef}
            id="assessment-advanced-filters"
            className={`${showAdvancedFilters ? "grid" : "hidden"} absolute top-[calc(100%+0.5rem)] right-0 z-20 max-h-[min(60vh,24rem)] w-full max-w-[620px] grid-cols-1 gap-2 overflow-y-auto overscroll-contain rounded-md border border-[#DCE8F8] bg-white p-3 shadow-[0_16px_36px_rgba(15,23,42,0.14)] min-[380px]:grid-cols-2 @min-[640px]/assessment-filters:grid-cols-3 @min-[980px]/assessment-filters:static @min-[980px]/assessment-filters:contents`}
          >
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
              className="min-[380px]:col-span-2 @min-[640px]/assessment-filters:col-span-1"
              value={minimumScoreFilter}
              onChange={onMinimumScoreFilterChange}
            />
            <DateInput
              ariaLabel="Updated from date"
              className="min-[380px]:col-span-2 @min-[640px]/assessment-filters:col-span-1"
              value={fromDateFilter}
              onChange={onFromDateFilterChange}
            />
            <DateInput
              ariaLabel="Updated to date"
              className="min-[380px]:col-span-2 @min-[640px]/assessment-filters:col-span-1"
              value={toDateFilter}
              onChange={onToDateFilterChange}
            />
          </div>

          <div className="hidden @min-[980px]/assessment-filters:block">
            <ResetFiltersButton
              disabled={!hasActiveFilters}
              onClick={handleResetFilters}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-visible bg-transparent sm:min-h-0 sm:overflow-hidden sm:rounded-md sm:border sm:border-black/[0.08] sm:bg-white sm:shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <TabletSortToolbar
          direction={sortDirection}
          onSort={onSort}
          sortKey={sortKey}
        />
        <div className="pb-3 sm:pb-0 lg:flex-1 lg:overflow-auto">
          <div className="grid grid-cols-1 gap-2.5 p-0 sm:gap-3 sm:p-3 lg:hidden">
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

          <table className="hidden w-full min-w-[700px] table-fixed border-collapse lg:table min-[1460px]:min-w-[1170px]">
            <colgroup>
              <col className="w-[32%] min-[1460px]:w-[294px]" />
              <col className="hidden min-[1460px]:table-column min-[1460px]:w-[139px]" />
              <col className="w-[10%] min-[1460px]:w-[105px]" />
              <col className="w-[14%] min-[1460px]:w-[130px]" />
              <col className="w-[14%] min-[1460px]:w-[130px]" />
              <col className="hidden min-[1460px]:table-column min-[1460px]:w-[115px]" />
              <col className="w-[23%] min-[1460px]:w-[210px]" />
              <col className="w-[7%] min-[1460px]:w-[47px]" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="h-9 border-b border-black/[0.08] bg-[#FAFAFA] text-left">
                <SortableHeader
                  active={sortKey === "company"}
                  direction={sortDirection}
                  label="Company"
                  onSort={() => onSort("company")}
                />
                <TableHeader label="Industry" className="hidden min-[1460px]:table-cell" />
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
                <TableHeader label="Last Updated" className="hidden min-[1460px]:table-cell" />
                <TableHeader label="Status" />
                <th className="w-12 px-1 align-middle min-[1460px]:px-4" aria-label="Actions" />
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

        <div className="mt-auto flex min-h-[44px] shrink-0 flex-col items-center justify-center gap-2 border-t border-black/[0.08] px-3 py-3 text-center text-xs leading-[18px] font-normal tracking-[0.06px] text-[#86868B] sm:mt-0 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-3 sm:px-5 sm:py-2 sm:text-left sm:text-[11px] sm:leading-[16.5px]">
          <span className="min-w-0">
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
      className={`h-[68px] cursor-pointer border-b border-black/[0.05] transition focus:outline-none last:border-b-0 min-[1460px]:h-[58px] ${isHighlighted
          ? "assessment-highlight-flash hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
          : "hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
        }`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <td className="py-3 pr-4 pl-5 min-[1460px]:pr-6 min-[1460px]:pl-[60px]">
        <p className="max-w-[280px] truncate text-[13px] font-semibold leading-[19.5px] tracking-[-0.08px] text-[#000000]">
          {assessment.company}
        </p>
        <p className="max-w-[280px] truncate text-[11px] font-normal leading-[16.5px] tracking-[0.06px] text-[#86868B]">
          {assessment.contact}
        </p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] leading-[15px] font-medium text-[#86868B] min-[1460px]:hidden">
          <IndustryIcon industry={assessment.industry} />
          <span className="truncate">{assessment.industry}</span>
          <span aria-hidden="true">•</span>
          <span className="shrink-0">{formatDate(assessment.updatedAt)}</span>
        </div>
      </td>
      <td className="hidden px-0 py-3 min-[1460px]:table-cell">
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
      <td className="hidden px-0 py-3 text-[11px] font-semibold text-[#555555] min-[1460px]:table-cell">
        <MetricValue value={formatDate(assessment.updatedAt)} mutedValue="--" />
      </td>
      <td className="px-0 py-3">
        <span className="whitespace-nowrap">
          <AssessmentStatusPill label={assessment.status} tone={statusTone} />
        </span>
      </td>
      <td className="px-1 py-3 text-right min-[1460px]:px-4">
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
      className={`w-full rounded-lg border border-[#E1E7EF] bg-white p-3 text-left shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition hover:border-[#007AFF]/25 hover:bg-[#FAFCFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/25 sm:rounded-md sm:border-black/[0.08] sm:p-4 sm:shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${isHighlighted ? "assessment-highlight-flash" : ""
        }`}
      aria-label={`Open ${assessment.company}`}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_7rem] items-start gap-x-2 gap-y-0 min-[360px]:grid-cols-[minmax(0,1fr)_9rem] sm:block">
        <div className="contents sm:block">
          <p className="col-start-1 row-start-1 min-w-0 self-start break-words text-sm leading-5 font-semibold text-[#171717] sm:font-bold">
            {assessment.company}
          </p>
          <p className="col-start-1 row-start-2 min-w-0 self-start break-words text-xs leading-4 font-medium text-[#8E9AAB] sm:mt-1 sm:font-semibold">
            {assessment.contact}
          </p>
        </div>

        <div className="contents sm:hidden">
          <span className="col-start-2 row-start-1 flex w-full min-w-0 max-w-full shrink-0 self-start justify-end whitespace-normal [&>span]:max-w-full [&>span]:justify-end [&>span]:gap-1 [&>span]:px-2 [&>span]:py-1 [&>span]:text-right [&>span]:text-[10px] [&>span]:leading-[14px] [&>span]:whitespace-normal [&>span>span]:shrink-0">
            <AssessmentStatusPill label={assessment.status} tone={statusTone} />
          </span>
          <span className="col-start-2 row-start-2 flex w-full min-w-0 self-start items-center justify-end gap-1.5 text-xs leading-4 font-medium text-[#555555]">
            <IndustryIcon industry={assessment.industry} />
            <span className="min-w-0 truncate text-right">{assessment.industry}</span>
          </span>
        </div>

        <div className="mt-3 hidden min-w-0 items-center justify-between gap-2 sm:flex">
          <span className="flex min-w-0 items-center gap-2 text-xs leading-[18px] font-semibold text-[#555555]">
            <IndustryIcon industry={assessment.industry} />
            <span className="min-w-0 truncate">{assessment.industry}</span>
          </span>
          <span className="max-w-full shrink-0 whitespace-nowrap">
            <AssessmentStatusPill label={assessment.status} tone={statusTone} />
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-stretch gap-1.5 sm:mt-4 sm:grid sm:grid-cols-4 sm:gap-3">
        <MobileMetric className="flex-[0.75_1_0%]" compact label="DI Score" tone="blue" value={assessment.score} />
        <MobileMetric className="flex-[1.125_1_0%]" compact label="Total Cost" value={totalCostValue} />
        <MobileMetric className="flex-[1.125_1_0%]" compact label="Savings" tone="green" value={assessment.savings} />
        <MobileMetric className="hidden sm:block" compact label="Submissions" value={String(assessment.assessments.length)} />
      </div>
    </button>
  );
}

function AssessmentMobileCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:gap-3" aria-label="Loading assessments">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-[#E1E7EF] bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:rounded-md sm:border-black/[0.08] sm:p-4 sm:shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
        >
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-black/[0.06]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-black/[0.06]" />
          <div className="mt-3 flex gap-1.5 sm:grid sm:grid-cols-4 sm:gap-3">
            {Array.from({ length: 4 }).map((__, itemIndex) => (
              <div
                key={itemIndex}
                className={`${itemIndex === 3
                  ? "hidden sm:block"
                  : itemIndex === 0
                    ? "flex-[0.75_1_0%]"
                    : "flex-[1.125_1_0%]"
                  } h-10 animate-pulse rounded-md bg-black/[0.04] sm:h-12`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabletSortToolbar({
  direction,
  onSort,
  sortKey,
}: {
  direction: SortDirection;
  onSort: (sortKey: SortKey) => void;
  sortKey: SortKey;
}) {
  const nextDirectionLabel = direction === "asc" ? "descending" : "ascending";

  return (
    <div className="hidden min-h-12 shrink-0 items-center justify-between gap-3 border-b border-black/[0.08] bg-[#FAFAFA] px-3 py-2 md:flex lg:hidden">
      <span className="text-[10px] leading-[15px] font-semibold tracking-[0.12em] text-[#86868B] uppercase">
        Sort assessments
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <label className="relative block min-w-0">
          <span className="sr-only">Sort assessments by</span>
          <select
            aria-label="Sort assessments by"
            value={sortKey}
            onChange={(event) => onSort(event.target.value as SortKey)}
            className="h-8 min-w-[150px] cursor-pointer appearance-none rounded-md border border-[#DCE8F8] bg-white pr-8 pl-3 text-xs font-semibold text-[#171717] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
          >
            <option value="company">Company</option>
            <option value="score">DI score</option>
            <option value="cost">Total cost</option>
            <option value="savings">Savings</option>
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[#007AFF]"
            aria-hidden="true"
          />
        </label>
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#DCE8F8] bg-white px-2.5 text-xs font-semibold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF]"
          aria-label={`Sort ${nextDirectionLabel}`}
          title={`Sort ${nextDirectionLabel}`}
        >
          {direction === "asc" ? (
            <ArrowUp size={13} aria-hidden="true" />
          ) : (
            <ArrowDown size={13} aria-hidden="true" />
          )}
          <span>{direction === "asc" ? "Ascending" : "Descending"}</span>
        </button>
      </div>
    </div>
  );
}

function AssessmentRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <tr key={index} className="h-[68px] border-b border-black/[0.05] min-[1460px]:h-[58px]">
          <td className="py-3 pr-4 pl-5 min-[1460px]:pr-6 min-[1460px]:pl-[60px]">
            <div className="h-4 max-w-[280px] animate-pulse rounded-full bg-black/[0.06]" />
            <div className="mt-2 h-2.5 max-w-[170px] animate-pulse rounded-full bg-black/[0.05] min-[1460px]:hidden" />
          </td>
          <td className="hidden px-0 py-3 min-[1460px]:table-cell">
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
          <td className="hidden px-0 py-3 min-[1460px]:table-cell">
            <div className="h-4 max-w-[104px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 max-w-[180px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-1 py-3 min-[1460px]:px-4">
            <div className="ml-auto h-4 w-3 animate-pulse rounded-full bg-black/[0.04]" />
          </td>
        </tr>
      ))}
    </>
  );
}

function SearchInput({
  className = "",
  onChange,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`flex min-w-0 items-center gap-2 px-3 ${filterShellClassName} ${className}`}>
      <Search size={13} className="size-[15px] text-[#A1A1AA] sm:size-[13px]" aria-hidden="true" />
      <input
        aria-label="Search company, contact, or region"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-base leading-6 font-normal tracking-[-0.08px] text-[#171717] outline-none placeholder:text-[#17171780] focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 sm:text-[13px] sm:leading-[19.5px]"
        placeholder="Search assessments"
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
        className="h-full w-full cursor-pointer appearance-none rounded-md bg-transparent pr-9 pl-3 text-base font-semibold text-[#171717] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 sm:text-sm"
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
  className = "",
  onChange,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`flex min-w-0 items-center gap-2 px-3 ${filterShellClassName} ${className}`}>
      <Percent size={13} className="text-[#007AFF]" aria-hidden="true" />
      <input
        aria-label="Minimum DI score"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#171717] outline-none placeholder:text-[#A1A1AA] focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 sm:text-sm"
        inputMode="numeric"
        placeholder="DI min"
      />
    </label>
  );
}

function DateInput({
  ariaLabel,
  className = "",
  onChange,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`flex min-w-0 items-center gap-2 px-3 ${filterShellClassName} ${className}`}>
      <CalendarDays size={13} className="text-[#007AFF]" aria-hidden="true" />
      <input
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-base leading-6 font-semibold tracking-[-0.08px] text-[#171717] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 sm:text-[13px] sm:leading-[19.5px]"
        type="date"
      />
    </label>
  );
}

function ResetFiltersButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-11 items-center justify-center rounded-md border border-[#DCE8F8] bg-white text-[#555555] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] disabled:cursor-not-allowed disabled:text-[#A1A1AA] disabled:opacity-60 sm:size-10"
      aria-label="Reset assessment filters"
      title="Reset filters"
    >
      <RotateCcw size={14} aria-hidden="true" />
    </button>
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
  const headerPadding =
    label === "Company"
      ? "py-0 pr-0 pl-5 min-[1460px]:pl-[60px]"
      : "px-0 py-0";

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

function TableHeader({
  className = "",
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <th className={`px-0 py-0 align-middle ${className}`}>
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
  const mobilePages = getVisiblePages(page, pageCount, 3);
  const largerPages = getVisiblePages(page, pageCount, 5);

  return (
    <>
      <PaginationButtonSet
        className="flex sm:hidden"
        onPageChange={onPageChange}
        page={page}
        pageCount={pageCount}
        pages={mobilePages}
      />
      <PaginationButtonSet
        className="hidden sm:flex"
        onPageChange={onPageChange}
        page={page}
        pageCount={pageCount}
        pages={largerPages}
      />
    </>
  );
}

function PaginationButtonSet({
  className,
  onPageChange,
  page,
  pageCount,
  pages,
}: {
  className: string;
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
  pages: number[];
}) {
  return (
    <div className={`${className} items-center gap-1`}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex size-9 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0] sm:size-7"
        aria-label="Previous page"
      >
        &lt;
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          aria-current={item === page ? "page" : undefined}
          aria-label={`Page ${item}${item === page ? ", current page" : ""}`}
          className={`flex size-9 items-center justify-center rounded-md border text-xs font-bold sm:size-7 ${item === page
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
        className="flex size-9 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0] sm:size-7"
        aria-label="Next page"
      >
        &gt;
      </button>
    </div>
  );
}

function getVisiblePages(page: number, pageCount: number, maximumVisiblePages: number) {
  const pageOffset = Math.floor(maximumVisiblePages / 2);
  const start = Math.max(
    1,
    Math.min(page - pageOffset, pageCount - maximumVisiblePages + 1),
  );
  const end = Math.min(pageCount, start + maximumVisiblePages - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
