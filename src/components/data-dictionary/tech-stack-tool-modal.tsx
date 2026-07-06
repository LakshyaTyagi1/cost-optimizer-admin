"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";

import type { DictionaryDomain, DictionaryIndustry, TechStackTool } from "./data-dictionary-data";

export type ToolFormState = {
  category: string;
  domainId: string;
  industryId: string;
  name: string;
  scope: "common" | "industry" | "domain";
  vendor: string;
};

export type TechStackToolModalProps = {
  canAddTool: boolean;
  domains: DictionaryDomain[];
  editingTool: TechStackTool | null;
  industries: DictionaryIndustry[];
  isToolSaving: boolean;
  onAddTool: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  selectedIndustryId: string;
  setToolForm: (value: ToolFormState | ((current: ToolFormState) => ToolFormState)) => void;
  toolForm: ToolFormState;
};

const fieldInputClass =
  "h-8 w-full rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF]";

export function TechStackToolModal({
  canAddTool,
  domains,
  industries,
  isToolSaving,
  editingTool,
  selectedIndustryId,
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
          <Field label="Vendor" required>
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
          <Field label="Scope" required>
            <select
              value={toolForm.scope}
              disabled={isEditingTool}
              onChange={(event) =>
                setToolForm((current) => ({
                  ...current,
                  domainId: "",
                  scope: event.target.value as ToolFormState["scope"],
                }))
              }
              className={fieldInputClass}
            >
              <option value="common">Global tool</option>
              <option value="industry">Industry default</option>
              <option value="domain">Industry + domain</option>
            </select>
          </Field>
          {toolForm.scope !== "common" ? (
            <Field label="Industry" required>
              <select
                value={selectedIndustryId}
                disabled={isEditingTool}
                onChange={(event) =>
                  setToolForm((current) => ({
                    ...current,
                    domainId: "",
                    industryId: event.target.value,
                  }))
                }
                className={fieldInputClass}
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {toolForm.scope === "domain" ? (
            <Field label="Domain" required>
              <select
                value={toolForm.domainId}
                disabled={isEditingTool}
                onChange={(event) =>
                  setToolForm((current) => ({ ...current, domainId: event.target.value }))
                }
                className={fieldInputClass}
              >
                <option value="">Select domain</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {getDomainDisplayTitle(domain.name)}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
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

function getDomainDisplayTitle(name: string) {
  const normalizedName = toSlug(name);
  const expandedNames: Record<string, string> = {
    cx: "Customer Experience (CX)",
    hr: "Human Resources (HR)",
    "it-ops": "IT Operations (IT Ops)",
    mktg: "Marketing (Mktg)",
  };

  return expandedNames[normalizedName] || name;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
