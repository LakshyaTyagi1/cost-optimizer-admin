"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  Home,
  Landmark,
  LayoutGrid,
  Mail,
  Percent,
  Printer,
  RotateCcw,
  Search,
  Shield,
  ShoppingBag,
  Stethoscope,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  fetchAdminAssessment,
  fetchAdminAssessments,
  type AdminAssessmentProcess,
  type AdminAssessmentRow,
  updateAdminAssessmentProcess,
} from "@/api/assessments.api";
import { fetchDataDictionaryCatalog } from "@/api/data-dictionary.api";
import { AdminShell } from "@/components/admin-shell/admin-shell";

const assessmentsQueryKey = ["admin-assessments"] as const;
const assessmentIndustryCatalogQueryKey = ["data-dictionary", "catalog", "industries"] as const;
const pageSize = 10;
const emptyAssessments: AdminAssessmentRow[] = [];
const defaultUsdToAedRate = 3.6725;

type SortKey = "company" | "score" | "cost" | "savings";
type SortDirection = "asc" | "desc";
export type DetailTab =
  | "overview"
  | "activity"
  | "processes"
  | "due-diligence"
  | "results"
  | "strategy"
  | "expert"
  | "notes";

type AssessmentSummary = {
  assessments: AdminAssessmentRow[];
  company: string;
  contact: string;
  cost: string;
  createdAt?: string;
  currencyConversionRate: number;
  customProcesses: AdminAssessmentProcess[];
  domain: string;
  email: string;
  id: string;
  industry: string;
  industries: string[];
  owner: string;
  preferences: NonNullable<AdminAssessmentRow["preferences"]>;
  processCount: number | null;
  processes: AdminAssessmentProcess[];
  savings: string;
  score: string;
  selectedStackTools: string[];
  status: string;
  statusKey?: string;
  updatedAt?: string;
};

type ProcessEditFormState = {
  automationLevel: string;
  category: string;
  dedicatedFtes: string;
  dedicatedSalaryAed: string;
  description: string;
  hoursPerYear: string;
  name: string;
  processEfficiencyPercent: string;
  sharedAllocationPercent: string;
  sharedFtes: string;
  sharedSalaryAed: string;
  softwareCostAed: string;
  stack: string;
  tier: string;
};

type AssessmentProcessToast = {
  description?: string;
  id: string;
  message: string;
  tone: "error" | "success";
};

const automationLevelOptions = [1, 2, 3, 4, 5] as const;

const statusStyles = {
  gray: {
    chip: "bg-[#F5F5F5] text-[#8E9AAB]",
    dot: "bg-[#C1C7D0]",
  },
  blueLight: {
    chip: "bg-[#EEF5FF] text-[#4D7FEA]",
    dot: "bg-[#6E9FF8]",
  },
  blue: {
    chip: "bg-[#EAF3FF] text-[#007AFF]",
    dot: "bg-[#007AFF]",
  },
  green: {
    chip: "bg-[#ECFDF5] text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  red: {
    chip: "bg-[#FEF2F2] text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
} as const;

const industryIconStyles: Record<string, { icon: LucideIcon }> = {
  Automotive: { icon: Car },
  Banking: { icon: Landmark },
  Healthcare: { icon: Stethoscope },
  Insurance: { icon: Shield },
  "Public Sector": { icon: Building2 },
  "Real Estate": { icon: Home },
  Retail: { icon: ShoppingBag },
};

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
const detailInputClass =
  "h-9 w-full rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#171717] outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF]";

const filterShellClassName =
  "h-10 rounded-md border border-[#DCE8F8] bg-white text-sm font-semibold text-[#171717] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/10 hover:border-[#BBD6FF]";

export function AssessmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minimumScoreFilter, setMinimumScoreFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data, error, isLoading } = useQuery({
    queryKey: assessmentsQueryKey,
    queryFn: fetchAdminAssessments,
  });
  const { data: industryCatalog } = useQuery({
    queryKey: assessmentIndustryCatalogQueryKey,
    queryFn: fetchDataDictionaryCatalog,
  });

  const assessments = data?.assessments ?? emptyAssessments;
  const totalAssessments = data?.totalAssessments ?? assessments.length;
  const errorMessage = error ? getErrorMessage(error) : "";
  const industryOptions = useMemo(() => getIndustryOptions(assessments, industryCatalog?.industries ?? []), [assessments, industryCatalog?.industries]);
  const statusOptions = useMemo(() => getUniqueOptions(assessments, "status"), [assessments]);

  const filteredAssessments = useMemo(() => {
    const normalizedQuery = normalizeSearch(searchQuery);
    const minimumScore = Number(minimumScoreFilter);
    const hasMinimumScore = Number.isFinite(minimumScore) && minimumScoreFilter.trim() !== "";
    const fromTime = getDateStartTime(fromDateFilter);
    const toTime = getDateEndTime(toDateFilter);

    return assessments
      .filter((assessment) => {
        const assessmentIndustries = getAssessmentIndustries(assessment);
        const searchableText = normalizeSearch(
          `${assessment.company} ${assessment.contact} ${assessmentIndustries.join(" ")} ${assessment.status}`,
        );
        const updatedTime = getAssessmentUpdatedTime(assessment);

        if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
          return false;
        }

        if (
          industryFilter !== "all" &&
          !assessmentIndustries.includes(industryFilter)
        ) {
          return false;
        }

        if (statusFilter !== "all" && assessment.status !== statusFilter) {
          return false;
        }

        if (hasMinimumScore && parseMetricNumber(assessment.score) < minimumScore) {
          return false;
        }

        if (fromTime !== null && (updatedTime === null || updatedTime < fromTime)) {
          return false;
        }

        if (toTime !== null && (updatedTime === null || updatedTime > toTime)) {
          return false;
        }

        return true;
      })
      .sort((first, second) =>
        compareAssessments(first, second, sortKey, sortDirection),
      );
  }, [
    assessments,
    fromDateFilter,
    industryFilter,
    minimumScoreFilter,
    searchQuery,
    sortDirection,
    sortKey,
    statusFilter,
    toDateFilter,
  ]);

  const assessmentSummaries = useMemo(
    () => groupAssessmentsByUser(filteredAssessments, sortKey, sortDirection),
    [filteredAssessments, sortDirection, sortKey],
  );
  const highlightedAssessmentKey = getRouteSlug(searchParams.get("assessment") || "");
  const highlightedAssessmentIndex = useMemo(
    () =>
      highlightedAssessmentKey
        ? assessmentSummaries.findIndex((assessment) =>
            isAssessmentHighlighted(assessment, highlightedAssessmentKey),
          )
        : -1,
    [assessmentSummaries, highlightedAssessmentKey],
  );
  const highlightedAssessmentPage =
    highlightedAssessmentIndex >= 0
      ? Math.floor(highlightedAssessmentIndex / pageSize) + 1
      : null;
  const pageCount = Math.max(1, Math.ceil(assessmentSummaries.length / pageSize));
  const activePage = Math.min(highlightedAssessmentPage ?? page, pageCount);
  const firstRowIndex = assessmentSummaries.length ? (activePage - 1) * pageSize + 1 : 0;
  const lastRowIndex = Math.min(activePage * pageSize, assessmentSummaries.length);
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    industryFilter !== "all" ||
    statusFilter !== "all" ||
    minimumScoreFilter.trim() !== "" ||
    fromDateFilter !== "" ||
    toDateFilter !== "";
  const pagedAssessments = assessmentSummaries.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearchQuery("");
    setIndustryFilter("all");
    setStatusFilter("all");
    setMinimumScoreFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setPage(1);
  }

  function openAssessment(assessmentId: string) {
    router.push(`/assessments/${encodeURIComponent(assessmentId)}`);
  }

  return (
    <AdminShell activeItem="Assessments">
      <div className="flex min-h-[calc(100vh-56px)] flex-col lg:h-full lg:min-h-0 lg:overflow-hidden lg:pr-6">
        <header className="shrink-0 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight font-bold tracking-normal">Assessments</h1>
            <p className="mt-2 text-sm font-semibold text-[#86868B]">
              {isLoading
                ? "Loading submissions..."
                : `${assessmentSummaries.length} users from ${totalAssessments} total submissions`}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => exportAssessmentsCsv(filteredAssessments)}
              disabled={!filteredAssessments.length}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <ArrowDownToLine size={13} aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </header>

        <section className="mt-6 flex min-h-0 flex-1 flex-col lg:mt-8 lg:overflow-hidden" aria-label="Assessments table">
        <div className="mb-3 rounded-md border border-[#E7EEF8] bg-[#F8FBFF] p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.25fr)_minmax(128px,0.8fr)_minmax(118px,0.72fr)_minmax(84px,0.48fr)_minmax(124px,0.68fr)_18px_minmax(124px,0.68fr)_max-content]">
            <SearchInput
              value={searchQuery}
              onChange={(value) => updateFilter(setSearchQuery, value)}
            />
            <FilterSelect
              ariaLabel="Filter by industry"
              value={industryFilter}
              onChange={(value) => updateFilter(setIndustryFilter, value)}
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
              onChange={(value) => updateFilter(setStatusFilter, value)}
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
              onChange={(value) => updateFilter(setMinimumScoreFilter, value)}
            />
            <DateInput
              ariaLabel="Updated from date"
              value={fromDateFilter}
              onChange={(value) => updateFilter(setFromDateFilter, value)}
            />
            <span className="hidden h-10 items-center px-1 text-xs font-bold text-[#8E9AAB] xl:flex">
              to
            </span>
            <DateInput
              ariaLabel="Updated to date"
              value={toDateFilter}
              onChange={(value) => updateFilter(setToDateFilter, value)}
            />
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-[#DCE8F8] bg-white px-3 text-sm font-bold text-[#555555] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] disabled:cursor-not-allowed disabled:text-[#A1A1AA] disabled:opacity-60 sm:col-span-2 xl:col-span-1 xl:w-auto"
              aria-label="Reset assessment filters"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reset
            </button>
          </div>
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
                      onOpen={() => openAssessment(getAssessmentDetailRouteId(assessment))}
                    />
                  ))
                : null}
            </div>

            <table className="hidden w-full min-w-[1170px] table-fixed border-collapse md:table">
              <colgroup>
                <col className="w-[334px]" />
                <col className="w-[157px]" />
                <col className="w-[129px]" />
                <col className="w-[143px]" />
                <col className="w-[143px]" />
                <col className="w-[217px]" />
                <col className="w-[47px]" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="h-9 border-b border-black/[0.08] bg-[#FAFAFA] text-left">
                  <SortableHeader
                    active={sortKey === "company"}
                    direction={sortDirection}
                    label="Company"
                    onSort={() => handleSort("company")}
                  />
                  <TableHeader label="Industry" />
                  <SortableHeader
                    active={sortKey === "score"}
                    direction={sortDirection}
                    label="DI Score"
                    onSort={() => handleSort("score")}
                  />
                  <SortableHeader
                    active={sortKey === "cost"}
                    direction={sortDirection}
                    label="Total Cost"
                    onSort={() => handleSort("cost")}
                  />
                  <SortableHeader
                    active={sortKey === "savings"}
                    direction={sortDirection}
                    label="Savings"
                    onSort={() => handleSort("savings")}
                  />
                  <TableHeader label="Status" />
                  <th className="w-12 px-4 align-middle" aria-label="Actions" />
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
                        isHighlighted={isAssessmentHighlighted(
                          assessment,
                          highlightedAssessmentKey,
                        )}
                        onOpen={() => openAssessment(getAssessmentDetailRouteId(assessment))}
                      />
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          <div className="flex min-h-[44px] shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] px-5 py-2 text-[11px] font-semibold text-[#86868B]">
            <span>
              {assessmentSummaries.length
                ? `Showing ${firstRowIndex}-${lastRowIndex} of ${assessmentSummaries.length} users`
                : "Showing 0 of 0"}
              {totalAssessments > assessmentSummaries.length
                ? ` (${totalAssessments} total submissions)`
                : ""}
            </span>
            <PaginationControls
              page={activePage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        </div>
        </section>
      </div>
    </AdminShell>
  );
}

export function AssessmentDetailPage({
  activeTab = "overview",
  assessmentId,
}: {
  activeTab?: DetailTab;
  assessmentId: string;
}) {
  const router = useRouter();
  const routeAssessmentId = getAssessmentIdFromRouteParam(assessmentId);
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-assessments", "detail", routeAssessmentId],
    queryFn: () => fetchAdminAssessment(routeAssessmentId),
    enabled: routeAssessmentId !== "",
  });
  const normalizedAssessmentId = routeAssessmentId;
  const assessment = useMemo(
    () => (data ? createAssessmentSummary(data.id || normalizedAssessmentId, [data]) : null),
    [data, normalizedAssessmentId],
  );
  const detailRouteSlug = assessment ? getAssessmentDetailRouteId(assessment) : assessmentId.trim();
  const backToAssessments = useCallback(() => {
    router.push("/assessments");
  }, [router]);
  const updateDetailTab = useCallback(
    (tab: DetailTab) => {
      const nextUrl =
        tab === defaultDetailTab
          ? `/assessments/${detailRouteSlug}`
          : `/assessments/${detailRouteSlug}?tab=${tab}`;

      router.push(nextUrl);
    },
    [detailRouteSlug, router],
  );

  if (isLoading) {
    return (
      <AdminShell activeItem="Assessments">
        <AssessmentDetailSkeleton onBack={backToAssessments} />
      </AdminShell>
    );
  }

  if (!assessment) {
    return (
      <AdminShell activeItem="Assessments">
        <section className="min-h-[calc(100vh-56px)] bg-white px-5 py-7 text-[#171717]">
          <button
            type="button"
            onClick={backToAssessments}
            className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#86868B] transition hover:text-[#007AFF]"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            Back to assessments
          </button>
          <p className="mt-8 text-sm font-semibold text-[#86868B]">
            {getErrorMessage(error) || "Assessment details were not found."}
          </p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeItem="Assessments">
      <AssessmentDetailView
        activeTab={activeTab}
        assessment={assessment}
        onBack={backToAssessments}
        onTabChange={updateDetailTab}
      />
    </AdminShell>
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

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <tr
      className={`h-[58px] cursor-pointer border-b border-black/[0.05] transition focus:outline-none last:border-b-0 ${
        isHighlighted
          ? "assessment-highlight-flash hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
          : "hover:bg-[#FAFAFA] focus:bg-[#FAFAFA]"
      }`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <td className="py-3 pr-6 pl-[60px]">
        <p className="max-w-[280px] truncate text-[12px] leading-[1.2] font-bold text-[#171717]">
          {assessment.company}
        </p>
        <p className="mt-1 max-w-[280px] truncate text-[10px] leading-[1.2] font-semibold text-[#8E9AAB]">
          {assessment.contact}
        </p>
      </td>
      <td className="px-0 py-3">
        <div className="flex max-w-[160px] items-center gap-2 text-[11px] font-semibold text-[#555555]">
          <IndustryIcon industry={assessment.industry} />
          <span className="truncate">{assessment.industry}</span>
        </div>
      </td>
      <td className="px-0 py-3 text-[11px] font-bold text-[#007AFF]">
        <MetricValue value={assessment.score} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-[11px] font-bold text-[#171717]">
        <MetricValue value={assessment.cost} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-[11px] font-bold text-[#10B981]">
        <MetricValue value={assessment.savings} mutedValue="--" />
      </td>
      <td className="px-0 py-3">
        <StatusPill label={assessment.status} tone={statusTone} />
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

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-md border border-black/[0.08] bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:border-[#007AFF]/25 hover:bg-[#FAFCFF] ${
        isHighlighted ? "assessment-highlight-flash" : ""
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
        <StatusPill label={assessment.status} tone={statusTone} />
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-2 text-xs font-semibold text-[#555555]">
        <IndustryIcon industry={assessment.industry} />
        <span className="min-w-0 truncate">{assessment.industry}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MobileMetric label="DI Score" tone="blue" value={assessment.score} />
        <MobileMetric label="Total Cost" value={assessment.cost} />
        <MobileMetric label="Savings" tone="green" value={assessment.savings} />
        <MobileMetric label="Submissions" value={String(assessment.assessments.length)} />
      </div>
    </button>
  );
}

function MobileMetric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "blue" | "default" | "green";
  value: string;
}) {
  const toneClass =
    tone === "blue"
      ? "text-[#007AFF]"
      : tone === "green"
        ? "text-[#10B981]"
        : "text-[#171717]";

  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
      <p className="text-[9px] font-bold tracking-[0.12em] text-[#8E9AAB] uppercase">
        {label}
      </p>
      <p className={`mt-1 truncate text-xs font-bold ${toneClass}`}>
        <MetricValue value={value} mutedValue="--" />
      </p>
    </div>
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
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#171717] outline-none placeholder:text-[#A1A1AA] focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
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
        className="h-full w-full appearance-none rounded-md bg-transparent pr-9 pl-3 text-sm font-semibold text-[#171717] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
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
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#171717] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
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

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof statusStyles;
}) {
  const styles = statusStyles[tone];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[10px] leading-none font-bold ${styles.chip}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

function IndustryIcon({ industry }: { industry: string }) {
  const Icon = industryIconStyles[industry]?.icon || LayoutGrid;

  return <Icon size={12} className="shrink-0 text-[#86868B]" aria-hidden="true" />;
}

function AssessmentDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <section
      className="min-h-[calc(100vh-56px)] bg-white px-5 py-7 text-[#171717]"
      aria-busy="true"
      aria-label="Loading assessment details"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#86868B] transition hover:text-[#007AFF]"
      >
        <ArrowLeft size={12} aria-hidden="true" />
        Back to assessments
      </button>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-8 w-full max-w-[420px]" />
          <SkeletonBlock className="mt-2 h-3 w-full max-w-[280px]" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-6 w-[112px] rounded-full" />
            <SkeletonBlock className="h-3 w-[126px]" />
            <SkeletonBlock className="h-3 w-[104px]" />
            <SkeletonBlock className="h-3 w-[112px]" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-9 w-[102px]" />
          <SkeletonBlock className="h-9 w-[180px]" />
          <SkeletonBlock className="size-9" />
        </div>
      </header>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-md border border-black/[0.08] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          >
            <SkeletonBlock className="h-2.5 w-[70%]" />
            <SkeletonBlock className="mt-3 h-5 w-[58%]" />
          </div>
        ))}
      </div>

      <div className="mt-7 flex overflow-hidden border-b border-black/[0.08]">
        {[78, 68, 86, 112, 72, 116, 58, 58].map((width, index) => (
          <div key={index} className="flex h-12 shrink-0 items-center px-4">
            <SkeletonBlock className="h-4" style={{ width }} />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <AssessmentDetailPanelSkeleton
          titleWidth={132}
          rows={[148, 116, 136, 176, 122, 72]}
          footer
        />
        <AssessmentDetailPanelSkeleton
          titleWidth={172}
          rows={[126, 104, 132, 156, 166, 144]}
          tags
        />
        <section className="rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] xl:col-span-2">
          <div className="flex min-h-[45px] items-center justify-between border-b border-black/[0.08] px-5 py-3">
            <SkeletonBlock className="h-2.5 w-[68px]" />
            <SkeletonBlock className="h-4 w-[112px]" />
          </div>
          <div className="px-5 py-4">
            <SkeletonBlock className="h-3 w-full max-w-[520px]" />
            <SkeletonBlock className="mt-2 h-3 w-full max-w-[360px]" />
          </div>
        </section>
      </div>
    </section>
  );
}

function AssessmentDetailPanelSkeleton({
  footer = false,
  rows,
  tags = false,
  titleWidth,
}: {
  footer?: boolean;
  rows: number[];
  tags?: boolean;
  titleWidth: number;
}) {
  return (
    <section className="rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <SkeletonBlock className="h-2.5" style={{ width: titleWidth }} />
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {rows.map((width, index) => (
          <div key={index}>
            <SkeletonBlock className="h-2.5 w-[92px]" />
            <SkeletonBlock className="mt-2 h-4" style={{ width }} />
          </div>
        ))}
      </div>
      {tags ? (
        <div className="mt-5">
          <SkeletonBlock className="h-2.5 w-[156px]" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[86, 104, 72, 118].map((width) => (
              <SkeletonBlock key={width} className="h-6 rounded-full" style={{ width }} />
            ))}
          </div>
        </div>
      ) : null}
      {footer ? (
        <div className="mt-5 border-t border-black/[0.08] pt-4">
          <SkeletonBlock className="h-2.5 w-[118px]" />
          <SkeletonBlock className="mt-3 h-9 w-full max-w-[220px]" />
        </div>
      ) : null}
    </section>
  );
}

function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-black/[0.06] ${className}`}
      style={style}
    />
  );
}

function AssessmentDetailView({
  activeTab,
  assessment,
  onBack,
  onTabChange,
}: {
  activeTab: DetailTab;
  assessment: AssessmentSummary;
  onBack: () => void;
  onTabChange: (tab: DetailTab) => void;
}) {
  const statusTone = getStatusTone(assessment.status, assessment.statusKey);

  return (
    <section className="min-h-[calc(100vh-56px)] bg-white px-4 py-6 text-[#171717] sm:px-5 sm:py-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#86868B] transition hover:text-[#007AFF]"
      >
        <ArrowLeft size={12} aria-hidden="true" />
        Back to assessments
      </button>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <h1 className="break-words text-[24px] leading-tight font-bold tracking-normal sm:text-[26px]">
            {assessment.company}
          </h1>
          <p className="mt-1 break-words text-xs font-semibold text-[#86868B]">
            {assessment.contact}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#86868B]">
            <StatusPill label={assessment.status} tone={statusTone} />
            <span>
              Owner: <span className="text-[#171717]">{assessment.owner}</span>
            </span>
            <span>Created {formatDate(assessment.createdAt)}</span>
            <span>Updated {formatDate(assessment.updatedAt)}</span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] sm:w-auto"
          >
            <Printer size={13} aria-hidden="true" />
            Export PDF
          </button>
          <div className="hidden h-9 w-[180px] rounded-md border border-black/[0.08] bg-white sm:block" aria-hidden="true" />
          <button
            type="button"
            disabled
            className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-md border border-black/[0.08] text-[#8E9AAB]"
            aria-label="Delete assessment"
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <DetailMetric label="Processes selected" value={formatNullableCount(assessment.processCount)} />
        <DetailMetric label="Current DI" value={assessment.score} />
        <DetailMetric label="Potential DI" value={getPotentialDi(assessment.score)} />
        <DetailMetric label="Total cost / yr" value={formatCompactMetric(assessment.cost)} />
        <DetailMetric label="Est. savings / yr" value={formatCompactMetric(assessment.savings)} />
      </div>

      <DetailTabs activeTab={activeTab} onTabChange={onTabChange} />

      <div
        id={`assessment-tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`assessment-tab-${activeTab}`}
        className="outline-none"
      >
        {activeTab === "overview" ? <AssessmentOverview assessment={assessment} /> : <AssessmentTabContent activeTab={activeTab} assessment={assessment} />}
      </div>
    </section>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-black/[0.08] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">{label}</p>
      <p className="mt-2 text-[17px] leading-none font-bold text-[#171717]">{value}</p>
    </div>
  );
}

function DetailTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  const tabs: Array<{ label: string; value: DetailTab }> = [
    { label: "Overview", value: "overview" },
    { label: "Activity", value: "activity" },
    { label: "Processes", value: "processes" },
    { label: "Due Diligence", value: "due-diligence" },
    { label: "Results", value: "results" },
    { label: "Strategy & RFP", value: "strategy" },
    { label: "Expert", value: "expert" },
    { label: "Notes", value: "notes" },
  ];

  return (
    <div
      className="scrollbar-hidden mt-7 flex overflow-x-auto whitespace-nowrap border-b border-black/[0.08]"
      role="tablist"
      aria-label="Assessment detail sections"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;

        return (
          <button
            key={tab.value}
            type="button"
            id={`assessment-tab-${tab.value}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`assessment-tab-panel-${tab.value}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.value)}
            className={`h-12 shrink-0 px-3 text-sm leading-none font-semibold transition sm:px-4 sm:text-[16px] sm:font-normal ${
              isActive
                ? "border-b border-[#171717] text-[#171717]"
                : "text-[#86868B] hover:text-[#171717]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function AssessmentOverview({ assessment }: { assessment: AssessmentSummary }) {
  const contactName = getContactName(assessment.contact);
  const contactEmail = getContactEmail(assessment.contact);

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <section className="rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
          Contact & Account
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <ValueBlock label="Company" value={assessment.company} />
          <ValueBlock label="Region" value={getRegion(assessment.contact)} />
          <ValueBlock label="Contact name" value={contactName} />
          <ValueBlock label="Contact email" value={contactEmail} />
          <ValueBlock label="Contact phone" value="Not provided" muted />
          <ValueBlock label="Currency" value="AED" />
        </div>
        <div className="mt-5 border-t border-black/[0.08] pt-4">
          <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
            Assigned owner
          </p>
          <div className="mt-2 flex h-9 max-w-[220px] items-center rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555]">
            {assessment.owner}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
          Org Configuration (Profile)
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <ValueBlock label="Domain" value={assessment.domain} />
          <ValueBlock label="Industry" value={assessment.industries.join(", ") || "--"} />
          <ValueBlock label="Company size" value={assessment.preferences.companySize || "--"} />
          <ValueBlock label="Deployment preference" value={assessment.preferences.deploymentPreference || "--"} />
          <ValueBlock label="Gartner MQ rated only" value={assessment.preferences.magicQuadrant || "--"} />
          <ValueBlock label="AI-native preference" value={assessment.preferences.aiPreference || "--"} />
        </div>
        <div className="mt-5">
          <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
            Selected technology stack
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {assessment.selectedStackTools.length ? (
              assessment.selectedStackTools.map((tool) => <Tag key={tool} label={tool} tone="blue" />)
            ) : (
              <span className="text-xs font-semibold text-[#86868B]">--</span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] xl:col-span-2">
        <div className="flex items-center justify-between border-b border-black/[0.08] px-5 py-3">
          <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">Engage</p>
          <button type="button" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007AFF]">
            <Mail size={12} aria-hidden="true" />
            Compose Email
          </button>
        </div>
        <p className="px-5 py-4 text-xs font-semibold text-[#86868B]">
          Use a saved template to reach out to {contactName}; automated sending is not wired up yet.
        </p>
      </section>
    </div>
  );
}

function AssessmentProcesses({ assessment }: { assessment: AssessmentSummary }) {
  const queryClient = useQueryClient();
  const [expandedProcessKey, setExpandedProcessKey] = useState("");
  const [processNotice, setProcessNotice] = useState("");
  const [processToasts, setProcessToasts] = useState<AssessmentProcessToast[]>([]);
  const processToastIdRef = useRef(0);
  const processToastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const customProcesses = assessment.customProcesses;
  const updateProcessMutation = useMutation({
    mutationFn: ({
      assessmentId,
      payload,
      processId,
    }: {
      assessmentId: string;
      payload: AdminAssessmentProcess;
      processId: string;
    }) => updateAdminAssessmentProcess(assessmentId, processId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: assessmentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["admin-assessments", "detail", assessment.id] }),
      ]);
    },
  });

  useEffect(() => {
    const toastTimeouts = processToastTimeoutsRef.current;

    return () => {
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();
    };
  }, []);

  function scheduleProcessToastDismiss(toastId: string) {
    const existingTimeout = processToastTimeoutsRef.current.get(toastId);

    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      setProcessToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== toastId),
      );
      processToastTimeoutsRef.current.delete(toastId);
    }, 3600);

    processToastTimeoutsRef.current.set(toastId, timeout);
  }

  function showProcessToast(
    message: string,
    tone: AssessmentProcessToast["tone"],
    description?: string,
  ) {
    processToastIdRef.current += 1;
    const toastId = `assessment-process-toast-${processToastIdRef.current}`;

    setProcessToasts((currentToasts) =>
      [{ description, id: toastId, message, tone }, ...currentToasts].slice(0, 3),
    );
    scheduleProcessToastDismiss(toastId);
  }

  async function handleSaveProcess(process: AdminAssessmentProcess, form: ProcessEditFormState) {
    const assessmentId = process.assessmentId;
    const processId = getProcessKey(process);

    if (!assessmentId || !processId) {
      setProcessNotice("Assessment process id is missing. Refresh and try again.");
      showProcessToast("Process update failed", "error", "Assessment process id is missing.");
      return;
    }

    try {
      setProcessNotice("");
      await updateProcessMutation.mutateAsync({
        assessmentId,
        processId,
        payload: buildProcessUpdatePayload(process, form),
      });
      setExpandedProcessKey("");
      setProcessNotice("Process details saved.");
      showProcessToast("Selected process updated", "success", "Admin changes were saved and tracked.");
    } catch (error) {
      const message = getErrorMessage(error);
      setProcessNotice(message);
      showProcessToast("Process update failed", "error", message);
    }
  }

  function renderProcessTable(
    processes: AdminAssessmentProcess[],
    sectionKey: string,
    emptyMessage: string,
    options: { editable?: boolean } = {},
  ) {
    const isEditable = options.editable !== false;
    return (
      <div>
        <div className="divide-y divide-black/[0.05] md:hidden">
          {processes.length ? (
            processes.map((process) => {
              const processSectionKey = getProcessSectionKey(sectionKey, process);
              const isExpanded = isEditable && expandedProcessKey === processSectionKey;

              return (
                <div key={processSectionKey}>
                  <AssessmentProcessMobileCard
                    currencyConversionRate={assessment.currencyConversionRate}
                    editable={isEditable}
                    expanded={isExpanded}
                    process={process}
                    onToggle={() => {
                      if (isEditable) {
                        setExpandedProcessKey(isExpanded ? "" : processSectionKey);
                      }
                    }}
                  />
                  {isEditable && isExpanded ? (
                    <div className="border-t border-black/[0.05] bg-[#FAFAFA]">
                      <AssessmentProcessEditor
                        currencyConversionRate={assessment.currencyConversionRate}
                        isSaving={updateProcessMutation.isPending}
                        process={process}
                        onCancel={() => setExpandedProcessKey("")}
                        onSave={(form) => void handleSaveProcess(process, form)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm font-semibold text-[#86868B]">
              {emptyMessage}
            </div>
          )}
        </div>

        <div className="hidden overflow-auto md:block">
        <table className="w-full min-w-[920px] table-fixed border-collapse">
          <thead>
            <tr className="h-[42px] border-b border-black/[0.08] bg-[#FAFAFA] text-left text-[10px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
              <th className="w-[25%] px-5">Process</th>
              <th className="w-[16%] px-5">Tier</th>
              <th className="w-[18%] px-5">Automation</th>
              <th className="w-[13%] px-5">Cost / yr</th>
              <th className="w-[10%] px-5">FTEs</th>
              <th className="w-[10%] px-5 whitespace-nowrap">Software / yr</th>
              <th className="w-[13%] px-5 text-right">Est. saving</th>
            </tr>
          </thead>
          <tbody>
            {processes.length ? (
              processes.map((process) => {
                const processSectionKey = getProcessSectionKey(sectionKey, process);
                const isExpanded = isEditable && expandedProcessKey === processSectionKey;

                return (
                  <Fragment key={processSectionKey}>
                    <ProcessRow
                      currencyConversionRate={assessment.currencyConversionRate}
                      editable={isEditable}
                      expanded={isExpanded}
                      process={process}
                      onToggle={() => {
                        if (isEditable) {
                          setExpandedProcessKey(isExpanded ? "" : processSectionKey);
                        }
                      }}
                    />
                    {isEditable && isExpanded ? (
                      <tr>
                        <td colSpan={7} className="border-b border-black/[0.05] bg-[#FAFAFA] p-0">
                          <AssessmentProcessEditor
                            currencyConversionRate={assessment.currencyConversionRate}
                            isSaving={updateProcessMutation.isPending}
                            process={process}
                            onCancel={() => setExpandedProcessKey("")}
                            onSave={(form) => void handleSaveProcess(process, form)}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="h-28 px-5 text-center text-sm font-semibold text-[#86868B]">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  return (
    <>
      <AssessmentProcessToastStack toasts={processToasts} />
      <section className="mt-6 overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.08] px-5 py-4">
          <p className="text-[10px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
            Selected processes ({formatNullableCount(assessment.processCount)})
          </p>
          {processNotice ? (
            <p
              className={`text-[11px] font-bold ${
                updateProcessMutation.isError ? "text-[#EF4444]" : "text-[#10B981]"
              }`}
            >
              {processNotice}
            </p>
          ) : null}
        </div>
        {renderProcessTable(
          assessment.processes,
          "selected",
          "Selected process details are not available for this assessment yet.",
        )}
      </section>

      {customProcesses.length ? (
        <section className="mt-4 overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.08] px-5 py-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
              Custom processes ({customProcesses.length})
            </p>
          </div>
          {renderProcessTable(
            customProcesses,
            "custom",
            "Custom process details are not available for this assessment yet.",
            { editable: false },
          )}
        </section>
      ) : null}
    </>
  );
}

function AssessmentTabContent({
  activeTab,
  assessment,
}: {
  activeTab: Exclude<DetailTab, "overview">;
  assessment: AssessmentSummary;
}) {
  if (activeTab === "processes") {
    return <AssessmentProcesses assessment={assessment} />;
  }

  if (activeTab === "activity") {
    return <AssessmentActivity assessment={assessment} />;
  }

  if (activeTab === "due-diligence") {
    return <AssessmentDueDiligence assessment={assessment} />;
  }

  if (activeTab === "results") {
    return <AssessmentResults assessment={assessment} />;
  }

  if (activeTab === "strategy") {
    return <AssessmentStrategy assessment={assessment} />;
  }

  if (activeTab === "expert") {
    return <AssessmentExpert assessment={assessment} />;
  }

  return <AssessmentNotes assessment={assessment} />;
}

function AssessmentActivity({ assessment }: { assessment: AssessmentSummary }) {
  const items = [
    {
      label: "Assessment created",
      meta: formatDate(assessment.createdAt),
      value: assessment.company,
    },
    {
      label: "Org profile completed",
      meta: assessment.industry,
      value: assessment.domain,
    },
    {
      label: "Processes selected",
      meta: formatNullableCount(assessment.processCount),
      value: assessment.status,
    },
    {
      label: "Last updated",
      meta: formatDate(assessment.updatedAt),
      value: assessment.owner,
    },
  ];

  return (
    <AssessmentDetailPanel title="Activity">
      <div className="divide-y divide-black/[0.08]">
        {items.map((item) => (
          <div key={item.label} className="grid gap-2 py-4 sm:grid-cols-[190px_minmax(0,1fr)_120px] sm:items-center">
            <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">{item.label}</p>
            <p className="min-w-0 truncate text-xs font-bold text-[#171717]">{item.value || "--"}</p>
            <p className="text-xs font-semibold text-[#86868B] sm:text-right">{item.meta || "--"}</p>
          </div>
        ))}
      </div>
    </AssessmentDetailPanel>
  );
}

function AssessmentDueDiligence({ assessment }: { assessment: AssessmentSummary }) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <AssessmentDetailPanel title="Readiness Checklist">
        <ChecklistRow label="Organization profile" value={assessment.domain !== "--" ? "Complete" : "Missing"} />
        <ChecklistRow label="Industry context" value={assessment.industries.length ? "Complete" : "Missing"} />
        <ChecklistRow label="Process selection" value={assessment.processCount ? "Complete" : "Pending"} />
        <ChecklistRow label="Technology stack" value={assessment.selectedStackTools.length ? "Complete" : "Not provided"} />
      </AssessmentDetailPanel>
      <AssessmentDetailPanel title="Due Diligence Inputs">
        <div className="grid gap-5 sm:grid-cols-2">
          <ValueBlock label="Company size" value={assessment.preferences.companySize || "--"} />
          <ValueBlock label="Deployment preference" value={assessment.preferences.deploymentPreference || "--"} />
          <ValueBlock label="Gartner MQ rated only" value={assessment.preferences.magicQuadrant || "--"} />
          <ValueBlock label="AI-native preference" value={assessment.preferences.aiPreference || "--"} />
        </div>
      </AssessmentDetailPanel>
    </div>
  );
}

function AssessmentResults({ assessment }: { assessment: AssessmentSummary }) {
  const topProcesses = assessment.processes.slice(0, 4);

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <AssessmentDetailPanel title="Result Snapshot">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailMetric label="Current DI" value={assessment.score} />
          <DetailMetric label="Potential DI" value={getPotentialDi(assessment.score)} />
          <DetailMetric label="Total cost / yr" value={formatCompactMetric(assessment.cost)} />
          <DetailMetric label="Est. savings / yr" value={formatCompactMetric(assessment.savings)} />
        </div>
      </AssessmentDetailPanel>
      <AssessmentDetailPanel title="Recommendations & Stack Analysis">
        {topProcesses.length ? (
          <div className="divide-y divide-black/[0.08]">
            {topProcesses.map((process) => (
              <div key={getProcessKey(process)} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_110px_110px] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#171717]">{process.name || process.processId || "--"}</p>
                  <p className="mt-1 truncate text-[10px] font-semibold text-[#86868B]">{process.category || "--"}</p>
                </div>
                <p className="text-xs font-bold text-[#007AFF]">{process.tier || "--"}</p>
                <p className="text-xs font-bold text-[#10B981] sm:text-right">
                  {formatAedCurrency(getProcessSaving(process, getProcessCost(process, assessment.currencyConversionRate)))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyTabMessage message="Recommendation details are not available until selected process data is received." />
        )}
      </AssessmentDetailPanel>
    </div>
  );
}

function AssessmentStrategy({ assessment }: { assessment: AssessmentSummary }) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <AssessmentDetailPanel title="Strategy & RFP">
        <div className="grid gap-5 sm:grid-cols-2">
          <ValueBlock label="Primary industry" value={assessment.industry} />
          <ValueBlock label="Domains" value={assessment.domain} />
          <ValueBlock label="Selected processes" value={formatNullableCount(assessment.processCount)} />
          <ValueBlock label="Estimated savings" value={assessment.savings} />
        </div>
      </AssessmentDetailPanel>
      <AssessmentDetailPanel title="RFP Package">
        <ChecklistRow label="Business context" value="Ready" />
        <ChecklistRow label="Process scope" value={assessment.processCount ? "Ready" : "Pending"} />
        <ChecklistRow label="Stack constraints" value={assessment.selectedStackTools.length ? "Ready" : "Optional"} />
        <ChecklistRow label="Owner review" value={assessment.owner || "--"} />
      </AssessmentDetailPanel>
    </div>
  );
}

function AssessmentExpert({ assessment }: { assessment: AssessmentSummary }) {
  return (
    <AssessmentDetailPanel title="Expert">
      <div className="grid gap-5 sm:grid-cols-3">
        <ValueBlock label="Account owner" value={assessment.owner} />
        <ValueBlock label="Industry focus" value={assessment.industry} />
        <ValueBlock label="Pipeline status" value={assessment.status} />
      </div>
      <p className="mt-5 border-t border-black/[0.08] pt-4 text-xs font-semibold text-[#86868B]">
        Expert booking data is not assigned yet. This tab is ready to display consultant allocation once the booking workflow is connected.
      </p>
    </AssessmentDetailPanel>
  );
}

function AssessmentNotes({ assessment }: { assessment: AssessmentSummary }) {
  return (
    <AssessmentDetailPanel title="Notes">
      <div className="min-h-[168px] rounded-md border border-dashed border-black/[0.12] bg-[#FAFAFA] p-4">
        <p className="text-xs font-semibold text-[#86868B]">
          No internal notes have been added for {assessment.company} yet.
        </p>
      </div>
    </AssessmentDetailPanel>
  );
}

function AssessmentDetailPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="mt-6 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] first:mt-0">
      <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">{title}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ChecklistRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/[0.08] py-3 last:border-b-0">
      <p className="text-xs font-bold text-[#171717]">{label}</p>
      <span className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[10px] font-bold text-[#86868B]">{value}</span>
    </div>
  );
}

function EmptyTabMessage({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm font-semibold text-[#86868B]">{message}</p>;
}

function ProcessRow({
  currencyConversionRate,
  editable = true,
  expanded,
  onToggle,
  process,
}: {
  currencyConversionRate: number;
  editable?: boolean;
  expanded: boolean;
  onToggle: () => void;
  process: AdminAssessmentProcess;
}) {
  const automationLevel = Math.min(5, Math.max(1, Number(process.automationLevel) || 1));
  const cost = getProcessCost(process, currencyConversionRate);
  const saving = getProcessSaving(process, cost);

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (!editable) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <tr
      className={`h-[58px] border-b border-black/[0.05] transition last:border-b-0 ${
        editable ? "cursor-pointer hover:bg-[#FAFAFA]" : ""
      }`}
      onClick={editable ? onToggle : undefined}
      onKeyDown={editable ? handleKeyDown : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-expanded={editable ? expanded : undefined}
    >
      <td className="px-5 py-3">
        <p className="truncate text-xs font-bold text-[#171717]">
          <span className="mr-2 inline-block text-[#86868B]">{expanded ? "−" : "+"}</span>
          {process.name || process.processId || "--"}
        </p>
        <p className="mt-1 truncate text-[10px] font-semibold text-[#86868B]">{process.category || "--"}</p>
      </td>
      <td className="px-5 py-3">
        <span className="inline-flex h-6 items-center rounded-full bg-[#ECFDF5] px-2.5 text-[10px] font-bold text-[#10B981]">
          {process.tier || "--"}
        </span>
      </td>
      <td className="px-5 py-3 text-[11px] font-semibold text-[#555555]">
        <span className="mr-1 inline-flex size-4 items-center justify-center rounded bg-[#FF8A3D] text-[9px] font-bold text-white">
          {automationLevel}
        </span>
        {process.automation || getAutomationLabel(automationLevel)}
      </td>
      <td className="px-5 py-3 text-[11px] font-bold text-[#171717]">{formatAedCurrency(cost)}</td>
      <td className="px-5 py-3 text-[11px] font-bold text-[#555555]">{getProcessFteLabel(process)}</td>
      <td className="px-5 py-3 text-[11px] font-bold text-[#555555]">{getProcessSoftwareLabel(process, currencyConversionRate)}</td>
      <td className="px-5 py-3 text-right text-[11px] font-bold text-[#10B981]">{formatAedCurrency(saving)}</td>
    </tr>
  );
}

function AssessmentProcessMobileCard({
  currencyConversionRate,
  editable = true,
  expanded,
  onToggle,
  process,
}: {
  currencyConversionRate: number;
  editable?: boolean;
  expanded: boolean;
  onToggle: () => void;
  process: AdminAssessmentProcess;
}) {
  const automationLevel = Math.min(5, Math.max(1, Number(process.automationLevel) || 1));
  const cost = getProcessCost(process, currencyConversionRate);
  const saving = getProcessSaving(process, cost);
  const auditLabel = getProcessAuditLabel(process);

  return (
    <button
      type="button"
      onClick={editable ? onToggle : undefined}
      aria-expanded={editable ? expanded : undefined}
      disabled={!editable}
      className={`w-full bg-white px-4 py-4 text-left transition ${
        editable ? "hover:bg-[#FAFAFA]" : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-[#171717]">
            {process.name || process.processId || "--"}
          </p>
          <p className="mt-1 break-words text-[11px] font-semibold text-[#86868B]">
            {process.category || "--"}
          </p>
          {auditLabel ? (
            <p className="mt-1 break-words text-[10px] font-semibold text-[#A1A1AA]">
              {auditLabel}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold text-[#10B981]">
          {process.tier || "--"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <MobileMetric label="Automation" value={`${automationLevel} - ${process.automation || getAutomationLabel(automationLevel)}`} />
        <MobileMetric label="Cost / yr" value={formatAedCurrency(cost)} />
        <MobileMetric label="FTEs" value={getProcessFteLabel(process)} />
        <MobileMetric label="Software / yr" value={getProcessSoftwareLabel(process, currencyConversionRate)} />
        <div className="col-span-2 rounded-md bg-[#F8FAFC] px-3 py-2">
          <p className="text-[9px] font-bold tracking-[0.12em] text-[#8E9AAB] uppercase">
            Est. saving
          </p>
          <p className="mt-1 text-xs font-bold text-[#10B981]">
            {formatAedCurrency(saving)}
          </p>
        </div>
      </div>

      {editable ? (
        <span className="mt-3 inline-flex text-[11px] font-bold text-[#007AFF]">
          {expanded ? "Hide details" : "Edit details"}
        </span>
      ) : null}
    </button>
  );
}

function AssessmentProcessEditor({
  currencyConversionRate,
  isSaving,
  onCancel,
  onSave,
  process,
}: {
  currencyConversionRate: number;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (form: ProcessEditFormState) => void;
  process: AdminAssessmentProcess;
}) {
  const [form, setForm] = useState(() => createProcessEditForm(process, currencyConversionRate));

  function updateField(field: keyof ProcessEditFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const totalCost = calculateProcessFormCost(form);
  const auditLabel = getProcessAuditLabel(process);

  return (
    <div className="p-3 sm:p-5">
      <div className="rounded-md border border-black/[0.08] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.08] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#171717]">
              {form.name || process.name || "Selected process"}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-[#86868B]">
              Editing selected assessment process fields{auditLabel ? ` - ${auditLabel}` : ""}
            </p>
          </div>
          <p className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#007AFF]">
            {formatAedCurrency(totalCost)} / yr
          </p>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <Field label="Process efficiency %">
            <input
              value={form.processEfficiencyPercent}
              onChange={(event) => updateField("processEfficiencyPercent", cleanDecimalInput(event.target.value, 100))}
              className={detailInputClass}
              placeholder="e.g. 65"
            />
          </Field>
          <Field label="Digitization level">
            <div className="grid grid-cols-5 overflow-hidden rounded-md border border-black/[0.08]">
              {automationLevelOptions.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateField("automationLevel", String(level))}
                  aria-pressed={Number(form.automationLevel) === level}
                  aria-label={`Set digitization level ${level}`}
                  className={`h-9 border-r border-black/[0.08] text-xs font-bold last:border-r-0 ${
                    Number(form.automationLevel) === level
                      ? "bg-[#10B981] text-white"
                      : "bg-white text-[#555555] hover:bg-[#FAFAFA]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Process name">
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={detailInputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <input
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className={detailInputClass}
              />
            </Field>
            <Field label="Tier">
              <input
                value={form.tier}
                onChange={(event) => updateField("tier", event.target.value)}
                className={detailInputClass}
              />
            </Field>
          </div>
          <Field className="lg:col-span-2" label="Description">
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className={`${detailInputClass} min-h-20 py-2`}
            />
          </Field>
        </div>

        <div className="grid gap-4 border-t border-black/[0.08] p-4 lg:grid-cols-2">
          <section className="rounded-md border border-black/[0.08] bg-[#FAFAFA] p-4">
            <p className="text-[10px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
              FTE & staffing
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Shared FTE pool">
                <input
                  value={form.sharedFtes}
                  onChange={(event) => updateField("sharedFtes", cleanDecimalInput(event.target.value))}
                  className={detailInputClass}
                  placeholder="e.g. 2"
                />
              </Field>
              <Field label="Shared salary / FTE (AED)">
                <input
                  value={form.sharedSalaryAed}
                  onChange={(event) => updateField("sharedSalaryAed", cleanDecimalInput(event.target.value))}
                  className={detailInputClass}
                  placeholder="e.g. 30000"
                />
              </Field>
              <Field label="Allocation for this process %">
                <input
                  value={form.sharedAllocationPercent}
                  onChange={(event) => updateField("sharedAllocationPercent", cleanDecimalInput(event.target.value, 100))}
                  className={detailInputClass}
                  placeholder="e.g. 50"
                />
              </Field>
              <Field label="Dedicated FTEs">
                <input
                  value={form.dedicatedFtes}
                  onChange={(event) => updateField("dedicatedFtes", cleanDecimalInput(event.target.value))}
                  className={detailInputClass}
                  placeholder="e.g. 2"
                />
              </Field>
              <Field label="Dedicated salary / FTE (AED)">
                <input
                  value={form.dedicatedSalaryAed}
                  onChange={(event) => updateField("dedicatedSalaryAed", cleanDecimalInput(event.target.value))}
                  className={detailInputClass}
                  placeholder="e.g. 88000"
                />
              </Field>
              <Field label="Est. hours / year">
                <input
                  value={form.hoursPerYear}
                  onChange={(event) => updateField("hoursPerYear", cleanDecimalInput(event.target.value))}
                  className={detailInputClass}
                  placeholder="e.g. 2080"
                />
              </Field>
            </div>
          </section>
          <section className="rounded-md border border-black/[0.08] bg-[#FAFAFA] p-4">
            <p className="text-[10px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
              Technology cost & stack
            </p>
            <div className="mt-3 grid gap-3">
              <Field label="Software cost / yr (AED)">
                <input
                  value={form.softwareCostAed}
                  onChange={(event) => updateField("softwareCostAed", cleanDecimalInput(event.target.value))}
                  className={detailInputClass}
                  placeholder="e.g. 44000"
                />
              </Field>
              <Field label="Technology stack">
                <textarea
                  value={form.stack}
                  onChange={(event) => updateField("stack", event.target.value)}
                  className={`${detailInputClass} min-h-[132px] py-2`}
                  placeholder="Freshdesk, Mailchimp, ServiceNow CSM"
                />
              </Field>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-black/[0.08] px-4 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={isSaving || !form.name.trim()}
            className="h-9 rounded-md bg-[#007AFF] px-5 text-xs font-bold text-white transition hover:bg-[#006EE6] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[9px] font-bold tracking-[0.12em] text-[#86868B] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function AssessmentProcessToastStack({
  toasts,
}: {
  toasts: AssessmentProcessToast[];
}) {
  const visibleToasts = toasts.slice(0, 3);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-5 bottom-5 z-[70] h-[112px] w-[min(380px,calc(100vw-40px))]"
      aria-label="Assessment process notifications"
    >
      <style>
        {`
          @keyframes assessment-process-toast-enter {
            from {
              opacity: 0;
              transform: translate3d(0, 18px, 0) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
        `}
      </style>
      {visibleToasts.map((toast, index) => {
        const isFrontToast = index === 0;
        const isError = toast.tone === "error";
        const toastDescription = isError
          ? toast.description || "Please retry this selected process update."
          : toast.description || "Selected process details were saved.";

        return (
          <div
            key={toast.id}
            aria-hidden={!isFrontToast}
            aria-live={isError ? "assertive" : "polite"}
            className="absolute right-0 bottom-0 min-h-[72px] w-full overflow-hidden rounded-[11px] border border-black/[0.08] bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
            role={isFrontToast ? (isError ? "alert" : "status") : undefined}
            style={{
              animation: isFrontToast ? "assessment-process-toast-enter 180ms ease-out" : undefined,
              opacity: 1 - index * 0.14,
              transform: `translateY(${index * 15}px) scale(${1 - index * 0.035})`,
              transition: "transform 180ms ease, opacity 180ms ease, box-shadow 180ms ease",
              zIndex: visibleToasts.length - index,
            }}
          >
            {isFrontToast ? (
              <div className="flex items-center gap-3">
                <span className={`size-2.5 shrink-0 rounded-full ${isError ? "bg-[#EF4444]" : "bg-[#10B981]"}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-sm leading-5 font-bold text-[#171717]">{toast.message}</span>
                  <span className="mt-0.5 block truncate text-xs leading-4 font-semibold text-[#86868B]">{toastDescription}</span>
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ValueBlock({
  label,
  muted,
  value,
}: {
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.12em] text-[#86868B] uppercase">{label}</p>
      <p className={`mt-1 text-xs font-bold ${muted ? "text-[#C1C7D0]" : "text-[#171717]"}`}>
        {value || "--"}
      </p>
    </div>
  );
}

function Tag({ label, tone = "gray" }: { label: string; tone?: "blue" | "gray" }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold ${
        tone === "blue" ? "bg-[#EAF3FF] text-[#007AFF]" : "border border-black/[0.08] text-[#86868B]"
      }`}
    >
      {label}
    </span>
  );
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
          className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${
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
        className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
        aria-label="Next page"
      >
        &gt;
      </button>
    </div>
  );
}

const defaultDetailTab: DetailTab = "overview";

function groupAssessmentsByUser(
  rows: AdminAssessmentRow[],
  sortKey: SortKey,
  sortDirection: SortDirection,
) {
  const groupedRows = new Map<string, AdminAssessmentRow[]>();

  rows.forEach((row) => {
    const key = getAssessmentGroupKey(row);
    const currentRows = groupedRows.get(key) ?? [];

    currentRows.push(row);
    groupedRows.set(key, currentRows);
  });

  return Array.from(groupedRows.entries())
    .map(([id, groupRows]) => createAssessmentSummary(id, groupRows))
    .sort((first, second) => compareAssessmentSummaries(first, second, sortKey, sortDirection));
}

function createAssessmentSummary(id: string, rows: AdminAssessmentRow[]): AssessmentSummary {
  const sortedRows = [...rows].sort(
    (first, second) => getSortableTime(second) - getSortableTime(first),
  );
  const latestAssessment = sortedRows[0];
  const industries = getUniqueValues(
    rows.flatMap((row) => getAssessmentIndustries(row)),
  ).filter(
    (industry) => industry !== "--",
  );
  const processes = getUniqueProcesses(rows.flatMap((row) => row.processes ?? []));
  const customProcesses = getUniqueProcesses([
    ...rows.flatMap((row) => row.customProcesses ?? []),
    ...processes.filter(isFrontendCustomProcess),
  ]);
  const explicitProcessCount = rows.reduce((sum, row) => sum + (row.processCount ?? 0), 0);
  const processCount = processes.length || explicitProcessCount || null;

  return {
    assessments: sortedRows,
    company: latestAssessment?.company || "Cost optimization assessment",
    contact: latestAssessment?.contact || "--",
    cost: formatAedCurrency(sumMetric(rows.map((row) => row.cost))),
    createdAt: getEarliestDate(rows.map((row) => row.createdAt || row.updatedAt)),
    currencyConversionRate: getAssessmentCurrencyConversionRate(rows),
    customProcesses,
    domain: getUniqueValues(rows.map((row) => row.domain)).join(", ") || "--",
    email: getUniqueValues(rows.map((row) => row.email))[0] || "",
    id,
    industry: getIndustrySummaryLabel(industries),
    industries,
    owner: latestAssessment?.owner || "--",
    preferences: getAssessmentPreferences(rows),
    processCount,
    processes,
    savings: formatAedCurrency(sumMetric(rows.map((row) => row.savings))),
    score: getBestScore(rows.map((row) => row.score)),
    selectedStackTools: getUniqueValues(rows.flatMap((row) => row.selectedStackTools ?? [])),
    status: latestAssessment?.status || "Draft",
    statusKey: latestAssessment?.statusKey,
    updatedAt: latestAssessment?.updatedAt,
  };
}

function getAssessmentCurrencyConversionRate(rows: AdminAssessmentRow[]) {
  const rate = rows
    .map((row) => Number(row.currencyConversionRate))
    .find((value) => Number.isFinite(value) && value > 0);

  return rate ?? defaultUsdToAedRate;
}

function getAssessmentGroupKey(row: AdminAssessmentRow) {
  const stableUserKey = getContactEmail(row.contact) || `${row.company}-${row.contact}`;

  return getRouteSlug(stableUserKey);
}

function getAssessmentIdFromRouteParam(value: string) {
  const trimmedValue = value.trim();
  const idMatches = trimmedValue.match(/[a-f0-9]{24}/gi);

  if (!idMatches?.length) {
    return trimmedValue;
  }

  return idMatches[idMatches.length - 1];
}

function getAssessmentDetailRouteId(assessment: AssessmentSummary) {
  const assessmentId = assessment.assessments[0]?.id || assessment.id;
  const userSlug = getRouteSlug(getContactName(assessment.contact));
  const companySlug = getRouteSlug(assessment.company);
  const readableSlug = [userSlug, companySlug].filter(Boolean).join("-");

  if (!assessmentId || !readableSlug) {
    return assessmentId;
  }

  return `${readableSlug}-${assessmentId}`;
}

function isAssessmentHighlighted(assessment: AssessmentSummary, highlightKey: string) {
  if (!highlightKey) {
    return false;
  }

  return getAssessmentHighlightKeys(assessment).has(highlightKey);
}

function getAssessmentHighlightKeys(assessment: AssessmentSummary) {
  return new Set(
    [
      assessment.id,
      assessment.company,
      assessment.contact,
      assessment.email,
      getContactEmail(assessment.contact),
      ...assessment.assessments.flatMap((row) => [
        row.id,
        row.company,
        row.contact,
        row.email,
        getContactEmail(row.contact),
        getAssessmentGroupKey(row),
      ]),
    ]
      .map((value) => getRouteSlug(String(value || "")))
      .filter(Boolean),
  );
}

function getIndustrySummaryLabel(industries: string[]) {
  if (!industries.length) {
    return "--";
  }

  if (industries.length === 1) {
    return industries[0];
  }

  return `${industries[0]} +${industries.length - 1}`;
}

function getUniqueProcesses(processes: AdminAssessmentProcess[]) {
  const processByKey = new Map<string, AdminAssessmentProcess>();

  processes.forEach((process) => {
    const key = getProcessKey(process);

    if (key && !processByKey.has(key)) {
      processByKey.set(key, process);
    }
  });

  return Array.from(processByKey.values());
}

function getProcessKey(process: AdminAssessmentProcess) {
  return process.id || process.processId || normalizeSearch(process.name || "");
}

function getProcessSectionKey(sectionKey: string, process: AdminAssessmentProcess) {
  return `${sectionKey}:${getProcessKey(process)}`;
}

function isFrontendCustomProcess(process: AdminAssessmentProcess) {
  return String(process.source || "").trim().toLowerCase() === "industry-domain-custom";
}

function getAssessmentPreferences(rows: AdminAssessmentRow[]) {
  return rows.reduce<NonNullable<AdminAssessmentRow["preferences"]>>(
    (preferences, row) => ({
      aiPreference: preferences.aiPreference || row.preferences?.aiPreference,
      companySize: preferences.companySize || row.preferences?.companySize,
      deploymentPreference:
        preferences.deploymentPreference || row.preferences?.deploymentPreference,
      magicQuadrant: preferences.magicQuadrant || row.preferences?.magicQuadrant,
    }),
    {},
  );
}

function getUniqueValues(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
}

function getBestScore(values: string[]) {
  const numericValues = values
    .map((value) => parseMetricNumber(value))
    .filter((value) => value >= 0);

  if (!numericValues.length) {
    return "--";
  }

  return `${Math.max(...numericValues)}%`;
}

function getContactName(value: string) {
  return value.split(" - ")[0]?.trim() || "--";
}

function getContactEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function getRegion(value: string) {
  const parts = value.split(" - ").map((part) => part.trim()).filter(Boolean);
  const region = parts.find((part) => !part.includes("@") && part !== parts[0]);

  return region || "--";
}

function getEarliestDate(values: Array<string | undefined>) {
  const timestamps = values
    .map((value) => new Date(value || "").getTime())
    .filter(Number.isFinite);

  if (!timestamps.length) {
    return undefined;
  }

  return new Date(Math.min(...timestamps)).toISOString();
}

function formatDate(value?: string) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getProcessAuditLabel(process: AdminAssessmentProcess) {
  const actorName = String(process.updatedBy?.name || "").trim();
  const actorEmail = String(process.updatedBy?.email || "").trim();
  const actorLabel = actorName || actorEmail;
  const dateLabel = formatDate(process.updatedAt);

  if (actorLabel && dateLabel !== "--") {
    return `Updated by ${actorLabel} on ${dateLabel}`;
  }

  if (actorLabel) {
    return `Updated by ${actorLabel}`;
  }

  return dateLabel !== "--" ? `Updated ${dateLabel}` : "";
}

function sumMetric(values: string[]) {
  return values.reduce((sum, value) => {
    const numericValue = parseMetricNumber(value);

    return numericValue > 0 ? sum + numericValue : sum;
  }, 0);
}

function formatAedCurrency(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "--";
  }

  return `AED ${Math.round(value).toLocaleString("en-US")}`;
}

function formatCompactMetric(value: string) {
  const numericValue = parseMetricNumber(value);

  if (numericValue < 0) {
    return value || "--";
  }

  if (numericValue >= 1_000_000) {
    return `AED ${Math.round(numericValue / 100_000) / 10}m`;
  }

  if (numericValue >= 1_000) {
    return `AED ${Math.round(numericValue / 1_000)}k`;
  }

  return value;
}

function formatNullableCount(value: number | null) {
  return value === null ? "--" : String(value);
}

function getPotentialDi(value: string) {
  const currentScore = parseMetricNumber(value);

  if (currentScore < 0) {
    return "75%";
  }

  return `${Math.min(95, Math.max(75, currentScore + 25))}%`;
}

function getCurrencyAmountAed(
  value?: { amount?: number; currency?: string } | null,
  currencyConversionRate = defaultUsdToAedRate,
) {
  const amount = Number(value?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return value?.currency === "USD"
    ? Math.round(amount * currencyConversionRate)
    : Math.round(amount);
}

function formatNumberInput(value: number | undefined) {
  if (!Number.isFinite(value) || Number(value) <= 0) {
    return "";
  }

  const roundedValue = Math.round(Number(value) * 100) / 100;
  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(/0+$/, "").replace(/\.$/, "");
}

function parseFormNumber(value: string) {
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function cleanDecimalInput(value: string, maxValue = Number.POSITIVE_INFINITY) {
  const cleanedValue = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");

  if (!cleanedValue) {
    return "";
  }

  return formatNumberInput(Math.min(parseFormNumber(cleanedValue), maxValue));
}

function createProcessEditForm(
  process: AdminAssessmentProcess,
  currencyConversionRate = defaultUsdToAedRate,
): ProcessEditFormState {
  const costInputs = process.costInputs;
  const sharedFtePool = costInputs?.sharedFtePool;
  const dedicatedFte = costInputs?.dedicatedFte;

  return {
    automationLevel: String(Math.min(5, Math.max(1, Number(process.automationLevel) || 1))),
    category: process.category || "",
    dedicatedFtes: formatNumberInput(dedicatedFte?.count),
    dedicatedSalaryAed: formatNumberInput(getCurrencyAmountAed(dedicatedFte?.annualSalaryPerFte, currencyConversionRate)),
    description: process.description || "",
    hoursPerYear: formatNumberInput(process.hoursPerYear),
    name: process.name || process.processId || "",
    processEfficiencyPercent: formatNumberInput(costInputs?.efficiencyPercent),
    sharedAllocationPercent: formatNumberInput(sharedFtePool?.allocationPercent),
    sharedFtes: formatNumberInput(sharedFtePool?.count),
    sharedSalaryAed: formatNumberInput(getCurrencyAmountAed(sharedFtePool?.annualSalaryPerFte, currencyConversionRate)),
    softwareCostAed: formatNumberInput(
      getCurrencyAmountAed(costInputs?.nonStaffingAnnualCost, currencyConversionRate) ||
        getProcessCost(process, currencyConversionRate),
    ),
    stack: (process.stack ?? []).join(", "),
    tier: process.tier || "",
  };
}

function calculateProcessFormCost(form: ProcessEditFormState) {
  const sharedFtes = parseFormNumber(form.sharedFtes);
  const sharedAllocationPercent = Math.min(100, parseFormNumber(form.sharedAllocationPercent));
  const sharedSalaryAed = parseFormNumber(form.sharedSalaryAed);
  const dedicatedFtes = parseFormNumber(form.dedicatedFtes);
  const dedicatedSalaryAed = parseFormNumber(form.dedicatedSalaryAed);
  const softwareCostAed = parseFormNumber(form.softwareCostAed);

  return Math.max(
    0,
    Math.round(
      softwareCostAed +
        sharedFtes * (sharedAllocationPercent / 100) * sharedSalaryAed +
        dedicatedFtes * dedicatedSalaryAed,
    ),
  );
}

function getProcessFormHours(form: ProcessEditFormState) {
  const explicitHours = parseFormNumber(form.hoursPerYear);

  if (explicitHours > 0) {
    return Math.round(explicitHours);
  }

  const sharedFtes = parseFormNumber(form.sharedFtes);
  const sharedAllocationPercent = Math.min(100, parseFormNumber(form.sharedAllocationPercent));
  const dedicatedFtes = parseFormNumber(form.dedicatedFtes);
  const totalFtes = sharedFtes * (sharedAllocationPercent / 100) + dedicatedFtes;

  return Math.round(totalFtes * 2080);
}

function buildProcessUpdatePayload(
  process: AdminAssessmentProcess,
  form: ProcessEditFormState,
): AdminAssessmentProcess {
  const totalCostAed = calculateProcessFormCost(form);
  const softwareCostAed = Math.round(parseFormNumber(form.softwareCostAed));
  const efficiencyPercent = parseFormNumber(form.processEfficiencyPercent);
  const sharedFtes = parseFormNumber(form.sharedFtes);
  const sharedSalaryAed = Math.round(parseFormNumber(form.sharedSalaryAed));
  const sharedAllocationPercent = Math.min(100, parseFormNumber(form.sharedAllocationPercent));
  const dedicatedFtes = parseFormNumber(form.dedicatedFtes);
  const dedicatedSalaryAed = Math.round(parseFormNumber(form.dedicatedSalaryAed));
  const stack = form.stack
    .split(/[,;\n]/)
    .map((tool) => tool.trim())
    .filter(Boolean);

  return {
    automationLevel: Math.min(5, Math.max(1, Math.round(parseFormNumber(form.automationLevel) || 1))),
    category: form.category.trim(),
    costInputs: {
      dedicatedFte: {
        annualSalaryPerFte: { amount: dedicatedSalaryAed, currency: "AED" },
        count: dedicatedFtes,
      },
      efficiencyPercent,
      nonStaffingAnnualCost: { amount: softwareCostAed, currency: "AED" },
      sharedFtePool: {
        allocationPercent: sharedAllocationPercent,
        annualSalaryPerFte: { amount: sharedSalaryAed, currency: "AED" },
        count: sharedFtes,
      },
    },
    description: form.description.trim(),
    estimatedCost: {
      amount: totalCostAed,
      baseAmount: { amount: totalCostAed, currency: "AED" },
      currency: "AED",
    },
    hoursPerYear: getProcessFormHours(form),
    id: process.id,
    name: form.name.trim(),
    source: process.source,
    stack,
    tier: form.tier.trim(),
  };
}

function getProcessFteLabel(process: AdminAssessmentProcess) {
  const sharedFtePool = process.costInputs?.sharedFtePool;
  const dedicatedFte = process.costInputs?.dedicatedFte;
  const sharedFtes = Number(sharedFtePool?.count) || 0;
  const allocationPercent = Number(sharedFtePool?.allocationPercent) || 0;
  const dedicatedFtes = Number(dedicatedFte?.count) || 0;
  const totalFtes = sharedFtes * (allocationPercent / 100) + dedicatedFtes;

  if (totalFtes > 0) {
    return formatNumberInput(totalFtes);
  }

  return process.ftes || "--";
}

function getProcessSoftwareLabel(
  process: AdminAssessmentProcess,
  currencyConversionRate = defaultUsdToAedRate,
) {
  const softwareCost = getCurrencyAmountAed(
    process.costInputs?.nonStaffingAnnualCost,
    currencyConversionRate,
  );

  if (softwareCost > 0) {
    return formatAedCurrency(softwareCost);
  }

  return process.software || "--";
}

function getProcessCost(
  process: AdminAssessmentProcess,
  currencyConversionRate = defaultUsdToAedRate,
) {
  const explicitCost = parseMetricNumber(process.cost || "");

  if (explicitCost > 0) {
    return explicitCost;
  }

  const estimatedCost = process.estimatedCost;
  const amount = Number(estimatedCost?.amount);

  if (Number.isFinite(amount) && amount > 0) {
    return estimatedCost?.currency === "USD"
      ? Math.round(amount * currencyConversionRate)
      : Math.round(amount);
  }

  const baseAmount = Number(estimatedCost?.baseAmount?.amount);

  if (Number.isFinite(baseAmount) && baseAmount > 0) {
    return estimatedCost?.baseAmount?.currency === "USD"
      ? Math.round(baseAmount * currencyConversionRate)
      : Math.round(baseAmount);
  }

  return 0;
}

function getProcessSaving(process: AdminAssessmentProcess, cost: number) {
  const explicitSaving = parseMetricNumber(process.saving || "");

  if (explicitSaving > 0) {
    return explicitSaving;
  }

  return Math.round(cost * getAssessmentSavingRate(process.automationLevel));
}

function getAssessmentSavingRate(level: number | undefined) {
  const automationLevel = Number(level) || 1;

  if (automationLevel >= 5) return 0;
  if (automationLevel >= 4) return 0.15;
  if (automationLevel >= 3) return 0.3;
  return 0.45;
}

function getAutomationLabel(level: number) {
  if (level >= 5) return "Autonomous";
  if (level >= 4) return "Highly Automated";
  if (level >= 3) return "Partially Automated";
  if (level >= 2) return "Mostly Manual";
  return "Manual";
}

function getVisiblePages(page: number, pageCount: number) {
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getStatusTone(status: string, statusKey = ""): keyof typeof statusStyles {
  const normalizedStatusKey = normalizeStatusKey(statusKey);

  if (normalizedStatusKey === "closed-won") {
    return "green";
  }

  if (normalizedStatusKey === "closed-lost") {
    return "red";
  }

  if (normalizedStatusKey === "expert-booked") {
    return "blue";
  }

  if (normalizedStatusKey === "due-diligence" || normalizedStatusKey === "results-ready") {
    return "blueLight";
  }

  const normalizedStatus = normalizeStatusKey(status);

  if (normalizedStatus === "due-diligence" || normalizedStatus === "results-ready") {
    return "blueLight";
  }

  if (normalizedStatus === "expert-booked") {
    return "blue";
  }

  return "gray";
}

function compareAssessments(
  first: AdminAssessmentRow,
  second: AdminAssessmentRow,
  sortKey: SortKey,
  direction: SortDirection,
) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  if (sortKey === "company") {
    return first.company.localeCompare(second.company) * directionMultiplier;
  }

  return (
    (parseMetricNumber(first[sortKey]) - parseMetricNumber(second[sortKey])) *
    directionMultiplier
  );
}

function compareAssessmentSummaries(
  first: AssessmentSummary,
  second: AssessmentSummary,
  sortKey: SortKey,
  direction: SortDirection,
) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  if (sortKey === "company") {
    return first.company.localeCompare(second.company) * directionMultiplier;
  }

  return (
    (parseMetricNumber(first[sortKey]) - parseMetricNumber(second[sortKey])) *
    directionMultiplier
  );
}

function getIndustryOptions(rows: AdminAssessmentRow[], catalogIndustries: Array<{ name: string }>) {
  return getUniqueValues([
    ...catalogIndustries.map((industry) => industry.name),
    ...rows.flatMap((row) => getAssessmentIndustries(row)),
  ]).sort(
    (first, second) => first.localeCompare(second),
  );
}

function getAssessmentIndustries(row: Pick<AdminAssessmentRow, "industry">) {
  return getUniqueValues(String(row.industry || "").split(",")).filter((industry) => industry !== "--");
}

function getUniqueOptions(rows: AdminAssessmentRow[], key: "industry" | "status") {
  return Array.from(
    new Set(rows.map((row) => row[key]).filter((value) => value && value !== "--")),
  ).sort((first, second) => first.localeCompare(second));
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getRouteSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeStatusKey(value: string) {
  return value.trim().toLowerCase().replace(/_+/g, "-").replace(/\s+/g, "-");
}

function parseMetricNumber(value: string) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  const numericValue = Number(normalizedValue.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numericValue)) {
    return -1;
  }

  if (normalizedValue.includes("m")) {
    return numericValue * 1_000_000;
  }

  if (normalizedValue.includes("k")) {
    return numericValue * 1_000;
  }

  return numericValue;
}

function getDateStartTime(value: string) {
  if (!value) {
    return null;
  }

  const time = new Date(`${value}T00:00:00`).getTime();

  return Number.isFinite(time) ? time : null;
}

function getDateEndTime(value: string) {
  if (!value) {
    return null;
  }

  const time = new Date(`${value}T23:59:59`).getTime();

  return Number.isFinite(time) ? time : null;
}

function getAssessmentUpdatedTime(assessment: AdminAssessmentRow) {
  const time = new Date(assessment.updatedAt || "").getTime();

  return Number.isFinite(time) ? time : null;
}

function getSortableTime(assessment: AdminAssessmentRow) {
  return getAssessmentUpdatedTime(assessment) ?? 0;
}

function exportAssessmentsCsv(rows: AdminAssessmentRow[]) {
  const headers = ["Company", "Contact", "Industry", "DI Score", "Total Cost", "Savings", "Status"];
  const csvRows = rows.map((row) => [
    row.company,
    row.contact,
    row.industry,
    row.score,
    row.cost,
    row.savings,
    row.status,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `cos-assessments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  const normalizedValue = String(value ?? "");

  if (/[",\n\r]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load assessments";
}
