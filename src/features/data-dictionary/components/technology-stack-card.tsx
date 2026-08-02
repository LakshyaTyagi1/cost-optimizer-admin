"use client";

import { useCallback, useMemo, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state/empty-state";
import { PaginationSummary } from "@/features/data-dictionary/components/pagination-summary";
import { SearchInput } from "@/features/data-dictionary/components/search-input";
import type {
  DictionaryDomain,
  DictionaryIndustry,
  TechStackTool,
} from "@/features/data-dictionary/model";
import { getPaginationPages } from "@/features/data-dictionary/utils/pagination";
import type {
  TechStackToolModalProps,
  ToolFormState,
} from "@/components/data-dictionary/tech-stack-tool-modal";

const technologyStackLibraryPageSize = 20;

const TechStackToolModal = dynamic<TechStackToolModalProps>(
  () =>
    import("@/components/data-dictionary/tech-stack-tool-modal").then(
      (module) => module.TechStackToolModal,
    ),
  { ssr: false },
);

export function TechnologyStackCard({
  domains,
  filteredTools,
  industries,
  isCatalogLoading,
  isDeletingAllTools,
  isToolDeleting,
  isToolFormOpen,
  isToolSaving,
  setToolForm,
  setToolPage,
  setToolScopeFilter,
  setToolSearch,
  toolForm,
  toolActionId,
  toolPage,
  toolScopeFilter,
  toolSearch,
  toolTotalCount,
  editingTool,
  onAddTool,
  onCloseToolForm,
  onDeleteAllTools,
  onDeleteTool,
  onEditTool,
  onOpenNewToolForm,
}: {
  domains: DictionaryDomain[];
  filteredTools: TechStackTool[];
  industries: DictionaryIndustry[];
  isCatalogLoading: boolean;
  isDeletingAllTools: boolean;
  isToolDeleting: boolean;
  isToolFormOpen: boolean;
  isToolSaving: boolean;
  setToolForm: (value: ToolFormState | ((current: ToolFormState) => ToolFormState)) => void;
  setToolPage: (value: number) => void;
  setToolScopeFilter: (value: string) => void;
  setToolSearch: (value: string) => void;
  toolForm: ToolFormState;
  toolActionId: string;
  toolPage: number;
  toolScopeFilter: string;
  toolSearch: string;
  toolTotalCount: number;
  editingTool: TechStackTool | null;
  onAddTool: (event: FormEvent<HTMLFormElement>) => void;
  onCloseToolForm: () => void;
  onDeleteAllTools: () => void;
  onDeleteTool: (tool: TechStackTool) => void;
  onEditTool: (tool: TechStackTool) => void;
  onOpenNewToolForm: () => void;
}) {
  const totalToolPages = Math.ceil(toolTotalCount / technologyStackLibraryPageSize);
  const safeToolPage = Math.min(Math.max(toolPage, 1), Math.max(totalToolPages, 1));
  const toolStartIndex = (safeToolPage - 1) * technologyStackLibraryPageSize;
  const visibleTools = filteredTools;
  const selectedToolIndustryId = toolForm.industryId || industries[0]?.id || "";
  const toolDomains = useMemo(
    () =>
      domains.filter((domain) =>
        selectedToolIndustryId ? domain.industryIds.includes(selectedToolIndustryId) : true,
      ),
    [domains, selectedToolIndustryId],
  );
  const toolPaginationPages = useMemo(
    () => getPaginationPages(totalToolPages, safeToolPage),
    [safeToolPage, totalToolPages],
  );
  const canAddTool = Boolean(
    toolForm.name.trim() && toolForm.vendor.trim() && toolForm.category.trim(),
  );
  const hasToolFilters = Boolean(toolSearch.trim() || toolScopeFilter !== "all");
  const emptyToolMessage = hasToolFilters
    ? "No tools match the selected filters. Reset filters to view all tools."
    : "No tools added yet. Add a tool to build the technology stack library.";
  const canDeleteAllTools = toolTotalCount > 0 && !isToolDeleting && !isToolSaving;
  const isAddToolDisabled = isToolDeleting || isToolSaving;
  const deleteAllToolsLabel = isDeletingAllTools
    ? "Deleting all technology stack tools"
    : toolTotalCount === 0
      ? "No technology stack tools to delete"
      : isToolDeleting || isToolSaving
        ? "Technology stack update in progress"
        : "Delete all technology stack tools";
  const addToolLabel = isAddToolDisabled
    ? "Technology stack update in progress"
    : "Add technology stack tool";
  const handleToolScopeFilterChange = useCallback(
    (value: string) => setToolScopeFilter(value),
    [setToolScopeFilter],
  );
  const handleResetToolFilters = useCallback(() => {
    setToolSearch("");
    setToolScopeFilter("all");
    setToolPage(1);
  }, [setToolPage, setToolScopeFilter, setToolSearch]);

  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-md border border-black/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] px-6">
        <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
          Technology Stack Library ({toolTotalCount})
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDeleteAllTools}
            disabled={!canDeleteAllTools}
            aria-label={deleteAllToolsLabel}
            title={deleteAllToolsLabel}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#EF4444] transition hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeletingAllTools ? (
              <span className="size-3 animate-spin rounded-full border border-[#EF4444]/30 border-t-[#EF4444]" aria-hidden="true" />
            ) : (
              <Trash2 size={12} aria-hidden="true" />
            )}
            {isDeletingAllTools ? "Deleting..." : "Delete all"}
          </button>
          <button
            type="button"
            onClick={onOpenNewToolForm}
            disabled={isAddToolDisabled}
            aria-label={addToolLabel}
            title={addToolLabel}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#007AFF] transition hover:text-[#0051D5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={12} aria-hidden="true" />
            Add Tool
          </button>
        </div>
      </div>
      <div className="px-6 pt-5">
        {isCatalogLoading ? (
          <TechnologyStackSkeleton />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <SearchInput
                value={toolSearch}
                onChange={setToolSearch}
                placeholder="Search tools or vendors..."
                className="w-full sm:w-[280px]"
              />
              <label
                className="relative flex h-9 w-full min-w-0 items-center rounded-md border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[#007AFF] sm:w-[180px]"
                title="Filter technology stack tools by scope"
              >
                <select
                  value={toolScopeFilter}
                  onChange={(event) => handleToolScopeFilterChange(event.target.value)}
                  className="h-full w-full rounded-md bg-transparent px-3 text-xs font-semibold text-[#555555] outline-none focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
                >
                  <option value="all">All tools</option>
                  <option value="common">Global tools</option>
                  <option value="industry">Industry default</option>
                  <option value="domain">Industry + domain</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handleResetToolFilters}
                disabled={!hasToolFilters}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[#D9E3F0] bg-white px-3 text-xs font-bold text-[#555555] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#B8D8FF] hover:text-[#007AFF] disabled:cursor-not-allowed disabled:border-black/[0.06] disabled:bg-[#F5F5F7] disabled:text-[#A1A1AA] sm:w-auto"
                aria-label="Reset technology stack filters"
                title="Reset technology stack filters"
              >
                <RotateCcw size={13} aria-hidden="true" />
                Reset filters
              </button>
            </div>
            {isToolFormOpen ? (
              <TechStackToolModal
                canAddTool={canAddTool}
                domains={toolDomains}
                industries={industries}
                isToolSaving={isToolSaving}
                editingTool={editingTool}
                selectedIndustryId={selectedToolIndustryId}
                onClose={onCloseToolForm}
                setToolForm={setToolForm}
                toolForm={toolForm}
                onAddTool={onAddTool}
              />
            ) : null}
            {visibleTools.length ? (
              <div className="mt-5 grid min-h-[48px] gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTools.map((tool) => (
                  <article
                    key={tool.id}
                    className="relative min-h-[48px] min-w-0 rounded-md border border-black/[0.08] bg-white px-3 py-2 pr-16"
                  >
                    <p className="truncate text-[12px] leading-4 font-bold" title={tool.name}>
                      {tool.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] leading-4 font-semibold text-[#86868B]">
                      {tool.vendor} - {tool.category} - {getTechStackScopeLabel(tool)}
                    </p>
                    <button
                      type="button"
                      aria-label={`Edit ${tool.name}`}
                      title={`Edit ${tool.name}`}
                      disabled={isToolDeleting || isToolSaving}
                      onClick={() => onEditTool(tool)}
                      className="absolute top-2 right-9 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#007AFF] focus-visible:bg-[#F5F5F7] focus-visible:text-[#007AFF] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {toolActionId === tool.id && isToolSaving ? (
                        <span className="size-3 animate-spin rounded-full border border-[#86868B]/30 border-t-[#007AFF]" />
                      ) : (
                        <Pencil size={14} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${tool.name}`}
                      title={`Delete ${tool.name}`}
                      disabled={isToolDeleting || isToolSaving}
                      onClick={() => onDeleteTool(tool)}
                      className="absolute top-2 right-2 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#EF4444] focus-visible:bg-[#F5F5F7] focus-visible:text-[#EF4444] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {toolActionId === tool.id ? (
                        <span className="size-3 animate-spin rounded-full border border-[#86868B]/30 border-t-[#EF4444]" />
                      ) : (
                        <Trash2 size={14} aria-hidden="true" />
                      )}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState className="mt-5 min-h-[78px]" label={emptyToolMessage} />
            )}
            <PaginationSummary
              currentPage={safeToolPage}
              label={
                toolTotalCount
                  ? `Showing ${toolStartIndex + 1}-${Math.min(
                      toolStartIndex + technologyStackLibraryPageSize,
                      toolTotalCount,
                    )} of ${toolTotalCount}`
                : "Showing 0 of 0"
              }
              onPageChange={setToolPage}
              pages={toolPaginationPages}
              variant="technologyStack"
            />
          </>
        )}
      </div>
    </section>
  );
}

function TechnologyStackSkeleton() {
  return (
    <div
      className="animate-pulse transition-opacity duration-200 ease-out"
      aria-label="Loading technology stack library"
    >
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-full rounded-md border border-black/[0.06] bg-[#F8F8FA] sm:w-[280px]" />
        <div className="h-9 w-full rounded-md border border-black/[0.06] bg-[#F8F8FA] sm:w-[180px]" />
      </div>
      <div className="mt-5 grid min-h-[384px] gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: technologyStackLibraryPageSize }).map((_, toolSkeletonIndex) => (
          <div
            key={toolSkeletonIndex}
            className="min-h-[48px] rounded-md border border-black/[0.06] bg-white px-3 py-2"
          >
            <div className="h-3.5 w-32 rounded bg-[#EEF0F3]" />
            <div className="mt-2 h-3 w-52 max-w-full rounded bg-[#EEF0F3]" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-4 w-28 rounded bg-[#EEF0F3]" />
    </div>
  );
}

function getTechStackScopeLabel(tool: TechStackTool) {
  if (tool.scope === "common") {
    return "Global tool";
  }

  if (tool.scope === "industry-domain") {
    return `${tool.industryName || "Industry"} / ${tool.domainName || "Domain"}`;
  }

  return tool.industryName || "Industry default";
}
