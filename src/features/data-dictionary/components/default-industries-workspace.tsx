"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Layers3, Sparkles } from "lucide-react";

import {
  fetchDataDictionaryDefaultIndustries,
  type DefaultIndustryRow,
} from "@/features/data-dictionary/api";
import { DefaultsCellPreview } from "@/features/data-dictionary/components/defaults-cell-preview";
import { DefaultsWorkspaceDialog } from "@/features/data-dictionary/components/defaults-workspace-dialog";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";

export type DefaultIndustriesWorkspaceProps = {
  isSeeding: boolean;
  onClose: () => void;
  onSeedDefaults: (industryKey?: string) => Promise<boolean>;
};

const statusLabels: Record<DefaultIndustryRow["status"], string> = {
  active: "Configured",
  inactive: "Inactive",
  missing: "Not added",
};

const statusClassNames: Record<DefaultIndustryRow["status"], string> = {
  active: "border-[#B7E4CE] bg-[#F0FDF4] text-[#16794A]",
  inactive: "border-[#F8D59B] bg-[#FFF9EB] text-[#9A6700]",
  missing: "border-[#D9E3F0] bg-[#F5F8FB] text-[#68686D]",
};

function formatLabel(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function DefaultIndustriesWorkspace({
  isSeeding,
  onClose,
  onSeedDefaults,
}: DefaultIndustriesWorkspaceProps) {
  const industrySelectRef = useRef<HTMLSelectElement | null>(null);
  const [rows, setRows] = useState<DefaultIndustryRow[]>([]);
  const [selectedIndustryKey, setSelectedIndustryKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isBusy = isLoading || isSeeding;
  const configuredCount = useMemo(
    () => rows.filter((row) => row.status === "active").length,
    [rows],
  );

  const loadIndustries = useCallback(async (showLoadedMessage = true) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fetchDataDictionaryDefaultIndustries();
      const nextRows = result.rows || [];
      setRows(nextRows);
      setSelectedIndustryKey((currentKey) => {
        if (nextRows.some((row) => row.industryKey === currentKey)) {
          return currentKey;
        }

        return (
          nextRows.find((row) => row.status !== "active")?.industryKey ||
          nextRows[0]?.industryKey ||
          ""
        );
      });
      if (showLoadedMessage) {
        setStatusMessage(`${result.totalCount || nextRows.length} default industries loaded.`);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadIndustries();
      industrySelectRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadIndustries]);

  async function seedDefaults(industryKey?: string) {
    if (isBusy) {
      return;
    }

    setErrorMessage("");
    setStatusMessage("");
    const wasSeeded = await onSeedDefaults(industryKey);
    if (!wasSeeded) {
      return;
    }

    const industry = rows.find((row) => row.industryKey === industryKey);
    await loadIndustries(false);
    setStatusMessage(
      industry
        ? `${industry.industryName} is now configured.`
        : "All default industries are now configured.",
    );
  }

  return (
    <DefaultsWorkspaceDialog
      title="Add Default Industries"
      titleId="default-industries-workspace-title"
      descriptionId="default-industries-workspace-description"
      description={
        <>
          Review the seven industries defined by the Cost Cutting Tool Process Library, then add one
          selected industry or all missing industries to the catalog.
        </>
      }
      icon={<Building2 size={17} aria-hidden="true" />}
      isBusy={isBusy}
      onClose={onClose}
      controls={
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="block min-w-0 md:flex-1">
            <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#68686D] uppercase">
              Default industry
            </span>
            <span className="relative block">
              <Layers3
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8A8A8F]"
                aria-hidden="true"
              />
              <select
                ref={industrySelectRef}
                value={selectedIndustryKey}
                onChange={(event) => setSelectedIndustryKey(event.target.value)}
                disabled={isBusy}
                className="h-10 w-full appearance-none rounded-lg border border-[#C9DBEE] bg-white pr-8 pl-9 text-sm font-semibold text-[#333] transition outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 disabled:cursor-wait"
              >
                {rows.map((row) => (
                  <option key={row.industryKey} value={row.industryKey}>
                    {row.industryName} · {statusLabels[row.status]}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2 md:flex md:shrink-0 md:items-center">
            <button
              type="button"
              onClick={() => void seedDefaults(selectedIndustryKey)}
              disabled={!selectedIndustryKey || isBusy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-4 text-xs font-bold whitespace-nowrap text-white transition hover:bg-[#0063CC] focus-visible:ring-2 focus-visible:ring-[#007AFF]/25 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:bg-[#A8CCF8] md:w-auto"
            >
              <Sparkles size={14} aria-hidden="true" />
              Add selected industry
            </button>
            <button
              type="button"
              onClick={() => void seedDefaults()}
              disabled={isBusy || rows.length === 0}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#9BC7F7] bg-white px-4 text-xs font-bold whitespace-nowrap text-[#0063CC] transition hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 md:w-auto"
            >
              <Sparkles size={14} aria-hidden="true" />
              Add all default industries
            </button>
          </div>
        </div>
      }
      footer={
        errorMessage ? (
          <p className="text-xs font-bold text-[#C5221F]">{errorMessage}</p>
        ) : statusMessage ? (
          <p className="text-xs font-semibold text-[#16794A]">{statusMessage}</p>
        ) : (
          <p className="text-xs font-semibold text-[#68686D]">
            {configuredCount} of {rows.length} default industries configured
          </p>
        )
      }
    >
      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm font-semibold text-[#68686D]">
          <span
            className="size-5 animate-spin rounded-full border-2 border-[#007AFF]/25 border-t-[#007AFF]"
            aria-hidden="true"
          />
          Loading default industries...
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <Building2 size={28} className="text-[#A1A1AA]" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-[#333]">No default industries available</p>
        </div>
      ) : (
        <table className="w-full min-w-[920px] table-fixed border-separate border-spacing-0 text-left">
          <caption className="sr-only">Default industry catalog details</caption>
          <colgroup>
            <col className="w-12" />
            <col className="w-48" />
            <col className="w-48" />
            <col className="w-36" />
            <col className="w-[260px]" />
            <col className="w-48" />
            <col className="w-36" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#F5F8FB] shadow-[0_1px_0_rgba(15,23,42,0.10)]">
            <tr>
              {[
                "#",
                "Industry",
                "Stable Slug",
                "Default Processes",
                "Categories",
                "Tiers",
                "Catalog Status",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="h-10 border-r border-black/[0.06] px-3 text-[10px] font-bold whitespace-nowrap tracking-[0.06em] text-[#68686D] uppercase last:border-r-0"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.industryKey} className="h-14 bg-white even:bg-[#FAFCFE]">
                <td className="border-r border-b border-black/[0.06] px-3 text-center text-[11px] font-semibold text-[#8A8A8F]">
                  {rowIndex + 1}
                </td>
                <td className="border-r border-b border-black/[0.06] px-3 text-xs font-bold text-[#333]">
                  {row.industryName}
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 font-mono text-[11px] font-semibold text-[#555]">
                  <DefaultsCellPreview
                    activation="double-click"
                    content={row.industryKey}
                    label="Full stable slug"
                    title={row.industryName}
                  />
                </td>
                <td className="border-r border-b border-black/[0.06] px-3 text-xs font-bold text-[#333]">
                  {row.defaultProcessCount}
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 text-xs font-semibold text-[#555]">
                  <DefaultsCellPreview
                    activation="double-click"
                    content={row.categories.map(formatLabel).join(", ")}
                    label="Full categories"
                    title={row.industryName}
                  />
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 text-xs font-semibold text-[#555]">
                  <DefaultsCellPreview
                    activation="double-click"
                    content={row.tiers.map(formatLabel).join(", ")}
                    label="Full tiers"
                    title={row.industryName}
                  />
                </td>
                <td className="border-b border-black/[0.06] px-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClassNames[row.status]}`}
                  >
                    {statusLabels[row.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DefaultsWorkspaceDialog>
  );
}
