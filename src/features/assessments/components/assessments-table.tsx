"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import type { AssessmentSummary, SortDirection, SortKey } from "@/features/assessments/view-model";
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
  "h-11 rounded-md border border-[#E1E4E8] bg-white text-sm font-semibold text-[#171717] transition-[border-color,box-shadow] hover:border-[#C7CCD4] focus-within:border-[#80B7FF] sm:h-9";

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
  const coreHiddenFilterCount = [
    industryFilter !== "all" ? industryFilter : "",
    statusFilter !== "all" ? statusFilter : "",
    minimumScoreFilter.trim(),
  ].filter(Boolean).length;
  const phoneHiddenFilterCount =
    coreHiddenFilterCount + Number(Boolean(fromDateFilter)) + Number(Boolean(toDateFilter));

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
    <section
      className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden sm:mt-6"
      aria-label="Assessments table"
    >
      <div className="@container/assessment-filters mb-3 space-y-2">
        <div className="relative grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,0.55fr)] @min-[640px]/assessment-filters:grid-cols-[minmax(150px,1fr)_minmax(132px,0.8fr)_minmax(132px,0.8fr)_minmax(190px,0.9fr)] @min-[980px]/assessment-filters:grid-cols-[minmax(170px,1.2fr)_minmax(110px,0.75fr)_minmax(110px,0.75fr)_minmax(78px,0.45fr)_minmax(132px,0.75fr)_minmax(132px,0.75fr)_36px] @min-[1120px]/assessment-filters:grid-cols-[280px_171.5px_121.5px_120px_130.5px_151.05px_36px] @min-[1120px]/assessment-filters:gap-[10px]">
          <SearchInput
            className="@min-[980px]/assessment-filters:col-span-1"
            value={searchQuery}
            onChange={onSearchQueryChange}
          />

          <div className="hidden min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 @min-[640px]/assessment-filters:col-span-2 @min-[640px]/assessment-filters:grid @min-[980px]/assessment-filters:hidden">
            <DateInput
              ariaLabel="Updated from date"
              className="w-full"
              value={fromDateFilter}
              onChange={onFromDateFilterChange}
            />
            <span
              className="text-center text-[11px] leading-[16.5px] font-normal tracking-[0.06px] text-[#86868B]"
              aria-hidden="true"
            >
              to
            </span>
            <DateInput
              ariaLabel="Updated to date"
              className="w-full"
              value={toDateFilter}
              onChange={onToDateFilterChange}
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2 @min-[980px]/assessment-filters:hidden">
            <button
              ref={moreFiltersButtonRef}
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-md border border-[#E1E4E8] bg-white px-3 text-sm font-semibold text-[#555555] transition-[border-color,box-shadow,color] hover:border-[#C7CCD4] hover:text-[#007AFF] focus-visible:border-[#80B7FF] focus-visible:outline-none sm:h-9 sm:text-xs"
              aria-controls="assessment-advanced-filters"
              aria-expanded={showAdvancedFilters}
            >
              <SlidersHorizontal size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate">More filters</span>
              {phoneHiddenFilterCount ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[10px] font-bold text-[#007AFF] @min-[640px]/assessment-filters:hidden">
                  {phoneHiddenFilterCount}
                  <span className="sr-only"> active filters</span>
                </span>
              ) : null}
              {coreHiddenFilterCount ? (
                <span className="hidden size-5 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[10px] font-bold text-[#007AFF] @min-[640px]/assessment-filters:flex @min-[980px]/assessment-filters:hidden">
                  {coreHiddenFilterCount}
                  <span className="sr-only"> active filters</span>
                </span>
              ) : null}
              {showAdvancedFilters ? (
                <ChevronUp size={13} className="shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown size={13} className="shrink-0" aria-hidden="true" />
              )}
            </button>
            <ResetFiltersButton disabled={!hasActiveFilters} onClick={handleResetFilters} />
          </div>

          <div
            ref={advancedFiltersRef}
            id="assessment-advanced-filters"
            className={`${showAdvancedFilters ? "grid" : "hidden"} absolute top-[calc(100%+0.5rem)] right-0 z-20 w-full max-w-[620px] grid-cols-1 gap-2 overflow-visible rounded-md border border-[#E1E4E8] bg-white p-3 shadow-[0_16px_36px_rgba(15,23,42,0.14)] min-[380px]:grid-cols-2 @min-[640px]/assessment-filters:grid-cols-3 @min-[980px]/assessment-filters:static @min-[980px]/assessment-filters:contents`}
          >
            <FilterDropdown
              ariaLabel="Filter by industry"
              value={industryFilter}
              onChange={onIndustryFilterChange}
              className="w-full"
              options={[
                { label: "All industries", value: "all" },
                ...industryOptions.map((industry) => ({ label: industry, value: industry })),
              ]}
            />
            <FilterDropdown
              ariaLabel="Filter by status"
              value={statusFilter}
              onChange={onStatusFilterChange}
              className="w-full"
              options={[
                { label: "All statuses", value: "all" },
                ...statusOptions.map((status) => ({ label: status, value: status })),
              ]}
            />
            <MetricFilterInput
              className="min-[380px]:col-span-2 @min-[640px]/assessment-filters:col-span-1"
              value={minimumScoreFilter}
              onChange={onMinimumScoreFilterChange}
            />
            <div className="grid min-w-0 grid-cols-1 items-center gap-2 min-[380px]:col-span-2 min-[380px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @min-[640px]/assessment-filters:hidden @min-[980px]/assessment-filters:col-span-2 @min-[980px]/assessment-filters:grid @min-[1120px]/assessment-filters:grid-cols-[130.5px_10.55px_130.5px] @min-[1120px]/assessment-filters:gap-[10px]">
              <DateInput
                ariaLabel="Updated from date"
                className="w-full"
                value={fromDateFilter}
                onChange={onFromDateFilterChange}
              />
              <span
                className="text-center text-[11px] leading-[16.5px] font-normal tracking-[0.06px] text-[#86868B]"
                aria-hidden="true"
              >
                to
              </span>
              <DateInput
                ariaLabel="Updated to date"
                className="w-full"
                value={toDateFilter}
                onChange={onToDateFilterChange}
              />
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="hidden @min-[980px]/assessment-filters:block">
              <ResetFiltersButton disabled={false} onClick={handleResetFilters} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent sm:rounded-md sm:border sm:border-black/[0.08] sm:bg-white sm:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <TabletSortToolbar direction={sortDirection} onSort={onSort} sortKey={sortKey} />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 sm:pb-0 lg:overflow-auto">
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
                    isHighlighted={isAssessmentHighlighted(assessment, highlightedAssessmentKey)}
                    onOpen={() => onOpenAssessment(assessment)}
                  />
                ))
              : null}
          </div>

          <table className="hidden w-full min-w-[700px] table-fixed border-collapse lg:table">
            <colgroup>
              <col className="w-[32%] min-[1280px]:w-[28.527%]" />
              <col className="hidden min-[1280px]:table-column min-[1280px]:w-[13.455%]" />
              <col className="w-[10%] min-[1280px]:w-[10.97%]" />
              <col className="w-[14%] min-[1280px]:w-[12.212%]" />
              <col className="w-[14%] min-[1280px]:w-[12.213%]" />
              <col className="w-[23%] min-[1280px]:w-[14.698%]" />
              <col className="w-[7%] min-[1280px]:w-[7.925%]" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="h-9 border-b border-black/[0.08] bg-[#FAFAFA] text-left">
                <SortableHeader
                  active={sortKey === "company"}
                  direction={sortDirection}
                  label="Company"
                  onSort={() => onSort("company")}
                />
                <TableHeader label="Industry" className="hidden min-[1280px]:table-cell" />
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
                <TableHeader label="Status" />
                <th className="w-12 px-0 align-middle" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <AssessmentRowsSkeleton /> : null}

              {!isLoading && pagedAssessments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                      isHighlighted={isAssessmentHighlighted(assessment, highlightedAssessmentKey)}
                      onOpen={() => onOpenAssessment(assessment)}
                    />
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="mt-auto min-h-[44px] shrink-0 border-t border-black/[0.08] px-3 py-3 text-center text-xs leading-[18px] font-normal tracking-[0.06px] text-[#86868B] sm:mt-0 sm:px-5 sm:py-2 sm:text-left sm:text-[11px] sm:leading-[16.5px] lg:h-[53px] lg:min-h-[53px] lg:border-t-0 lg:py-0">
          <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-3 lg:h-full lg:flex-nowrap lg:border-t lg:border-black/[0.05] lg:py-0">
            <span className="min-w-0">
              {visibleAssessmentCount
                ? `Showing ${firstRowIndex}–${lastRowIndex} of ${visibleAssessmentCount} ${visibleAssessmentCount === 1 ? "user" : "users"}`
                : "Showing 0 of 0"}
              {totalAssessments > visibleAssessmentCount
                ? ` (${totalAssessments} total ${totalAssessments === 1 ? "submission" : "submissions"})`
                : ""}
            </span>
            <PaginationControls
              page={activePage}
              pageCount={pageCount}
              onPageChange={onPageChange}
            />
          </div>
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
      className={`h-[65px] cursor-pointer border-b border-black/[0.05] transition last:border-b-0 focus:outline-none ${
        isHighlighted
          ? "assessment-highlight-flash hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
          : "hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
      }`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <td className="py-3 pr-6 pl-[60px]">
        <p className="max-w-[280px] truncate text-[13px] leading-[19.5px] font-semibold tracking-[-0.08px] text-[#000000]">
          {assessment.company}
        </p>
        <p className="max-w-[280px] truncate text-[11px] leading-[16.5px] font-normal tracking-[0.06px] text-[#86868B]">
          {assessment.contact}
        </p>
      </td>
      <td className="hidden px-0 py-3 min-[1280px]:table-cell">
        <div className="flex max-w-[160px] items-center gap-2 text-xs leading-[18px] font-normal text-[#555555]">
          <IndustryIcon industry={assessment.industry} />
          <span className="truncate">{assessment.industry}</span>
        </div>
      </td>
      <td className="px-0 py-3 text-xs leading-[18px] font-semibold text-[#007AFF]">
        <MetricValue value={assessment.score} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-xs leading-[18px] font-normal text-[#171717]">
        <MetricValue value={totalCostValue} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-xs leading-[18px] font-medium text-[#10B981]">
        <MetricValue value={assessment.savings} mutedValue="--" />
      </td>
      <td className="px-0 py-3">
        <span className="whitespace-nowrap">
          <AssessmentStatusPill label={assessment.status} tone={statusTone} />
        </span>
      </td>
      <td className="px-0 py-3 text-left">
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
      className={`w-full rounded-lg border border-[#E1E7EF] bg-white p-3 text-left shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition hover:border-[#007AFF]/25 hover:bg-[#FAFCFF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/25 focus-visible:outline-none sm:rounded-md sm:border-black/[0.08] sm:p-4 sm:shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${
        isHighlighted ? "assessment-highlight-flash" : ""
      }`}
      aria-label={`Open ${assessment.company}`}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_7rem] items-start gap-x-2 gap-y-0 min-[360px]:grid-cols-[minmax(0,1fr)_9rem] sm:block">
        <div className="contents sm:block">
          <p className="col-start-1 row-start-1 min-w-0 self-start text-sm leading-5 font-semibold break-words text-[#171717] sm:font-bold">
            {assessment.company}
          </p>
          <p className="col-start-1 row-start-2 min-w-0 self-start text-xs leading-4 font-medium break-words text-[#8E9AAB] sm:mt-1 sm:font-semibold">
            {assessment.contact}
          </p>
        </div>

        <div className="contents sm:hidden">
          <span className="col-start-2 row-start-1 flex w-full max-w-full min-w-0 shrink-0 justify-end self-start whitespace-normal [&>span]:max-w-full [&>span]:justify-end [&>span]:gap-1 [&>span]:px-2 [&>span]:py-1 [&>span]:text-right [&>span]:text-[10px] [&>span]:leading-[14px] [&>span]:whitespace-normal [&>span>span]:shrink-0">
            <AssessmentStatusPill label={assessment.status} tone={statusTone} />
          </span>
          <span className="col-start-2 row-start-2 flex w-full min-w-0 items-center justify-end gap-1.5 self-start text-xs leading-4 font-medium text-[#555555]">
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
        <MobileMetric
          className="flex-[0.75_1_0%]"
          compact
          label="DI Score"
          tone="blue"
          value={assessment.score}
        />
        <MobileMetric
          className="flex-[1.125_1_0%]"
          compact
          label="Total Cost"
          value={totalCostValue}
        />
        <MobileMetric
          className="flex-[1.125_1_0%]"
          compact
          label="Savings"
          tone="green"
          value={assessment.savings}
        />
        <MobileMetric
          className="hidden sm:block"
          compact
          label="Submissions"
          value={String(assessment.assessments.length)}
        />
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
                className={`${
                  itemIndex === 3
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
            className="h-8 min-w-[150px] cursor-pointer appearance-none rounded-md border border-[#DCE8F8] bg-white pr-8 pl-3 text-xs font-semibold text-[#171717] outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none"
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
        <tr key={index} className="h-[65px] border-b border-black/[0.05]">
          <td className="py-3 pr-6 pl-[60px]">
            <div className="h-4 max-w-[280px] animate-pulse rounded-full bg-black/[0.06]" />
            <div className="mt-1 h-2.5 max-w-[170px] animate-pulse rounded-full bg-black/[0.05]" />
          </td>
          <td className="hidden px-0 py-3 min-[1280px]:table-cell">
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
            <div className="h-4 max-w-[180px] animate-pulse rounded-full bg-black/[0.06]" />
          </td>
          <td className="px-0 py-3">
            <div className="h-4 w-3 animate-pulse rounded-full bg-black/[0.04]" />
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
    <label
      className={`flex min-w-0 items-center gap-2 px-3 sm:gap-[11px] ${filterShellClassName} ${className}`}
    >
      <Search size={14} className="size-[15px] text-[#A1A1AA] sm:size-3.5" aria-hidden="true" />
      <input
        aria-label="Search company, contact, or region"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-base leading-6 font-normal tracking-[-0.08px] text-[#171717] outline-none placeholder:text-[#17171780] focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none sm:text-[13px] sm:leading-[19.5px]"
        placeholder="Search company, contact, region…"
        type="search"
      />
    </label>
  );
}

type FilterDropdownOption = {
  label: string;
  value: string;
};

function FilterDropdown({
  ariaLabel,
  className = "",
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  options: FilterDropdownOption[];
  value: string;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const typeaheadRef = useRef({ lastTypedAt: 0, query: "" });
  const selectedIndex = options.findIndex((option) => option.value === value);
  const resolvedSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const [activeIndex, setActiveIndex] = useState(resolvedSelectedIndex);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const selectedLabel = selectedOption?.label || value || options[0]?.label || "Select";

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportGutter = 12;
    const menuGap = 6;
    const availableWidth = Math.max(0, viewportWidth - viewportGutter * 2);
    const menuWidth = Math.min(availableWidth, Math.max(triggerRect.width, 240));
    const maximumLeft = Math.max(viewportGutter, viewportWidth - menuWidth - viewportGutter);
    const menuLeft = Math.min(Math.max(viewportGutter, triggerRect.left), maximumLeft);
    const spaceBelow = viewportHeight - triggerRect.bottom - menuGap - viewportGutter;
    const spaceAbove = triggerRect.top - menuGap - viewportGutter;
    const shouldOpenAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(48, shouldOpenAbove ? spaceAbove : spaceBelow);

    setMenuStyle({
      position: "fixed",
      left: menuLeft,
      width: menuWidth,
      maxHeight: Math.min(320, availableHeight),
      ...(shouldOpenAbove
        ? { bottom: viewportHeight - triggerRect.top + menuGap }
        : { top: triggerRect.bottom + menuGap }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: globalThis.PointerEvent) {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
        setMenuStyle(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeIndex, isOpen]);

  function closeDropdown() {
    setIsOpen(false);
    setMenuStyle(null);
    triggerRef.current?.focus();
  }

  function closeDropdownAndMoveFocus(backward: boolean) {
    const trigger = triggerRef.current;

    if (!trigger) {
      setIsOpen(false);
      setMenuStyle(null);
      return;
    }

    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) => !menuRef.current?.contains(element) && element.getClientRects().length > 0,
    );
    const triggerIndex = focusableElements.indexOf(trigger);
    const nextElement = focusableElements[triggerIndex + (backward ? -1 : 1)];

    setIsOpen(false);
    setMenuStyle(null);

    window.requestAnimationFrame(() => nextElement?.focus());
  }

  function selectOption(option: FilterDropdownOption) {
    if (option.value !== value) {
      onChange(option.value);
    }

    closeDropdown();
  }

  function openDropdown(nextActiveIndex = resolvedSelectedIndex) {
    updateMenuPosition();
    setActiveIndex(nextActiveIndex);
    setIsOpen(true);
  }

  function handleTypeahead(event: KeyboardEvent<HTMLButtonElement>, fromIndex: number) {
    if (
      event.key.length !== 1 ||
      event.key === " " ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      options.length === 0
    ) {
      return false;
    }

    event.preventDefault();

    const now = event.timeStamp;
    const typedCharacter = event.key.toLocaleLowerCase();
    const previousTypeahead = typeaheadRef.current;
    const nextQuery =
      now - previousTypeahead.lastTypedAt > 700
        ? typedCharacter
        : `${previousTypeahead.query}${typedCharacter}`;
    const isRepeatedCharacterQuery = [...nextQuery].every(
      (character) => character === typedCharacter,
    );
    const query = isRepeatedCharacterQuery ? typedCharacter : nextQuery;

    typeaheadRef.current = { lastTypedAt: now, query };

    for (let offset = 1; offset <= options.length; offset += 1) {
      const optionIndex = (fromIndex + offset) % options.length;

      if (options[optionIndex].label.toLocaleLowerCase().startsWith(query)) {
        if (isOpen) {
          setActiveIndex(optionIndex);
        } else {
          openDropdown(optionIndex);
        }

        break;
      }
    }

    return true;
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openDropdown(resolvedSelectedIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openDropdown(resolvedSelectedIndex);
    } else if (event.key === "Home") {
      event.preventDefault();
      openDropdown(0);
    } else if (event.key === "End") {
      event.preventDefault();
      openDropdown(options.length - 1);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      closeDropdown();
    } else {
      handleTypeahead(event, resolvedSelectedIndex);
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (handleTypeahead(event, index)) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(options[index]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeDropdown();
    } else if (event.key === "Tab") {
      event.preventDefault();
      closeDropdownAndMoveFocus(event.shiftKey);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${filterShellClassName} ${isOpen ? "border-[#80B7FF]!" : ""} ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-full w-full items-center justify-between gap-2 rounded-[inherit] bg-transparent pr-3 pl-[13px] text-left text-base font-semibold text-[#171717] outline-none sm:text-[13px] sm:leading-[19.5px] sm:font-normal sm:text-[#555555]"
      >
        <span className="truncate" title={selectedLabel}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#007AFF] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && menuStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={ariaLabel}
              style={menuStyle}
              className="z-[100] overflow-y-auto rounded-lg border border-[#E1E4E8] bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    tabIndex={activeIndex === index ? 0 : -1}
                    title={option.label}
                    onClick={() => selectOption(option)}
                    onFocus={() => setActiveIndex(index)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                    className={`flex w-full max-w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[13px] leading-[18px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:ring-inset ${
                      isSelected
                        ? "bg-[#EAF3FF] font-semibold text-[#005DB8] hover:bg-[#DFECFF]"
                        : "font-medium text-[#333333] hover:bg-[#F5F7FA] focus:bg-[#F5F7FA]"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {isSelected ? (
                        <Check size={14} strokeWidth={2.25} aria-hidden="true" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
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
        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#171717] outline-none placeholder:text-[#A1A1AA] focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none sm:text-[13px] sm:leading-[19.5px] sm:font-normal sm:text-[#555555]"
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
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-base leading-6 font-semibold tracking-[-0.08px] text-[#171717] outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none sm:text-[13px] sm:leading-[19.5px] sm:font-normal sm:text-[#555555]"
        type="date"
      />
    </label>
  );
}

function ResetFiltersButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-11 items-center justify-center rounded-md border border-[#E1E4E8] bg-white text-[#555555] transition-[border-color,box-shadow,color] hover:border-[#C7CCD4] hover:text-[#007AFF] focus-visible:border-[#80B7FF] focus-visible:outline-none disabled:cursor-not-allowed disabled:text-[#A1A1AA] disabled:opacity-60 sm:size-9"
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

function TableHeader({ className = "", label }: { className?: string; label: string }) {
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
      <path
        d="M8.25 6L6.75 7.5L5.25 6"
        stroke="#86868B"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.75"
      />
      <path
        d="M6.75 7.5V1.5"
        stroke="#86868B"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.75"
      />
      <path
        d="M1.5 3L3 1.5L4.5 3"
        stroke="#86868B"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.75"
      />
      <path
        d="M3 1.5V7.5"
        stroke="#86868B"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.75"
      />
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
        className="flex size-9 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:opacity-30 sm:size-7"
        aria-label="Previous page"
      >
        <ChevronLeft size={13} aria-hidden="true" />
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          aria-current={item === page ? "page" : undefined}
          aria-label={`Page ${item}${item === page ? ", current page" : ""}`}
          className={`flex size-9 items-center justify-center rounded-md border text-xs font-medium sm:size-7 ${
            item === page
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
        className="flex size-9 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:opacity-30 sm:size-7"
        aria-label="Next page"
      >
        <ChevronRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

function getVisiblePages(page: number, pageCount: number, maximumVisiblePages: number) {
  const pageOffset = Math.floor(maximumVisiblePages / 2);
  const start = Math.max(1, Math.min(page - pageOffset, pageCount - maximumVisiblePages + 1));
  const end = Math.min(pageCount, start + maximumVisiblePages - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
