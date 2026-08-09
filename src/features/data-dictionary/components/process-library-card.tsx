"use client";

import type { FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { PaginationSummary } from "@/features/data-dictionary/components/pagination-summary";
import { SearchInput } from "@/features/data-dictionary/components/search-input";
import { TierPill } from "@/features/data-dictionary/components/tier-pill";
import type {
  DictionaryDomain,
  DictionaryIndustry,
  DictionaryLibrary,
  DictionaryProcess,
  ProcessOption,
} from "@/features/data-dictionary/model";
import {
  getDomainDisplayTitle,
  getDomainIdentity,
  getLibraryIdentity,
  getUniqueDomains,
} from "@/features/data-dictionary/utils/domain-mapping";
import { getPaginationPages } from "@/features/data-dictionary/utils/pagination";
import type {
  NewProcessModalProps,
  ProcessFormState,
} from "@/components/data-dictionary/new-process-modal";
import type { IndustryDefaultsWorkspaceProps } from "@/features/data-dictionary/components/industry-defaults-workspace";
import type { IndustryDomainDefaultsWorkspaceProps } from "@/features/data-dictionary/components/industry-domain-defaults-workspace";

const industryDefaultDomainFilter = "industry-default";
const processLibraryPageSize = 10;

const NewProcessModal = dynamic<NewProcessModalProps>(
  () =>
    import("@/components/data-dictionary/new-process-modal").then(
      (module) => module.NewProcessModal,
    ),
  { ssr: false },
);

const IndustryDefaultsWorkspace = dynamic<IndustryDefaultsWorkspaceProps>(
  () =>
    import("@/features/data-dictionary/components/industry-defaults-workspace").then(
      (module) => module.IndustryDefaultsWorkspace,
    ),
  { ssr: false },
);

const IndustryDomainDefaultsWorkspace = dynamic<IndustryDomainDefaultsWorkspaceProps>(
  () =>
    import("@/features/data-dictionary/components/industry-domain-defaults-workspace").then(
      (module) => module.IndustryDomainDefaultsWorkspace,
    ),
  { ssr: false },
);

export function ProcessLibraryCard({
  categoryOptions,
  tierOptions,
  currencyRateInput,
  domains,
  dictionaryError,
  editingProcess,
  expandedProcessId,
  filteredProcesses,
  industries,
  isCatalogLoading,
  isDefaultDomainProcessesSaving,
  isDefaultProcessesSaving,
  isCurrencyRateSaving,
  isProcessSaving,
  isProcessFormOpen,
  processDomainFilter,
  processForm,
  processActionId,
  processIndustryFilter,
  processPage,
  processSearch,
  processes,
  libraries,
  savedDisplayToBaseCurrencyRate,
  setExpandedProcessId,
  setCurrencyRateInput,
  setIsProcessFormOpen,
  setProcessDomainFilter,
  setProcessForm,
  setProcessIndustryFilter,
  setProcessPage,
  setProcessSearch,
  onAddProcess,
  onAddDefaultDomainProcesses,
  onAddDefaultProcesses,
  onDeleteProcess,
  onEditProcess,
  onOpenNewProcessForm,
  onSaveCurrencyRate,
  onToggleProcessStatus,
}: {
  categoryOptions: readonly ProcessOption[];
  tierOptions: readonly ProcessOption[];
  currencyRateInput: string;
  domains: DictionaryDomain[];
  dictionaryError: string;
  editingProcess: DictionaryProcess | null;
  expandedProcessId: string;
  filteredProcesses: DictionaryProcess[];
  industries: DictionaryIndustry[];
  isCatalogLoading: boolean;
  isDefaultDomainProcessesSaving: boolean;
  isDefaultProcessesSaving: boolean;
  isCurrencyRateSaving: boolean;
  isProcessSaving: boolean;
  isProcessFormOpen: boolean;
  processDomainFilter: string;
  processForm: ProcessFormState;
  processActionId: string;
  processIndustryFilter: string;
  processPage: number;
  processSearch: string;
  processes: DictionaryProcess[];
  libraries: DictionaryLibrary[];
  savedDisplayToBaseCurrencyRate: number;
  setExpandedProcessId: (value: string) => void;
  setCurrencyRateInput: (value: string) => void;
  setIsProcessFormOpen: (value: boolean) => void;
  setProcessDomainFilter: (value: string) => void;
  setProcessForm: (
    value: ProcessFormState | ((current: ProcessFormState) => ProcessFormState),
  ) => void;
  setProcessIndustryFilter: (value: string) => void;
  setProcessPage: (value: number) => void;
  setProcessSearch: (value: string) => void;
  onAddProcess: (event: FormEvent<HTMLFormElement>) => void;
  onAddDefaultDomainProcesses: (industryDomainId?: string) => Promise<boolean>;
  onAddDefaultProcesses: (industryId?: string) => Promise<boolean>;
  onDeleteProcess: (process: DictionaryProcess) => void;
  onEditProcess: (process: DictionaryProcess) => void;
  onOpenNewProcessForm: () => void;
  onSaveCurrencyRate: () => void;
  onToggleProcessStatus: (process: DictionaryProcess) => void;
}) {
  const [isDefaultIndustryDialogOpen, setIsDefaultIndustryDialogOpen] = useState(false);
  const [isDefaultIndustryDomainDialogOpen, setIsDefaultIndustryDomainDialogOpen] = useState(false);
  const totalProcessPages = Math.ceil(filteredProcesses.length / processLibraryPageSize);
  const safeProcessPage = Math.min(Math.max(processPage, 1), Math.max(totalProcessPages, 1));
  const processStartIndex = (safeProcessPage - 1) * processLibraryPageSize;
  const visibleProcesses = useMemo(
    () => filteredProcesses.slice(processStartIndex, processStartIndex + processLibraryPageSize),
    [filteredProcesses, processStartIndex],
  );
  const processPaginationPages = useMemo(
    () => getPaginationPages(totalProcessPages, safeProcessPage),
    [safeProcessPage, totalProcessPages],
  );
  const domainFilterOptions = useMemo(() => getUniqueDomains(domains), [domains]);
  const preferredIndustryDomainId = useMemo(() => {
    const hasIndustryFilter = processIndustryFilter !== "all";
    const hasDomainFilter =
      processDomainFilter !== "all" && processDomainFilter !== industryDefaultDomainFilter;

    return (
      libraries.find(
        (library) =>
          (!hasIndustryFilter || library.industryId === processIndustryFilter) &&
          (!hasDomainFilter || getLibraryIdentity(library) === processDomainFilter),
      )?.id ||
      libraries[0]?.id ||
      ""
    );
  }, [libraries, processDomainFilter, processIndustryFilter]);
  const hasProcessFilters =
    processSearch.trim() || processIndustryFilter !== "all" || processDomainFilter !== "all";
  const handleProcessIndustryFilterChange = useCallback(
    (nextIndustryFilter: string) => {
      setProcessIndustryFilter(nextIndustryFilter);
      if (nextIndustryFilter !== "all") {
        setProcessDomainFilter(industryDefaultDomainFilter);
      }
    },
    [setProcessDomainFilter, setProcessIndustryFilter],
  );
  const handleResetProcessFilters = useCallback(() => {
    setProcessSearch("");
    setProcessIndustryFilter("all");
    setProcessDomainFilter("all");
    setProcessPage(1);
  }, [setProcessDomainFilter, setProcessIndustryFilter, setProcessPage, setProcessSearch]);

  function openDefaultIndustryDialog() {
    setIsDefaultIndustryDialogOpen(true);
  }

  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-md border border-black/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] px-5">
        <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
          Process Library ({processes.length})
        </p>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={openDefaultIndustryDialog}
            disabled={isCatalogLoading || isProcessSaving || industries.length === 0}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-[#007AFF]/25 px-3 text-xs font-bold text-[#007AFF] transition hover:border-[#007AFF]/45 hover:bg-[#F8FAFF] hover:text-[#0051D5] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Choose an industry and add its missing industry-specific defaults"
            title="Add only the selected industry's missing default processes"
          >
            {isDefaultProcessesSaving ? (
              <span
                className="size-3 animate-spin rounded-full border border-[#007AFF]/30 border-t-[#007AFF]"
                aria-hidden="true"
              />
            ) : (
              <Sparkles size={12} aria-hidden="true" />
            )}
            {isDefaultProcessesSaving ? "Adding defaults..." : "Add Industry Defaults"}
          </button>
          <button
            type="button"
            onClick={() => setIsDefaultIndustryDomainDialogOpen(true)}
            disabled={isCatalogLoading || isProcessSaving || libraries.length === 0}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-[#007AFF]/25 px-3 text-xs font-bold text-[#007AFF] transition hover:border-[#007AFF]/45 hover:bg-[#F8FAFF] hover:text-[#0051D5] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Choose an industry and domain mapping and add its missing domain defaults"
            title="Add only the selected industry and domain mapping's missing default processes"
          >
            {isDefaultDomainProcessesSaving ? (
              <span
                className="size-3 animate-spin rounded-full border border-[#007AFF]/30 border-t-[#007AFF]"
                aria-hidden="true"
              />
            ) : (
              <Sparkles size={12} aria-hidden="true" />
            )}
            {isDefaultDomainProcessesSaving
              ? "Adding defaults..."
              : "Add Industry × Domain Defaults"}
          </button>
          <button
            type="button"
            onClick={onOpenNewProcessForm}
            disabled={isCatalogLoading || isProcessSaving}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-[#007AFF]/25 px-3 text-xs font-bold text-[#007AFF] transition hover:border-[#007AFF]/45 hover:bg-[#F8FAFF] hover:text-[#0051D5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={12} aria-hidden="true" />
            Add Process
          </button>
        </div>
      </div>
      {isDefaultIndustryDialogOpen ? (
        <IndustryDefaultsWorkspace
          industries={industries}
          initialIndustryId={
            processIndustryFilter !== "all" &&
            industries.some((industry) => industry.id === processIndustryFilter)
              ? processIndustryFilter
              : industries[0]?.id || ""
          }
          isSeeding={isDefaultProcessesSaving}
          onClose={() => setIsDefaultIndustryDialogOpen(false)}
          onSeedDefaults={onAddDefaultProcesses}
        />
      ) : null}
      {isDefaultIndustryDomainDialogOpen ? (
        <IndustryDomainDefaultsWorkspace
          initialIndustryDomainId={preferredIndustryDomainId}
          isSeeding={isDefaultDomainProcessesSaving}
          libraries={libraries}
          onClose={() => setIsDefaultIndustryDomainDialogOpen(false)}
          onSeedDefaults={onAddDefaultDomainProcesses}
        />
      ) : null}
      <div className="px-5 pt-4">
        <div className="flex flex-wrap gap-2">
          <SearchInput
            value={processSearch}
            onChange={setProcessSearch}
            placeholder="Search processes..."
            className="w-full sm:w-[238px]"
          />
          <label
            className="relative flex h-9 w-full min-w-0 items-center rounded-md border border-[#D9E3F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/10 hover:border-[#B8D8FF] sm:w-[190px]"
            title="Filter processes by industry"
          >
            <Building2
              size={14}
              className="pointer-events-none absolute left-3 text-[#A1A1AA]"
              aria-hidden="true"
            />
            <select
              value={processIndustryFilter}
              onChange={(event) => handleProcessIndustryFilterChange(event.target.value)}
              aria-label="Filter processes by industry"
              className="h-full w-full appearance-none rounded-md bg-transparent pr-9 pl-9 text-sm font-semibold text-[#333333] outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none"
            >
              <option value="all">All industries</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 text-[#86868B]"
              aria-hidden="true"
            />
          </label>
          <label
            className="relative flex h-9 w-full min-w-0 items-center rounded-md border border-[#D9E3F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/10 hover:border-[#B8D8FF] sm:w-[190px]"
            title="Filter processes by domain"
          >
            <Database
              size={14}
              className="pointer-events-none absolute left-3 text-[#A1A1AA]"
              aria-hidden="true"
            />
            <select
              value={processDomainFilter}
              onChange={(event) => setProcessDomainFilter(event.target.value)}
              aria-label="Filter processes by domain"
              className="h-full w-full appearance-none rounded-md bg-transparent pr-9 pl-9 text-sm font-semibold text-[#333333] outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none"
            >
              <option value="all">All domains</option>
              <option value={industryDefaultDomainFilter}>Industry default</option>
              {domainFilterOptions.map((domain) => (
                <option key={getDomainIdentity(domain)} value={domain.id}>
                  {getDomainDisplayTitle(domain.name)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 text-[#86868B]"
              aria-hidden="true"
            />
          </label>
          <button
            type="button"
            onClick={handleResetProcessFilters}
            disabled={!hasProcessFilters}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[#D9E3F0] bg-white px-3 text-xs font-bold text-[#555555] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#B8D8FF] hover:text-[#007AFF] disabled:cursor-not-allowed disabled:border-black/[0.06] disabled:bg-[#F5F5F7] disabled:text-[#A1A1AA] sm:w-auto"
            aria-label="Reset process filters"
            title="Reset process filters"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset filters
          </button>
        </div>
        {isProcessFormOpen ? (
          <NewProcessModal
            domains={domains}
            industries={industries}
            isCurrencyRateSaving={isCurrencyRateSaving}
            isEditing={Boolean(editingProcess)}
            isProcessSaving={isProcessSaving}
            categoryOptions={categoryOptions}
            tierOptions={tierOptions}
            currencyRateInput={currencyRateInput}
            processForm={processForm}
            savedDisplayToBaseCurrencyRate={savedDisplayToBaseCurrencyRate}
            setCurrencyRateInput={setCurrencyRateInput}
            setIsProcessFormOpen={setIsProcessFormOpen}
            setProcessForm={setProcessForm}
            submitLabel={editingProcess ? "Save Changes" : "Add Process"}
            onAddProcess={onAddProcess}
            onSaveCurrencyRate={onSaveCurrencyRate}
          />
        ) : null}
        <div className="mt-4 min-h-[584px] max-w-full border-t border-black/[0.05] bg-white transition-[min-height] duration-200 ease-out">
          <div className="md:hidden">
            {isCatalogLoading ? <ProcessMobileRowsSkeleton /> : null}
            {!isCatalogLoading && filteredProcesses.length === 0 ? (
              <ProcessListState label={dictionaryError || "No mapped processes found."} />
            ) : null}
            {!isCatalogLoading
              ? visibleProcesses.map((process) => (
                  <ProcessMobileRow
                    key={process.id}
                    expanded={expandedProcessId === process.id}
                    industries={industries}
                    isBusy={processActionId === process.id}
                    process={process}
                    onDelete={() => onDeleteProcess(process)}
                    onEdit={() => onEditProcess(process)}
                    onToggle={() =>
                      setExpandedProcessId(expandedProcessId === process.id ? "" : process.id)
                    }
                    onToggleStatus={() => onToggleProcessStatus(process)}
                  />
                ))
              : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[860px] lg:min-w-[1040px]">
              {isCatalogLoading ? <ProcessRowsSkeleton /> : null}
              {!isCatalogLoading && filteredProcesses.length === 0 ? (
                <ProcessListState label={dictionaryError || "No mapped processes found."} />
              ) : null}
              {!isCatalogLoading
                ? visibleProcesses.map((process) => (
                    <ProcessRow
                      key={process.id}
                      expanded={expandedProcessId === process.id}
                      industries={industries}
                      isBusy={processActionId === process.id}
                      process={process}
                      onDelete={() => onDeleteProcess(process)}
                      onEdit={() => onEditProcess(process)}
                      onToggle={() =>
                        setExpandedProcessId(expandedProcessId === process.id ? "" : process.id)
                      }
                      onToggleStatus={() => onToggleProcessStatus(process)}
                    />
                  ))
                : null}
            </div>
          </div>
        </div>
        <PaginationSummary
          currentPage={safeProcessPage}
          label={
            filteredProcesses.length
              ? `Showing ${processStartIndex + 1}-${Math.min(
                  processStartIndex + processLibraryPageSize,
                  filteredProcesses.length,
                )} of ${filteredProcesses.length}`
              : "Showing 0 of 0"
          }
          onPageChange={setProcessPage}
          pages={processPaginationPages}
          variant="processLibrary"
        />
      </div>
    </section>
  );
}

function ProcessRow({
  expanded,
  industries,
  isBusy,
  process,
  onDelete,
  onEdit,
  onToggle,
  onToggleStatus,
}: {
  expanded: boolean;
  industries: DictionaryIndustry[];
  isBusy: boolean;
  process: DictionaryProcess;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onToggleStatus: () => void;
}) {
  const industryLabel =
    process.industryIds.length === industries.length
      ? "All industries"
      : process.industryLabel || `${process.industryIds.length} industries`;
  const isActive = process.isActive !== false;

  return (
    <article
      className={`border-b border-black/[0.05] bg-white last:border-b-0 ${
        isActive ? "" : "opacity-75"
      }`}
    >
      <div
        className={`flex min-h-[46px] w-full items-center gap-3 bg-white px-4 transition hover:bg-[#FAFAFA] ${
          expanded ? "border-b border-black/[0.05]" : ""
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          className="grid min-w-0 flex-1 grid-cols-[32px_78px_minmax(240px,1fr)] items-center gap-2 text-left outline-none focus-visible:ring-0"
        >
          <span className="flex items-center justify-center">
            <ChevronRight
              size={14}
              className={`text-[#B8C0CC] transition ${expanded ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
          </span>
          <span className="text-[11px] font-bold tracking-[0.02em] text-[#AAAAAA]">
            {process.code}
          </span>
          <span className="truncate text-[13px] font-bold text-[#333333]">{process.name}</span>
        </button>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-10">
          <div className="flex shrink-0 items-center justify-end gap-4">
            <span className="text-right text-[11px] font-semibold text-[#86868B]">
              {getDomainCode(process.domain)}
            </span>
            <TierPill compact tier={process.tier} />
            <span className="max-w-[120px] truncate text-right text-[11px] font-semibold text-[#AAAAAA]">
              {industryLabel}
            </span>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              disabled={isBusy}
              className="inline-flex size-7 items-center justify-center rounded-md border border-black/[0.08] bg-white text-[#007AFF] transition hover:border-[#007AFF] hover:bg-[#F4FAFF] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Edit process"
              title="Edit process"
            >
              <svg
                className="pointer-events-none size-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15.8226 9.83829C16.0429 9.61805 16.1667 9.31932 16.1668 9.00781C16.1668 8.69631 16.0431 8.39754 15.8228 8.17725C15.6026 7.95695 15.3039 7.83317 14.9924 7.83313C14.6809 7.83309 14.3821 7.9568 14.1618 8.17704L8.60097 13.7391C8.50423 13.8356 8.43268 13.9543 8.39264 14.085L7.84222 15.8983C7.83145 15.9343 7.83064 15.9726 7.83987 16.0091C7.84909 16.0455 7.86802 16.0788 7.89463 16.1054C7.92125 16.1319 7.95456 16.1508 7.99103 16.16C8.02751 16.1692 8.06579 16.1683 8.1018 16.1575L9.91555 15.6075C10.046 15.5678 10.1648 15.4967 10.2614 15.4004L15.8226 9.83829Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              disabled={isBusy}
              className="inline-flex size-7 items-center justify-center rounded-md border border-[#FECACA] bg-white text-[#EF4444] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Delete process"
              title="Delete process"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleStatus();
              }}
              disabled={isBusy}
              className={`w-[72px] rounded-full py-1 text-right text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive ? "text-[#10B981]" : "text-[#86868B] hover:text-[#555555]"
              }`}
              title={isActive ? "Deactivate process" : "Activate process"}
              aria-label={isActive ? "Deactivate process" : "Activate process"}
            >
              {isBusy ? "Saving" : isActive ? "Active" : "Inactive"}
            </button>
          </div>
        </div>
      </div>
      {expanded ? (
        <div className="min-h-[124px] bg-[#FAFAFA] ps-12 pe-8 pt-3 pb-5">
          <p className="max-w-[620px] text-[11px] leading-5 font-semibold text-[#86868B]">
            {process.description || "Process details are available for this mapped COS process."}
          </p>
          <div className="mt-4 grid gap-6 text-xs font-semibold text-[#86868B] md:grid-cols-[210px_190px_190px_140px]">
            <Metric label="Domain" value={process.domain} />
            <Metric label="Default Cost / Yr" value={process.cost} />
            <Metric label="Default Hours / Yr" value={process.hours} />
            <Metric label="Source" value={process.source} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ProcessMobileRow({
  expanded,
  industries,
  isBusy,
  process,
  onDelete,
  onEdit,
  onToggle,
  onToggleStatus,
}: {
  expanded: boolean;
  industries: DictionaryIndustry[];
  isBusy: boolean;
  process: DictionaryProcess;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onToggleStatus: () => void;
}) {
  const industryLabel =
    process.industryIds.length === industries.length
      ? "All industries"
      : process.industryLabel || `${process.industryIds.length} industries`;
  const isActive = process.isActive !== false;

  return (
    <article
      className={`border-b border-black/[0.05] bg-white last:border-b-0 ${
        isActive ? "" : "opacity-75"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full px-4 py-4 text-left transition hover:bg-[#FAFAFA]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.02em] text-[#AAAAAA]">{process.code}</p>
            <h3 className="mt-1 text-sm font-bold break-words text-[#333333]">{process.name}</h3>
            <p className="mt-1 text-xs leading-5 font-semibold break-words text-[#86868B]">
              {process.description || "Process details are available for this mapped COS process."}
            </p>
          </div>
          <TierPill compact tier={process.tier} />
        </div>
        <span className="mt-3 inline-flex text-[11px] font-bold text-[#007AFF]">
          {expanded ? "Hide details" : "View details"}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-black/[0.05] bg-[#FAFAFA] px-4 py-4">
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-[#86868B]">
            <Metric label="Domain" value={process.domain} />
            <Metric label="Default Cost / Yr" value={process.cost} />
            <Metric label="Default Hours / Yr" value={process.hours} />
            <Metric label="Source" value={process.source} />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={onEdit}
          disabled={isBusy}
          className="inline-flex h-9 items-center justify-center rounded-md border border-black/[0.08] bg-white text-xs font-bold text-[#007AFF] transition hover:border-[#007AFF] hover:bg-[#F4FAFF] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Edit ${process.name}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          className="inline-flex h-9 items-center justify-center rounded-md border border-[#FECACA] bg-white text-xs font-bold text-[#EF4444] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Delete ${process.name}`}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onToggleStatus}
          disabled={isBusy}
          className={`inline-flex h-9 items-center justify-center rounded-md border text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isActive
              ? "border-[#B7E4CE] bg-[#F0FDF4] text-[#10B981]"
              : "border-black/[0.08] bg-[#F5F5F7] text-[#86868B]"
          }`}
          aria-label={isActive ? `Deactivate ${process.name}` : `Activate ${process.name}`}
        >
          {isBusy ? "Saving" : isActive ? "Active" : "Inactive"}
        </button>
      </div>

      <p className="px-4 pb-4 text-[11px] font-semibold text-[#AAAAAA]">
        {getDomainCode(process.domain)} - {industryLabel}
      </p>
    </article>
  );
}

function ProcessRowsSkeleton() {
  return (
    <div
      className="animate-pulse bg-white transition-opacity duration-200 ease-out"
      aria-label="Loading mapped COS processes"
    >
      {Array.from({ length: processLibraryPageSize }).map((_, rowIndex) => (
        <div key={rowIndex} className={rowIndex > 0 ? "border-t border-black/[0.05]" : ""}>
          <div className="flex min-h-[46px] w-full items-center gap-3 px-4">
            <div className="grid min-w-0 flex-1 grid-cols-[32px_78px_minmax(240px,1fr)] items-center gap-2">
              <div className="mx-auto size-3 rounded-full bg-[#EEF0F3]" />
              <div className="h-3 w-10 rounded bg-[#EEF0F3]" />
              <div className="h-4 w-40 rounded bg-[#EEF0F3]" />
            </div>
            <div className="ml-auto flex shrink-0 items-center justify-end gap-10">
              <div className="flex shrink-0 items-center justify-end gap-2">
                <div className="h-3 w-5 rounded bg-[#EEF0F3]" />
                <div className="h-6 w-28 rounded-full bg-[#E8F6EF]" />
                <div className="h-3 w-16 rounded bg-[#EEF0F3]" />
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2.5">
                <div className="size-7 rounded-md bg-[#EEF0F3]" />
                <div className="size-7 rounded-md bg-[#EEF0F3]" />
                <div className="h-4 w-12 rounded bg-[#EEF0F3]" />
              </div>
            </div>
          </div>
          {rowIndex === 0 ? (
            <div className="min-h-[124px] bg-[#FAFAFA] ps-12 pe-8 pt-3 pb-5">
              <div className="h-3 w-56 rounded bg-[#EEF0F3]" />
              <div className="mt-7 grid gap-6 md:grid-cols-[210px_190px_190px_140px]">
                {[0, 1, 2, 3].map((metricSkeletonIndex) => (
                  <div key={metricSkeletonIndex}>
                    <div className="h-3 w-24 rounded bg-[#EEF0F3]" />
                    <div className="mt-3 h-4 w-28 rounded bg-[#EEF0F3]" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProcessMobileRowsSkeleton() {
  return (
    <div
      className="animate-pulse divide-y divide-black/[0.05] bg-white transition-opacity duration-200 ease-out"
      aria-label="Loading mapped COS processes"
    >
      {Array.from({ length: processLibraryPageSize }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="h-3 w-12 rounded bg-[#EEF0F3]" />
          <div className="mt-2 h-4 w-48 max-w-full rounded bg-[#EEF0F3]" />
          <div className="mt-2 h-3 w-full rounded bg-[#EEF0F3]" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-md bg-[#EEF0F3]" />
            <div className="h-12 rounded-md bg-[#EEF0F3]" />
            <div className="h-12 rounded-md bg-[#EEF0F3]" />
            <div className="h-12 rounded-md bg-[#EEF0F3]" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-9 rounded-md bg-[#EEF0F3]" />
            <div className="h-9 rounded-md bg-[#EEF0F3]" />
            <div className="h-9 rounded-md bg-[#EEF0F3]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProcessListState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[170px] items-center justify-center bg-white px-4 py-8 text-center text-sm font-semibold text-[#86868B]">
      {label}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.08em] text-[#C1C7D0] uppercase">{label}</p>
      <p className="mt-1 font-bold text-[#555555]">{value}</p>
    </div>
  );
}

function getDomainCode(domain: string) {
  if (domain === "CX") return "CX";
  if (domain === "Customer Experience") return "CX";
  if (domain === "HR") return "HR";
  if (domain === "Human Resources") return "HR";
  if (domain === "IT Operations") return "IT";
  if (domain === "IT Ops") return "IT";

  return domain
    .replace(/&/g, "")
    .split(/\s+|\//)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}
