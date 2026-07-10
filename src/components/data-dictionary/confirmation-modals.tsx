"use client";

import { Trash2, X } from "lucide-react";

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
            {tool.vendor} - {tool.category} - {getTechStackScopeLabel(tool)}
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
              Delete all technology tools
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This removes every tool from the Technology Stack Library.
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
            This action applies to all global, industry default, and industry + domain tools.
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
            {isDeleting ? "Deleting..." : "Delete all tools"}
          </button>
        </div>
      </div>
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
