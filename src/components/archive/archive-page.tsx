"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Archive, RotateCcw, Search, Trash2 } from "lucide-react";

import {
  permanentlyDeleteAllArchivedDataDictionaryProcesses,
  permanentlyDeleteDataDictionaryProcess,
  restoreDataDictionaryProcess,
} from "@/features/data-dictionary/api";
import {
  archiveProcessesQueryKey,
  dataDictionaryQueryKey,
  useArchivedDataDictionaryProcesses,
} from "@/features/data-dictionary/queries";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import type { DictionaryProcess } from "@/features/data-dictionary/model";

const archiveRowHeight = 54;

export function ArchivePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [restoringProcessId, setRestoringProcessId] = useState("");
  const [deletingProcessId, setDeletingProcessId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DictionaryProcess | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState("");
  const {
    data: archivedProcesses = [],
    error,
    isLoading,
  } = useArchivedDataDictionaryProcesses();
  const restoreProcessMutation = useMutation({
    mutationFn: restoreDataDictionaryProcess,
  });
  const permanentlyDeleteProcessMutation = useMutation({
    mutationFn: permanentlyDeleteDataDictionaryProcess,
  });
  const permanentlyDeleteAllProcessesMutation = useMutation({
    mutationFn: permanentlyDeleteAllArchivedDataDictionaryProcesses,
  });
  const filteredProcesses = useMemo(() => {
    const query = normalizeSearch(search);

    if (!query) {
      return archivedProcesses;
    }

    return archivedProcesses.filter((process) =>
      normalizeSearch(
        `${process.name} ${process.description} ${process.code} ${process.domain} ${process.category} ${process.source} ${process.industryLabel || ""}`,
      ).includes(query),
    );
  }, [archivedProcesses, search]);
  const errorMessage = error instanceof Error ? error.message : "";

  const handleRestoreProcess = useCallback(async (process: DictionaryProcess) => {
    if (restoreProcessMutation.isPending || permanentlyDeleteProcessMutation.isPending) {
      return;
    }

    try {
      setRestoringProcessId(process.id);
      await restoreProcessMutation.mutateAsync(process);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: archiveProcessesQueryKey }),
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
      ]);
    } finally {
      setRestoringProcessId("");
    }
  }, [
    permanentlyDeleteProcessMutation.isPending,
    queryClient,
    restoreProcessMutation,
  ]);

  const handleDeleteProcess = useCallback((process: DictionaryProcess) => {
    setDeleteError("");
    setDeleteTarget(process);
  }, []);

  async function handlePermanentlyDeleteProcess() {
    if (!deleteTarget || permanentlyDeleteProcessMutation.isPending) {
      return;
    }

    try {
      setDeleteError("");
      setDeletingProcessId(deleteTarget.id);
      await permanentlyDeleteProcessMutation.mutateAsync(deleteTarget);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: archiveProcessesQueryKey }),
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
      ]);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Unable to permanently delete process"));
    } finally {
      setDeletingProcessId("");
    }
  }

  async function handlePermanentlyDeleteAllProcesses() {
    if (archivedProcesses.length === 0 || permanentlyDeleteAllProcessesMutation.isPending) {
      return;
    }

    try {
      setDeleteAllError("");
      await permanentlyDeleteAllProcessesMutation.mutateAsync();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: archiveProcessesQueryKey }),
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
      ]);
      setIsDeleteAllDialogOpen(false);
    } catch (error) {
      setDeleteAllError(getErrorMessage(error, "Unable to permanently delete archived processes"));
    }
  }

  return (
    <AdminShell activeItem="Archive">
      <div className="lg:pr-6">
        <header>
          <h1 className="text-[26px] leading-tight font-bold tracking-normal">Archive</h1>
          <p className="mt-2 text-sm font-semibold text-[#86868B]">
            Hidden or deleted process library records can be restored as active processes.
          </p>
        </header>

        <section className="mt-7 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
              Archived Processes ({archivedProcesses.length})
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label
                className="flex h-9 w-full items-center gap-2 rounded-md border border-black/[0.08] px-3 sm:w-[280px]"
                title="Search archived processes"
              >
                <Search size={14} className="text-[#A1A1AA]" aria-hidden="true" />
                <input
                  aria-label="Search archived processes"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-0 flex-1 text-xs font-semibold outline-none placeholder:text-[#A1A1AA]"
                  placeholder="Search archived processes..."
                  type="search"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setDeleteAllError("");
                  setIsDeleteAllDialogOpen(true);
                }}
                disabled={
                  isLoading ||
                  archivedProcesses.length === 0 ||
                  restoreProcessMutation.isPending ||
                  permanentlyDeleteProcessMutation.isPending ||
                  permanentlyDeleteAllProcessesMutation.isPending
                }
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[#FECACA] bg-white px-3 text-xs font-bold whitespace-nowrap text-[#EF4444] transition hover:border-[#EF4444] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                aria-label="Delete all archived processes permanently"
              >
                <Trash2 size={13} aria-hidden="true" />
                Delete all
              </button>
            </div>
          </div>

          <div className="mt-4 min-h-[170px] rounded-md border border-black/[0.06] bg-white">
            <div className="md:hidden">
              {isLoading ? <ArchiveMobileCardsSkeleton /> : null}
              {!isLoading && errorMessage ? <ArchiveListState label={errorMessage} /> : null}
              {!isLoading && !errorMessage && filteredProcesses.length === 0 ? (
                <ArchiveListState
                  label={
                    archivedProcesses.length === 0
                      ? "No archived processes found."
                      : "No archived processes match this search."
                  }
                />
              ) : null}
              {!isLoading && !errorMessage && filteredProcesses.length > 0 ? (
                <div className="divide-y divide-black/[0.05]">
                  {filteredProcesses.map((process) => (
                    <ArchiveProcessMobileCard
                      key={process.id}
                      isDeleting={
                        permanentlyDeleteProcessMutation.isPending &&
                        deletingProcessId === process.id
                      }
                      isRestoring={
                        restoreProcessMutation.isPending &&
                        restoringProcessId === process.id
                      }
                      process={process}
                      onDelete={handleDeleteProcess}
                      onRestore={handleRestoreProcess}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[1040px]">
                {isLoading ? <ArchiveRowsSkeleton /> : null}
                {!isLoading && errorMessage ? (
                  <ArchiveListState label={errorMessage} />
                ) : null}
                {!isLoading && !errorMessage && filteredProcesses.length === 0 ? (
                  <ArchiveListState
                    label={
                      archivedProcesses.length === 0
                        ? "No archived processes found."
                        : "No archived processes match this search."
                    }
                  />
                ) : null}
                {!isLoading && !errorMessage && filteredProcesses.length > 0 ? (
                  <VirtualizedArchiveList
                    deletingProcessId={deletingProcessId}
                    isDeletePending={permanentlyDeleteProcessMutation.isPending}
                    isRestorePending={restoreProcessMutation.isPending}
                    processes={filteredProcesses}
                    restoringProcessId={restoringProcessId}
                    onDeleteProcess={handleDeleteProcess}
                    onRestoreProcess={handleRestoreProcess}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
        {deleteTarget ? (
          <PermanentDeleteProcessModal
            errorMessage={deleteError}
            isDeleting={permanentlyDeleteProcessMutation.isPending}
            process={deleteTarget}
            onCancel={() => {
              if (!permanentlyDeleteProcessMutation.isPending) {
                setDeleteError("");
                setDeleteTarget(null);
              }
            }}
            onConfirm={() => {
              void handlePermanentlyDeleteProcess();
            }}
          />
        ) : null}
        {isDeleteAllDialogOpen ? (
          <PermanentDeleteAllProcessesModal
            count={archivedProcesses.length}
            errorMessage={deleteAllError}
            isDeleting={permanentlyDeleteAllProcessesMutation.isPending}
            onCancel={() => {
              if (!permanentlyDeleteAllProcessesMutation.isPending) {
                setDeleteAllError("");
                setIsDeleteAllDialogOpen(false);
              }
            }}
            onConfirm={() => {
              void handlePermanentlyDeleteAllProcesses();
            }}
          />
        ) : null}
      </div>
    </AdminShell>
  );
}

const VirtualizedArchiveList = memo(function VirtualizedArchiveList({
  deletingProcessId,
  isDeletePending,
  isRestorePending,
  onDeleteProcess,
  onRestoreProcess,
  processes,
  restoringProcessId,
}: {
  deletingProcessId: string;
  isDeletePending: boolean;
  isRestorePending: boolean;
  onDeleteProcess: (process: DictionaryProcess) => void;
  onRestoreProcess: (process: DictionaryProcess) => void;
  processes: DictionaryProcess[];
  restoringProcessId: string;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: processes.length,
    estimateSize: () => archiveRowHeight,
    getItemKey: (index) => processes[index]?.id ?? index,
    getScrollElement: () => listRef.current,
    overscan: 8,
  });

  return (
    <div
      ref={listRef}
      className="relative overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 260px)" }}
    >
      <div
        className="relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const process = processes[virtualRow.index];

          if (!process) {
            return null;
          }

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ArchiveProcessRow
                isDeleting={isDeletePending && deletingProcessId === process.id}
                isLast={virtualRow.index === processes.length - 1}
                isRestoring={isRestorePending && restoringProcessId === process.id}
                process={process}
                onDelete={onDeleteProcess}
                onRestore={onRestoreProcess}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

const ArchiveProcessRow = memo(function ArchiveProcessRow({
  isDeleting,
  isLast,
  isRestoring,
  onDelete,
  onRestore,
  process,
}: {
  isDeleting: boolean;
  isLast: boolean;
  isRestoring: boolean;
  onDelete: (process: DictionaryProcess) => void;
  onRestore: (process: DictionaryProcess) => void;
  process: DictionaryProcess;
}) {
  const isBusy = isRestoring || isDeleting;

  return (
    <article className={`${isLast ? "" : "border-b border-black/[0.05]"} bg-white`}>
      <div className="grid min-h-[54px] grid-cols-[72px_minmax(220px,1fr)_130px_150px_120px_228px] items-center gap-4 px-4">
        <span className="text-[11px] font-bold tracking-[0.02em] text-[#AAAAAA]">
          {process.code || "--"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-[#333333]">{process.name}</p>
          <p className="mt-1 truncate text-[11px] font-semibold text-[#86868B]">
            {process.description || "Archived process"}
          </p>
        </div>
        <span className="truncate text-[11px] font-bold text-[#555555]">
          {process.tier}
        </span>
        <span className="truncate text-[11px] font-semibold text-[#86868B]">
          {process.industryLabel || "Mapped industry"}
        </span>
        <span className="truncate text-[11px] font-semibold text-[#86868B]">
          {process.domain}
        </span>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onRestore(process)}
            disabled={isBusy}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#B7E4CE] bg-[#F0FDF4] px-3 text-xs font-bold text-[#10B981] transition hover:border-[#10B981] hover:bg-[#DCFCE7] disabled:cursor-wait disabled:opacity-70"
            aria-label={`Restore ${process.name}`}
            title={`Restore ${process.name} as active`}
          >
            {isRestoring ? (
              <span className="size-3 animate-spin rounded-full border border-[#10B981]/30 border-t-[#10B981]" />
            ) : (
              <RotateCcw size={13} aria-hidden="true" />
            )}
            {isRestoring ? "Restoring" : "Restore"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(process)}
            disabled={isBusy}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#FECACA] bg-white px-3 text-xs font-bold text-[#EF4444] transition hover:border-[#EF4444] hover:bg-[#FEF2F2] disabled:cursor-wait disabled:opacity-70"
            aria-label={`Delete ${process.name} permanently`}
            title={`Delete ${process.name} permanently`}
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-[#EF4444]/30 border-t-[#EF4444]" />
            ) : (
              <Trash2 size={13} aria-hidden="true" />
            )}
            {isDeleting ? "Deleting" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
});

const ArchiveProcessMobileCard = memo(function ArchiveProcessMobileCard({
  isDeleting,
  isRestoring,
  onDelete,
  onRestore,
  process,
}: {
  isDeleting: boolean;
  isRestoring: boolean;
  onDelete: (process: DictionaryProcess) => void;
  onRestore: (process: DictionaryProcess) => void;
  process: DictionaryProcess;
}) {
  const isBusy = isRestoring || isDeleting;

  return (
    <article className="bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.02em] text-[#AAAAAA]">
            {process.code || "--"}
          </p>
          <h2 className="mt-1 break-words text-sm font-bold text-[#333333]">
            {process.name}
          </h2>
          <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#86868B]">
            {process.description || "Archived process"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10px] font-bold text-[#555555]">
          {process.tier}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md bg-[#F8FAFC] px-3 py-2">
          <dt className="text-[9px] font-bold tracking-[0.12em] text-[#8E9AAB] uppercase">
            Industry
          </dt>
          <dd className="mt-1 truncate text-xs font-bold text-[#555555]">
            {process.industryLabel || "Mapped industry"}
          </dd>
        </div>
        <div className="rounded-md bg-[#F8FAFC] px-3 py-2">
          <dt className="text-[9px] font-bold tracking-[0.12em] text-[#8E9AAB] uppercase">
            Domain
          </dt>
          <dd className="mt-1 truncate text-xs font-bold text-[#555555]">
            {process.domain}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onRestore(process)}
          disabled={isBusy}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#B7E4CE] bg-[#F0FDF4] px-3 text-xs font-bold text-[#10B981] transition hover:border-[#10B981] hover:bg-[#DCFCE7] disabled:cursor-wait disabled:opacity-70"
          aria-label={`Restore ${process.name}`}
        >
          {isRestoring ? (
            <span className="size-3 animate-spin rounded-full border border-[#10B981]/30 border-t-[#10B981]" />
          ) : (
            <RotateCcw size={13} aria-hidden="true" />
          )}
          {isRestoring ? "Restoring" : "Restore"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(process)}
          disabled={isBusy}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#FECACA] bg-white px-3 text-xs font-bold text-[#EF4444] transition hover:border-[#EF4444] hover:bg-[#FEF2F2] disabled:cursor-wait disabled:opacity-70"
          aria-label={`Delete ${process.name} permanently`}
        >
          {isDeleting ? (
            <span className="size-3 animate-spin rounded-full border border-[#EF4444]/30 border-t-[#EF4444]" />
          ) : (
            <Trash2 size={13} aria-hidden="true" />
          )}
          {isDeleting ? "Deleting" : "Delete"}
        </button>
      </div>
    </article>
  );
});

function PermanentDeleteProcessModal({
  errorMessage,
  isDeleting,
  onCancel,
  onConfirm,
  process,
}: {
  errorMessage: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  process: DictionaryProcess;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permanent-delete-process-title"
    >
      <div className="w-full max-w-[420px] rounded-xl border border-black/[0.08] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.20)]">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#FEF2F2] text-[#EF4444]">
          <Trash2 size={18} aria-hidden="true" />
        </div>
        <h2 id="permanent-delete-process-title" className="mt-4 text-base font-bold text-[#171717]">
          Delete process permanently?
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#6E6E73]">
          This will permanently remove the archived process record. This action cannot be undone.
        </p>
        <div className="mt-4 rounded-lg border border-black/[0.06] bg-[#F9FAFB] px-3 py-2">
          <p className="truncate text-sm font-bold text-[#171717]">{process.name}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#86868B]">
            {[process.code, process.industryLabel || process.domain, process.source]
              .filter(Boolean)
              .join(" - ")}
          </p>
        </div>
        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#B91C1C]">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#555555] transition hover:bg-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#EF4444] px-4 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-white/30 border-t-white" />
            ) : (
              <Trash2 size={13} aria-hidden="true" />
            )}
            {isDeleting ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PermanentDeleteAllProcessesModal({
  count,
  errorMessage,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  count: number;
  errorMessage: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permanent-delete-all-processes-title"
    >
      <div className="w-full max-w-[420px] rounded-xl border border-black/[0.08] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.20)]">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#FEF2F2] text-[#EF4444]">
          <Trash2 size={18} aria-hidden="true" />
        </div>
        <h2
          id="permanent-delete-all-processes-title"
          className="mt-4 text-base font-bold text-[#171717]"
        >
          Delete all archived processes?
        </h2>
        <p className="mt-2 text-sm leading-6 font-semibold text-[#6E6E73]">
          This will permanently remove all {count} archived process{" "}
          {count === 1 ? "record" : "records"}. This action cannot be undone.
        </p>
        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#B91C1C]">
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#555555] transition hover:bg-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || count === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#EF4444] px-4 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-white/30 border-t-white" />
            ) : (
              <Trash2 size={13} aria-hidden="true" />
            )}
            {isDeleting ? "Deleting all..." : "Delete all permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArchiveRowsSkeleton() {
  return (
    <div className="animate-pulse bg-white" aria-label="Loading archived processes">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid min-h-[54px] grid-cols-[72px_minmax(220px,1fr)_130px_150px_120px_228px] items-center gap-4 border-b border-black/[0.05] px-4 last:border-b-0"
        >
          <div className="h-3 w-10 rounded bg-[#EEF0F3]" />
          <div>
            <div className="h-4 w-40 rounded bg-[#EEF0F3]" />
            <div className="mt-2 h-3 w-72 max-w-full rounded bg-[#EEF0F3]" />
          </div>
          <div className="h-3 w-20 rounded bg-[#EEF0F3]" />
          <div className="h-3 w-24 rounded bg-[#EEF0F3]" />
          <div className="h-3 w-20 rounded bg-[#EEF0F3]" />
          <div className="ml-auto h-8 w-52 rounded bg-[#EEF0F3]" />
        </div>
      ))}
    </div>
  );
}

function ArchiveMobileCardsSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-black/[0.05] bg-white" aria-label="Loading archived processes">
      {[0, 1, 2].map((item) => (
        <div key={item} className="p-4">
          <div className="h-3 w-12 rounded bg-[#EEF0F3]" />
          <div className="mt-2 h-4 w-48 max-w-full rounded bg-[#EEF0F3]" />
          <div className="mt-2 h-3 w-full rounded bg-[#EEF0F3]" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-md bg-[#EEF0F3]" />
            <div className="h-12 rounded-md bg-[#EEF0F3]" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-9 rounded-md bg-[#EEF0F3]" />
            <div className="h-9 rounded-md bg-[#EEF0F3]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArchiveListState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[170px] flex-col items-center justify-center bg-white px-4 py-8 text-center text-sm font-semibold text-[#86868B]">
      <Archive size={22} className="mb-2 text-[#A1A1AA]" aria-hidden="true" />
      {label}
    </div>
  );
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
