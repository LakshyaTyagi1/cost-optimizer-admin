"use client";

import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeft,
  Mail,
} from "lucide-react";

import {
  useAdminAssessment,
  useAdminAssessments,
} from "@/features/assessments/queries";
import { useDataDictionaryCatalog } from "@/features/data-dictionary/queries";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { SkeletonBlock } from "@/components/ui/skeleton/skeleton-block";
import {
  createAssessmentSummary,
  getAssessmentDetailRouteId,
  getContactEmail,
  getContactName,
  getProcessKey,
  getRegion,
  getRouteSlug,
  groupAssessmentsByUser,
  isAssessmentHighlighted,
  isFrontendCustomProcess,
} from "@/features/assessments/utils/assessment-summary";
import {
  createAssessmentListRows,
  filterAssessmentRows,
  getAssessmentIndustryOptions,
  getAssessmentStatusOptions,
  type AssessmentCatalogIndustry,
  type AssessmentFilters,
} from "@/features/assessments/utils/assessment-list";
import {
  formatBaseCurrency,
  formatCompactCurrencyMetric,
  formatDate,
  formatNullableCount,
  formatNumberInput,
  formatPercentValue,
  getPotentialDi,
} from "@/features/assessments/utils/formatters";
import {
  formatCurrencyAmountInBaseCurrency,
  getAutomationLabel,
  getProcessAuditLabel,
  getProcessCostInBaseCurrency,
  getProcessFteLabel,
  getProcessSavingInBaseCurrency,
  getProcessSoftwareCostLabel,
} from "@/features/assessments/utils/process-metrics";
import { AssessmentDetailMetric as DetailMetric } from "@/features/assessments/components/assessment-detail-metric";
import { AssessmentDetailView } from "@/features/assessments/components/assessment-detail-view";
import { AssessmentProcessesPanel as AssessmentProcesses } from "@/features/assessments/components/assessment-processes-panel";
import { AssessmentsTable } from "@/features/assessments/components/assessments-table";
import type { AdminAssessmentRow } from "@/features/assessments/model";
import type {
  AssessmentSummary,
  DetailTab,
  SortDirection,
  SortKey,
} from "@/features/assessments/view-model";
export type { DetailTab } from "@/features/assessments/view-model";

const pageSize = 10;
const emptyAssessments: AdminAssessmentRow[] = [];
const emptyCatalogIndustries: AssessmentCatalogIndustry[] = [];
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

  const { data, error, isLoading } = useAdminAssessments();
  const { data: industryCatalog } = useDataDictionaryCatalog();

  const assessments = data?.assessments ?? emptyAssessments;
  const totalAssessments = data?.totalAssessments ?? assessments.length;
  const errorMessage = error ? getErrorMessage(error) : "";
  const catalogIndustries = industryCatalog?.industries ?? emptyCatalogIndustries;
  const assessmentListRows = useMemo(
    () => createAssessmentListRows(assessments),
    [assessments],
  );
  const assessmentFilters = useMemo<AssessmentFilters>(
    () => ({
      fromDateFilter,
      industryFilter,
      minimumScoreFilter,
      searchQuery,
      statusFilter,
      toDateFilter,
    }),
    [
      fromDateFilter,
      industryFilter,
      minimumScoreFilter,
      searchQuery,
      statusFilter,
      toDateFilter,
    ],
  );
  const industryOptions = useMemo(
    () => getAssessmentIndustryOptions(assessmentListRows, catalogIndustries),
    [assessmentListRows, catalogIndustries],
  );
  const statusOptions = useMemo(
    () => getAssessmentStatusOptions(assessments),
    [assessments],
  );
  const filteredAssessments = useMemo(
    () =>
      filterAssessmentRows(
        assessmentListRows,
        assessmentFilters,
        sortKey,
        sortDirection,
      ),
    [assessmentFilters, assessmentListRows, sortDirection, sortKey],
  );

  const assessmentSummaries = useMemo(
    () => groupAssessmentsByUser(filteredAssessments, sortKey, sortDirection),
    [filteredAssessments, sortDirection, sortKey],
  );
  const highlightedAssessmentParam = searchParams.get("assessment") || "";
  const highlightedAssessmentKey = useMemo(
    () => getRouteSlug(highlightedAssessmentParam),
    [highlightedAssessmentParam],
  );
  const highlightedAssessmentIndex = useMemo(
    () =>
      highlightedAssessmentKey
        ? assessmentSummaries.findIndex((assessment) =>
            isAssessmentHighlighted(assessment, highlightedAssessmentKey),
          )
        : -1,
    [assessmentSummaries, highlightedAssessmentKey],
  );
  const highlightedAssessmentPage = useMemo(
    () =>
      highlightedAssessmentIndex >= 0
        ? Math.floor(highlightedAssessmentIndex / pageSize) + 1
        : null,
    [highlightedAssessmentIndex],
  );
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
  const pagedAssessments = useMemo(
    () =>
      assessmentSummaries.slice(
        (activePage - 1) * pageSize,
        activePage * pageSize,
      ),
    [activePage, assessmentSummaries],
  );

  const handleSort = useCallback((nextSortKey: SortKey) => {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }, [sortKey]);

  const updateFilter = useCallback((setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setIndustryFilter("all");
    setStatusFilter("all");
    setMinimumScoreFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setPage(1);
  }, []);

  const openAssessment = useCallback((assessmentId: string) => {
    router.push(`/assessments/${encodeURIComponent(assessmentId)}`);
  }, [router]);

  const handleExportAssessments = useCallback(() => {
    exportAssessmentsCsv(filteredAssessments);
  }, [filteredAssessments]);

  const handleFromDateFilterChange = useCallback(
    (value: string) => updateFilter(setFromDateFilter, value),
    [updateFilter],
  );
  const handleIndustryFilterChange = useCallback(
    (value: string) => updateFilter(setIndustryFilter, value),
    [updateFilter],
  );
  const handleMinimumScoreFilterChange = useCallback(
    (value: string) => updateFilter(setMinimumScoreFilter, value),
    [updateFilter],
  );
  const handleOpenAssessment = useCallback(
    (assessment: AssessmentSummary) => openAssessment(getAssessmentDetailRouteId(assessment)),
    [openAssessment],
  );
  const handleSearchQueryChange = useCallback(
    (value: string) => updateFilter(setSearchQuery, value),
    [updateFilter],
  );
  const handleStatusFilterChange = useCallback(
    (value: string) => updateFilter(setStatusFilter, value),
    [updateFilter],
  );
  const handleToDateFilterChange = useCallback(
    (value: string) => updateFilter(setToDateFilter, value),
    [updateFilter],
  );

  return (
    <AdminShell activeItem="Assessments">
      <div className="flex min-h-[calc(100vh-56px)] flex-col lg:h-full lg:min-h-0 lg:overflow-hidden lg:pr-6">
        <header className="shrink-0 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight font-semibold leading-[39px] tracking-[0.22px] text-[#171717]">Assessments</h1>
              <p className="mt-1 text-[13px] font-normal leading-[19.5px] tracking-[-0.08px] text-[#86868B]">
              {isLoading
                ? "Loading submissions..."
                : `${assessmentSummaries.length} users from ${totalAssessments} total submissions`}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={handleExportAssessments}
              disabled={!filteredAssessments.length}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-medium leading-[18px] text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <ArrowDownToLine size={13} aria-hidden="true" />
              Export CSV
            </button>
          </div>
        </header>

        <AssessmentsTable
          activePage={activePage}
          errorMessage={errorMessage}
          firstRowIndex={firstRowIndex}
          fromDateFilter={fromDateFilter}
          hasActiveFilters={hasActiveFilters}
          highlightedAssessmentKey={highlightedAssessmentKey}
          industryFilter={industryFilter}
          industryOptions={industryOptions}
          isAssessmentHighlighted={isAssessmentHighlighted}
          isLoading={isLoading}
          lastRowIndex={lastRowIndex}
          minimumScoreFilter={minimumScoreFilter}
          onFromDateFilterChange={handleFromDateFilterChange}
          onIndustryFilterChange={handleIndustryFilterChange}
          onMinimumScoreFilterChange={handleMinimumScoreFilterChange}
          onOpenAssessment={handleOpenAssessment}
          onPageChange={setPage}
          onResetFilters={resetFilters}
          onSearchQueryChange={handleSearchQueryChange}
          onSort={handleSort}
          onStatusFilterChange={handleStatusFilterChange}
          onToDateFilterChange={handleToDateFilterChange}
          pageCount={pageCount}
          pagedAssessments={pagedAssessments}
          searchQuery={searchQuery}
          sortDirection={sortDirection}
          sortKey={sortKey}
          statusFilter={statusFilter}
          statusOptions={statusOptions}
          toDateFilter={toDateFilter}
          totalAssessments={totalAssessments}
          visibleAssessmentCount={assessmentSummaries.length}
        />
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
  const { data, error, isLoading } = useAdminAssessment(routeAssessmentId);
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
  const detailMetrics = useMemo(
    () =>
      assessment
        ? [
            {
              label: "Processes selected",
              value: formatNullableCount(assessment.processCount),
            },
            { label: "Current DI", value: assessment.score },
            { label: "Potential DI", value: getPotentialDi(assessment.score) },
            { label: "Total cost / yr", value: formatCompactCurrencyMetric(assessment.cost) },
            { label: "Est. savings / yr", value: formatCompactCurrencyMetric(assessment.savings) },
          ]
        : [],
    [assessment],
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
        metrics={detailMetrics}
        onBack={backToAssessments}
        onPrint={() => window.print()}
        onTabChange={updateDetailTab}
      >
        {activeTab === "overview" ? (
          <AssessmentOverview assessment={assessment} />
        ) : (
          <AssessmentTabContent activeTab={activeTab} assessment={assessment} />
        )}
      </AssessmentDetailView>
    </AdminShell>
  );
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

function AssessmentTabContent({
  activeTab,
  assessment,
}: {
  activeTab: Exclude<DetailTab, "overview">;
  assessment: AssessmentSummary;
}) {
  if (activeTab === "processes") {
    return (
      <AssessmentProcesses
        assessment={assessment}
        formatBaseCurrency={formatBaseCurrency}
        formatCurrencyAmountInBaseCurrency={formatCurrencyAmountInBaseCurrency}
        formatNumberInput={formatNumberInput}
        formatPercentValue={formatPercentValue}
        getAutomationLabel={getAutomationLabel}
        getProcessAuditLabel={getProcessAuditLabel}
        getProcessCostInBaseCurrency={getProcessCostInBaseCurrency}
        getProcessFteLabel={getProcessFteLabel}
        getProcessKey={getProcessKey}
        getProcessSavingInBaseCurrency={getProcessSavingInBaseCurrency}
        getProcessSoftwareCostLabel={getProcessSoftwareCostLabel}
        isCustomProcess={isFrontendCustomProcess}
      />
    );
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
          <DetailMetric label="Total cost / yr" value={formatCompactCurrencyMetric(assessment.cost)} />
          <DetailMetric label="Est. savings / yr" value={formatCompactCurrencyMetric(assessment.savings)} />
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
                  {formatBaseCurrency(getProcessSavingInBaseCurrency(process, getProcessCostInBaseCurrency(process, assessment.currencyConversionRate)))}
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

const defaultDetailTab: DetailTab = "overview";

function getAssessmentIdFromRouteParam(value: string) {
  const trimmedValue = value.trim();
  const idMatches = trimmedValue.match(/[a-f0-9]{24}/gi);

  if (!idMatches?.length) {
    return trimmedValue;
  }

  return idMatches[idMatches.length - 1];
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
