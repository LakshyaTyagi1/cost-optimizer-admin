"use client";

import { Archive, ArchiveRestore, Trash2, X } from "lucide-react";

import type { DictionaryProcess, TechStackTool } from "@/features/data-dictionary/model";

export type DeleteProcessConfirmationModalProps = {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  process: DictionaryProcess;
};

export type DeleteToolConfirmationModalProps = {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  tool: TechStackTool;
};

export type DeleteAllToolsConfirmationModalProps = {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  toolCount: number;
};

export type ArchiveAllToolsConfirmationModalProps = {
  isArchiving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  toolCount: number;
};

export type ActivateAllToolsConfirmationModalProps = {
  isActivating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteProcessConfirmationModal({
  isDeleting,
  onCancel,
  onConfirm,
  process,
}: DeleteProcessConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-process-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#FEF2F2] text-[#EF4444]">
              <Trash2 size={18} aria-hidden="true" />
            </div>
            <p id="delete-process-title" className="mt-4 text-sm font-bold text-[#171717]">
              Archive process
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This moves the process from the admin process library to Archive.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close delete process confirmation"
            title="Close confirmation"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
          <p className="truncate text-sm font-bold text-[#171717]">{process.name}</p>
          <p className="mt-1 text-xs font-semibold text-[#86868B]">
            {[process.code, process.tier, process.industryLabel || process.domain]
              .filter(Boolean)
              .join(" - ")}
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : null}
            {isDeleting ? "Archiving..." : "Archive process"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteToolConfirmationModal({
  isDeleting,
  onCancel,
  onConfirm,
  tool,
}: DeleteToolConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-tool-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#FEF2F2] text-[#EF4444]">
              <Trash2 size={18} aria-hidden="true" />
            </div>
            <p id="delete-tool-title" className="mt-4 text-sm font-bold text-[#171717]">
              Delete technology tool
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This removes the tool from available technology stack options in the admin library.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close delete tool confirmation"
            title="Close confirmation"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
          <p className="truncate text-sm font-bold text-[#171717]">{tool.name}</p>
          <p className="mt-1 text-xs font-semibold text-[#86868B]">
            {tool.vendor} - {tool.category}
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : null}
            {isDeleting ? "Deleting..." : "Delete tool"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActivateAllToolsConfirmationModal({
  isActivating,
  onCancel,
  onConfirm,
}: ActivateAllToolsConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activate-all-tools-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isActivating) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#ECFDF3] text-[#15803D]">
              <ArchiveRestore size={18} aria-hidden="true" />
            </div>
            <p id="activate-all-tools-title" className="mt-4 text-sm font-bold text-[#171717]">
              Activate all archived tools
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This makes every eligible archived tool available in the Technology Stack Library.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isActivating}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close activate all tools confirmation"
            title="Close confirmation"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-3">
          <p className="text-sm font-bold text-[#166534]">Archived tools will become active</p>
          <p className="mt-1 text-xs font-semibold text-[#4B7A59]">
            Existing active tools stay unchanged. Duplicate archived names remain inactive.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isActivating}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isActivating}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#15803D] px-3 text-xs font-bold text-white transition hover:bg-[#166534] disabled:cursor-wait disabled:opacity-70"
          >
            {isActivating ? (
              <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : null}
            {isActivating ? "Activating..." : "Activate All Archived Tools"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ArchiveAllToolsConfirmationModal({
  isArchiving,
  onCancel,
  onConfirm,
  toolCount,
}: ArchiveAllToolsConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-all-tools-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isArchiving) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#F5F5F7] text-[#555555]">
              <Archive size={18} aria-hidden="true" />
            </div>
            <p id="archive-all-tools-title" className="mt-4 text-sm font-bold text-[#171717]">
              Archive all active tools
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This marks every active tool in the Technology Stack Library as inactive.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isArchiving}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close archive all tools confirmation"
            title="Close confirmation"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
          <p className="text-sm font-bold text-[#171717]">
            Up to {toolCount} {toolCount === 1 ? "tool" : "tools"} will be archived
          </p>
          <p className="mt-1 text-xs font-semibold text-[#86868B]">
            Archived tools remain in the shared library and can be reactivated later.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isArchiving}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isArchiving}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#555555] px-3 text-xs font-bold text-white transition hover:bg-[#333333] disabled:cursor-wait disabled:opacity-70"
          >
            {isArchiving ? (
              <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : null}
            {isArchiving ? "Archiving..." : "Archive All Active Tools"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteAllToolsConfirmationModal({
  isDeleting,
  onCancel,
  onConfirm,
  toolCount,
}: DeleteAllToolsConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-all-tools-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#FEF2F2] text-[#EF4444]">
              <Trash2 size={18} aria-hidden="true" />
            </div>
            <p id="delete-all-tools-title" className="mt-4 text-sm font-bold text-[#171717]">
              Permanently delete all technology tools
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This permanently removes every tool from the Technology Stack Library.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close delete all tools confirmation"
            title="Close confirmation"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
          <p className="text-sm font-bold text-[#171717]">
            {toolCount} {toolCount === 1 ? "tool" : "tools"} will be removed
          </p>
          <p className="mt-1 text-xs font-semibold text-[#86868B]">
            This action cannot be undone and applies only to the shared technology library.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : null}
            {isDeleting ? "Deleting..." : "Delete All Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
