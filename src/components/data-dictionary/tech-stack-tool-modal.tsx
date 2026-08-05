"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";

import type { TechStackTool } from "@/features/data-dictionary/model";

export type ToolFormState = {
  benchmarkCheckedAt: string;
  benchmarkConfidence: "" | "published" | "indicative" | "quote-required";
  benchmarkMonthlyOperationalCost: string;
  benchmarkSetupCost: string;
  benchmarkSourceLabel: string;
  benchmarkSourceUrl: string;
  category: string;
  description: string;
  name: string;
  vendor: string;
};

export type TechStackToolModalProps = {
  canAddTool: boolean;
  editingTool: TechStackTool | null;
  isToolSaving: boolean;
  onAddTool: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  setToolForm: (value: ToolFormState | ((current: ToolFormState) => ToolFormState)) => void;
  toolForm: ToolFormState;
};

const fieldInputClass =
  "h-8 w-full rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF]";

export function TechStackToolModal({
  canAddTool,
  isToolSaving,
  editingTool,
  onClose,
  setToolForm,
  toolForm,
  onAddTool,
}: TechStackToolModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeToolForm() {
    if (!isToolSaving) {
      onClose();
    }
  }
  const isEditingTool = Boolean(editingTool);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-3 py-4 backdrop-blur-[1px] sm:px-4 sm:py-6"
      role="presentation"
      onClick={closeToolForm}
    >
      <form
        onSubmit={onAddTool}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-tech-stack-title"
        className="max-h-[calc(100vh-32px)] w-full max-w-[760px] overflow-auto rounded-md border border-[#B3D7FF] bg-[#F0F9FF] px-3 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-48px)] sm:px-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <p id="new-tech-stack-title" className="text-sm font-bold text-[#171717]">
            {isEditingTool ? "Edit Tool" : "Add Tool"}
          </p>
          <button
            type="button"
            onClick={closeToolForm}
            className="text-[#A1A1AA] transition hover:text-[#555555]"
            aria-label="Close tool form"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Tool Name" required>
            <input
              value={toolForm.name}
              onChange={(event) =>
                setToolForm((current) => ({ ...current, name: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. Salesforce Service Cloud"
            />
          </Field>
          <Field label="Company" required>
            <input
              value={toolForm.vendor}
              onChange={(event) =>
                setToolForm((current) => ({ ...current, vendor: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. Salesforce"
            />
          </Field>
          <Field label="Category" required>
            <input
              value={toolForm.category}
              onChange={(event) =>
                setToolForm((current) => ({ ...current, category: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. CRM / Support"
            />
          </Field>
          <Field label="Description">
            <input
              value={toolForm.description}
              onChange={(event) =>
                setToolForm((current) => ({ ...current, description: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. Customer service platform"
            />
          </Field>
        </div>
        <div className="mt-4 rounded-md border border-black/[0.08] bg-white/70 p-3">
          <p className="text-xs font-bold text-[#171717]">Researched benchmark (optional)</p>
          <p className="mt-1 text-[11px] leading-4 text-[#86868B]">
            Verified prices appear as grey placeholders in the user Technology Stack. Leave these fields blank until a benchmark is available.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Monthly Operational Cost (USD)">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-[#86868B]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={toolForm.benchmarkMonthlyOperationalCost}
                  onChange={(event) =>
                    setToolForm((current) => ({ ...current, benchmarkMonthlyOperationalCost: event.target.value }))
                  }
                  className={`${fieldInputClass} pl-7`}
                  placeholder="Leave blank"
                />
              </div>
            </Field>
            <Field label="Setup Cost (USD)">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-[#86868B]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={toolForm.benchmarkSetupCost}
                  onChange={(event) => setToolForm((current) => ({ ...current, benchmarkSetupCost: event.target.value }))}
                  className={`${fieldInputClass} pl-7`}
                  placeholder="Leave blank"
                />
              </div>
            </Field>
            <Field label="Source Label">
              <input
                value={toolForm.benchmarkSourceLabel}
                maxLength={200}
                onChange={(event) => setToolForm((current) => ({ ...current, benchmarkSourceLabel: event.target.value }))}
                className={fieldInputClass}
                placeholder="e.g. Vendor public pricing"
              />
            </Field>
            <Field label="HTTPS Source URL">
              <input
                type="url"
                pattern="https://.*"
                value={toolForm.benchmarkSourceUrl}
                maxLength={2048}
                onChange={(event) => setToolForm((current) => ({ ...current, benchmarkSourceUrl: event.target.value }))}
                className={fieldInputClass}
                placeholder="https://vendor.example/pricing"
              />
            </Field>
          </div>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeToolForm}
            disabled={isToolSaving}
            className="h-8 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-semibold text-[#86868B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canAddTool || isToolSaving}
            className={`inline-flex h-8 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold transition ${
              canAddTool && !isToolSaving
                ? "bg-[#007AFF] text-white hover:bg-[#0063CC]"
                : "cursor-not-allowed bg-[#E5E5E7] text-[#86868B]"
            }`}
          >
            {isEditingTool ? <Check size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
            {isToolSaving ? "Saving..." : isEditingTool ? "Save Changes" : "Add Tool"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
