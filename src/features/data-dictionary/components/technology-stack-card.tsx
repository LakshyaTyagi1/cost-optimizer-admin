"use client";

import { useMemo, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state/empty-state";
import { PaginationSummary } from "@/features/data-dictionary/components/pagination-summary";
import { SearchInput } from "@/features/data-dictionary/components/search-input";
import type { TechStackTool } from "@/features/data-dictionary/model";
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
  filteredTools,
  isActivatingAllTools,
  isArchivingAllTools,
  isCatalogLoading,
  isDeletingAllTools,
  isToolDeleting,
  isToolFormOpen,
  isToolSaving,
  isToolStatusSaving,
  setToolForm,
  setToolPage,
  setToolSearch,
  toolForm,
  toolActionId,
  toolPage,
  toolSearch,
  toolTotalCount,
  editingTool,
  onAddTool,
  onActivateAllTools,
  onArchiveAllTools,
  onCloseToolForm,
  onDeleteAllTools,
  onDeleteTool,
  onEditTool,
  onOpenNewToolForm,
  onToggleToolStatus,
}: {
  filteredTools: TechStackTool[];
  isActivatingAllTools: boolean;
  isArchivingAllTools: boolean;
  isCatalogLoading: boolean;
  isDeletingAllTools: boolean;
  isToolDeleting: boolean;
  isToolFormOpen: boolean;
  isToolSaving: boolean;
  isToolStatusSaving: boolean;
  setToolForm: (value: ToolFormState | ((current: ToolFormState) => ToolFormState)) => void;
  setToolPage: (value: number) => void;
  setToolSearch: (value: string) => void;
  toolForm: ToolFormState;
  toolActionId: string;
  toolPage: number;
  toolSearch: string;
  toolTotalCount: number;
  editingTool: TechStackTool | null;
  onAddTool: (event: FormEvent<HTMLFormElement>) => void;
  onActivateAllTools: () => void;
  onArchiveAllTools: () => void;
  onCloseToolForm: () => void;
  onDeleteAllTools: () => void;
  onDeleteTool: (tool: TechStackTool) => void;
  onEditTool: (tool: TechStackTool) => void;
  onOpenNewToolForm: () => void;
  onToggleToolStatus: (tool: TechStackTool) => void;
}) {
  const totalToolPages = Math.ceil(toolTotalCount / technologyStackLibraryPageSize);
  const safeToolPage = Math.min(Math.max(toolPage, 1), Math.max(totalToolPages, 1));
  const toolStartIndex = (safeToolPage - 1) * technologyStackLibraryPageSize;
  const visibleTools = filteredTools;
  const toolPaginationPages = useMemo(
    () => getPaginationPages(totalToolPages, safeToolPage),
    [safeToolPage, totalToolPages],
  );
  const canAddTool = Boolean(
    toolForm.name.trim() && toolForm.vendor.trim() && toolForm.category.trim(),
  );
  const hasToolSearch = Boolean(toolSearch.trim());
  const emptyToolMessage = hasToolSearch
    ? "No tools match your search. Clear the search to view all tools."
    : "No tools added yet. Add a tool to build the technology stack library.";
  const isAnyToolMutation =
    isActivatingAllTools ||
    isArchivingAllTools ||
    isToolDeleting ||
    isToolSaving ||
    isToolStatusSaving;
  const canActivateAllTools = toolTotalCount > 0 && !isAnyToolMutation;
  const canArchiveAllTools = toolTotalCount > 0 && !isAnyToolMutation;
  const canDeleteAllTools = toolTotalCount > 0 && !isAnyToolMutation;
  const isAddToolDisabled = isAnyToolMutation;
  const deleteAllToolsLabel = isDeletingAllTools
    ? "Deleting all technology stack tools"
    : toolTotalCount === 0
      ? "No technology stack tools to delete"
      : isAnyToolMutation
        ? "Technology stack update in progress"
        : "Delete all technology stack tools";
  const archiveAllToolsLabel = isArchivingAllTools
    ? "Archiving all technology stack tools"
    : toolTotalCount === 0
      ? "No technology stack tools to archive"
      : isAnyToolMutation
        ? "Technology stack update in progress"
        : "Archive all technology stack tools";
  const activateAllToolsLabel = isActivatingAllTools
    ? "Activating all archived technology stack tools"
    : toolTotalCount === 0
      ? "No archived technology stack tools to activate"
      : isAnyToolMutation
        ? "Technology stack update in progress"
        : "Activate all archived technology stack tools";
  const addToolLabel = isAddToolDisabled
    ? "Technology stack update in progress"
    : "Add technology stack tool";
  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-md border border-black/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] px-6">
        <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
          Technology Stack Library ({toolTotalCount})
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2 py-2">
          <button
            type="button"
            onClick={onActivateAllTools}
            disabled={!canActivateAllTools}
            aria-label={activateAllToolsLabel}
            title={activateAllToolsLabel}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 text-xs font-bold text-[#15803D] transition hover:border-[#86EFAC] hover:bg-[#DCFCE7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActivatingAllTools ? (
              <span className="size-3 animate-spin rounded-full border border-[#15803D]/30 border-t-[#15803D]" aria-hidden="true" />
            ) : (
              <ArchiveRestore size={13} aria-hidden="true" />
            )}
            {isActivatingAllTools ? "Activating..." : "Activate All"}
          </button>
          <button
            type="button"
            onClick={onArchiveAllTools}
            disabled={!canArchiveAllTools}
            aria-label={archiveAllToolsLabel}
            title={archiveAllToolsLabel}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-2.5 text-xs font-bold text-[#A16207] transition hover:border-[#FCD34D] hover:bg-[#FEF3C7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isArchivingAllTools ? (
              <span className="size-3 animate-spin rounded-full border border-[#A16207]/30 border-t-[#A16207]" aria-hidden="true" />
            ) : (
              <Archive size={13} aria-hidden="true" />
            )}
            {isArchivingAllTools ? "Archiving..." : "Archive All"}
          </button>
          <button
            type="button"
            onClick={onDeleteAllTools}
            disabled={!canDeleteAllTools}
            aria-label={deleteAllToolsLabel}
            title={deleteAllToolsLabel}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-2.5 text-xs font-bold text-[#DC2626] transition hover:border-[#FCA5A5] hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeletingAllTools ? (
              <span className="size-3 animate-spin rounded-full border border-[#EF4444]/30 border-t-[#EF4444]" aria-hidden="true" />
            ) : (
              <Trash2 size={13} aria-hidden="true" />
            )}
            {isDeletingAllTools ? "Deleting..." : "Delete All"}
          </button>
          <button
            type="button"
            onClick={onOpenNewToolForm}
            disabled={isAddToolDisabled}
            aria-label={addToolLabel}
            title={addToolLabel}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#007AFF] bg-[#007AFF] px-2.5 text-xs font-bold text-white transition hover:border-[#006EE6] hover:bg-[#006EE6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={13} aria-hidden="true" />
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
                showClearOnHover
                className="w-full sm:w-[280px]"
              />
            </div>
            {isToolFormOpen ? (
              <TechStackToolModal
                canAddTool={canAddTool}
                isToolSaving={isToolSaving}
                editingTool={editingTool}
                onClose={onCloseToolForm}
                setToolForm={setToolForm}
                toolForm={toolForm}
                onAddTool={onAddTool}
              />
            ) : null}
            {visibleTools.length ? (
              <div className="mt-5 grid min-h-[48px] gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTools.map((tool) => {
                  const isActive = tool.isActive !== false;
                  const isStatusSaving = isToolStatusSaving && toolActionId === tool.id;

                  return (
                    <article
                      key={tool.id}
                      className={`flex min-h-[58px] min-w-0 items-center gap-3 rounded-md border border-black/[0.08] bg-white px-3 py-2 ${
                        isActive ? "" : "opacity-75"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] leading-4 font-bold" title={tool.name}>
                          {tool.name}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[11px] leading-4 font-semibold text-[#86868B]"
                          title={`${tool.vendor} - ${tool.category}`}
                        >
                          {tool.vendor} - {tool.category}
                        </p>
                      </div>
                      <div className="flex flex-none items-center gap-1">
                        <button
                          type="button"
                          aria-label={isActive ? `Deactivate ${tool.name}` : `Activate ${tool.name}`}
                          aria-pressed={isActive}
                          title={isActive ? `Deactivate ${tool.name}` : `Activate ${tool.name}`}
                          disabled={isAnyToolMutation}
                          onClick={() => onToggleToolStatus(tool)}
                          className={`inline-flex h-7 min-w-16 cursor-pointer items-center justify-center rounded-full border px-2 !text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActive
                              ? "border-[#B7E4CE] bg-[#F0FDF4] text-[#10B981] hover:bg-[#DCFCE7]"
                              : "border-black/[0.08] bg-[#F5F5F7] text-[#86868B] hover:text-[#555555]"
                          }`}
                        >
                          {isStatusSaving ? "Saving" : isActive ? "Active" : "Inactive"}
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit ${tool.name}`}
                          title={`Edit ${tool.name}`}
                          disabled={isAnyToolMutation || !isActive}
                          onClick={() => onEditTool(tool)}
                          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#007AFF] focus-visible:bg-[#F5F5F7] focus-visible:text-[#007AFF] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                          disabled={isAnyToolMutation || !isActive}
                          onClick={() => onDeleteTool(tool)}
                          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#EF4444] focus-visible:bg-[#F5F5F7] focus-visible:text-[#EF4444] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {toolActionId === tool.id && isToolDeleting ? (
                            <span className="size-3 animate-spin rounded-full border border-[#86868B]/30 border-t-[#EF4444]" />
                          ) : (
                            <Trash2 size={14} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
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
