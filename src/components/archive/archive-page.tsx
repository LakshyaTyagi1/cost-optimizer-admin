"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw, Search } from "lucide-react";

import {
  fetchArchivedDataDictionaryProcesses,
  restoreDataDictionaryProcess,
} from "@/api/data-dictionary.api";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import type { DictionaryProcess } from "@/components/data-dictionary/data-dictionary-data";

const archiveProcessesQueryKey = ["data-dictionary", "archive", "processes"] as const;
const dataDictionaryQueryKey = ["data-dictionary"] as const;

export function ArchivePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [restoringProcessId, setRestoringProcessId] = useState("");
  const {
    data: archivedProcesses = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: archiveProcessesQueryKey,
    queryFn: fetchArchivedDataDictionaryProcesses,
  });
  const restoreProcessMutation = useMutation({
    mutationFn: restoreDataDictionaryProcess,
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

  async function handleRestoreProcess(process: DictionaryProcess) {
    if (restoreProcessMutation.isPending) {
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
  }

  return (
    <AdminShell activeItem="Archive">
      <div className="lg:pr-6">
        <header>
          <h1 className="text-[26px] leading-tight font-bold tracking-normal">Archive</h1>
          <p className="mt-2 text-sm font-semibold text-[#86868B]">
            Deleted process library records can be restored as active processes.
          </p>
        </header>

        <section className="mt-7 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
              Archived Processes ({archivedProcesses.length})
            </p>
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
          </div>

          <div className="mt-4 min-h-[170px] overflow-x-auto rounded-md border border-black/[0.06] bg-white">
            <div className="min-w-[920px]">
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
              {!isLoading && !errorMessage
                ? filteredProcesses.map((process) => (
                    <ArchiveProcessRow
                      key={process.id}
                      isRestoring={
                        restoreProcessMutation.isPending &&
                        restoringProcessId === process.id
                      }
                      process={process}
                      onRestore={() => void handleRestoreProcess(process)}
                    />
                  ))
                : null}
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function ArchiveProcessRow({
  isRestoring,
  onRestore,
  process,
}: {
  isRestoring: boolean;
  onRestore: () => void;
  process: DictionaryProcess;
}) {
  return (
    <article className="border-b border-black/[0.05] bg-white last:border-b-0">
      <div className="grid min-h-[54px] grid-cols-[72px_minmax(220px,1fr)_130px_150px_120px_116px] items-center gap-4 px-4">
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
        <button
          type="button"
          onClick={onRestore}
          disabled={isRestoring}
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
      </div>
    </article>
  );
}

function ArchiveRowsSkeleton() {
  return (
    <div className="animate-pulse bg-white" aria-label="Loading archived processes">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid min-h-[54px] grid-cols-[72px_minmax(220px,1fr)_130px_150px_120px_116px] items-center gap-4 border-b border-black/[0.05] px-4 last:border-b-0"
        >
          <div className="h-3 w-10 rounded bg-[#EEF0F3]" />
          <div>
            <div className="h-4 w-40 rounded bg-[#EEF0F3]" />
            <div className="mt-2 h-3 w-72 max-w-full rounded bg-[#EEF0F3]" />
          </div>
          <div className="h-3 w-20 rounded bg-[#EEF0F3]" />
          <div className="h-3 w-24 rounded bg-[#EEF0F3]" />
          <div className="h-3 w-20 rounded bg-[#EEF0F3]" />
          <div className="h-8 w-24 rounded bg-[#EEF0F3]" />
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
