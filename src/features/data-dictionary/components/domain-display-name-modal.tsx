"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";

import type { DictionaryDomain } from "@/features/data-dictionary/model";

export type DomainDisplayNameModalProps = {
  domain: DictionaryDomain;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};

const maxDomainDisplayNameLength = 120;

export function DomainDisplayNameModal({
  domain,
  isSaving,
  onClose,
  onSave,
}: DomainDisplayNameModalProps) {
  const [name, setName] = useState(domain.name);
  const dialogRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const canSave = Boolean(normalizedName) && normalizedName !== domain.name.trim() && !isSaving;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    inputRef.current?.select();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeDialog() {
    if (!isSaving) {
      onClose();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canSave) {
      void onSave(normalizedName);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[1px]"
      role="presentation"
      onClick={closeDialog}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-domain-title"
        aria-describedby="rename-domain-description"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] rounded-md border border-[#B3D7FF] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id="rename-domain-title" className="text-sm font-bold text-[#171717]">
              Rename domain display name
            </p>
            <p
              id="rename-domain-description"
              className="mt-1 text-xs leading-5 font-semibold text-[#86868B]"
            >
              This changes the label shown in the Cost Cutting Tool for every industry using this
              domain. Its stable key, mappings, and processes stay unchanged.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            disabled={isSaving}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close domain rename dialog"
            title="Close"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <label className="mt-5 block" htmlFor="domain-display-name">
          <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#68686D] uppercase">
            Display name
          </span>
          <input
            ref={inputRef}
            id="domain-display-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={maxDomainDisplayNameLength}
            disabled={isSaving}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-black/[0.1] bg-white px-3 text-sm font-semibold text-[#171717] outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF] disabled:cursor-wait disabled:bg-[#F5F5F7]"
            placeholder="Enter the customer-facing domain name"
          />
        </label>

        <div className="mt-3 rounded-md border border-black/[0.06] bg-[#FAFAFA] px-3 py-2">
          <span className="text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
            Stable key
          </span>
          <code className="ml-2 text-xs font-semibold text-[#555555]">
            {domain.slug || domain.id}
          </code>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={closeDialog}
            disabled={isSaving}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-semibold text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#007AFF] px-4 text-xs font-bold text-white transition hover:bg-[#0063CC] disabled:cursor-not-allowed disabled:bg-[#E5E5E7] disabled:text-[#86868B]"
          >
            <Check size={13} aria-hidden="true" />
            {isSaving ? "Saving..." : "Save display name"}
          </button>
        </div>
      </form>
    </div>
  );
}
