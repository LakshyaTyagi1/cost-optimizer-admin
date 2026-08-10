"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, FileSpreadsheet, Sparkles } from "lucide-react";

import {
  fetchDataDictionaryIndustryDefaultGrid,
  type IndustryDefaultProcessGridRow,
} from "@/features/data-dictionary/api";
import {
  DefaultsProcessListSelect,
  type DefaultsProcessListOption,
} from "@/features/data-dictionary/components/defaults-process-list-select";
import { DefaultsWorkspaceDialog } from "@/features/data-dictionary/components/defaults-workspace-dialog";
import { ProcessDescriptionPreview } from "@/features/data-dictionary/components/process-description-preview";
import type { DictionaryIndustry } from "@/features/data-dictionary/model";
import { toSlug } from "@/features/data-dictionary/utils/domain-mapping";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";

export type IndustryDefaultsWorkspaceProps = {
  industries: DictionaryIndustry[];
  initialIndustryId: string;
  isSeeding: boolean;
  onClose: () => void;
  onSeedDefaults: (industryId?: string) => Promise<boolean>;
};

function getIndustryKey(industry: DictionaryIndustry) {
  return toSlug(industry.slug || industry.name);
}

function normalizeRow(row: IndustryDefaultProcessGridRow): IndustryDefaultProcessGridRow {
  return {
    category: String(row.category || "").trim(),
    description: String(row.description || "").trim(),
    industryKey: toSlug(row.industryKey || row.industryName || ""),
    industryName: String(row.industryName || "").trim(),
    isActive: row.isActive !== false,
    name: String(row.name || "").trim(),
    slug: toSlug(row.slug || row.name || ""),
    tier: String(row.tier || "").trim(),
  };
}

function getTierLabel(tier: string) {
  const labels: Record<string, string> = {
    future: "Future",
    "future-enhancement": "Future Enhancement",
    "good-to-have": "Good-to-Have",
    "must-have": "Must-Have",
    "nice-to-have": "Nice to Have",
  };

  return labels[toSlug(tier)] || tier;
}

export function IndustryDefaultsWorkspace({
  industries,
  initialIndustryId,
  isSeeding,
  onClose,
  onSeedDefaults,
}: IndustryDefaultsWorkspaceProps) {
  const industrySelectRef = useRef<HTMLSelectElement | null>(null);
  const [rows, setRows] = useState<IndustryDefaultProcessGridRow[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState(initialIndustryId);
  const [tableIndustryKey, setTableIndustryKey] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const industryChoices = useMemo(
    () =>
      industries.map((industry) => ({
        id: industry.id,
        key: getIndustryKey(industry),
        name: industry.name,
      })),
    [industries],
  );
  const industryNameByKey = useMemo(
    () => new Map(industryChoices.map((industry) => [industry.key, industry.name])),
    [industryChoices],
  );
  const displayedRows = useMemo(
    () =>
      tableIndustryKey === "all"
        ? rows
        : rows.filter((row) => row.industryKey === tableIndustryKey),
    [rows, tableIndustryKey],
  );
  const processListOptions = useMemo<DefaultsProcessListOption[]>(() => {
    const configuredIndustryKeys = new Set(industryChoices.map((industry) => industry.key));
    const sourceIndustries = new Map<string, { count: number; name: string }>();

    rows.forEach((row) => {
      if (!row.industryKey) {
        return;
      }

      const currentIndustry = sourceIndustries.get(row.industryKey);
      sourceIndustries.set(row.industryKey, {
        count: (currentIndustry?.count || 0) + 1,
        name: currentIndustry?.name || row.industryName || row.industryKey,
      });
    });

    return [
      { value: "all", label: "All industries", count: rows.length },
      ...Array.from(sourceIndustries, ([industryKey, sourceIndustry]) => ({
        value: industryKey,
        label: sourceIndustry.name,
        count: sourceIndustry.count,
        isConfigured: configuredIndustryKeys.has(industryKey),
      })),
    ];
  }, [industryChoices, rows]);
  const isBusy = isLoading || isSeeding;

  const loadGrid = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const grid = await fetchDataDictionaryIndustryDefaultGrid();
      setRows((grid.rows || []).map(normalizeRow));
      setStatusMessage(
        `${grid.totalCount || grid.rows?.length || 0} industry-specific source rows loaded.`,
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadGrid();
      industrySelectRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadGrid]);

  async function seedDefaults(industryId?: string) {
    if (isBusy) {
      return;
    }
    setErrorMessage("");
    setStatusMessage("");
    const wasSeeded = await onSeedDefaults(industryId);
    if (wasSeeded) {
      const industry = industryChoices.find((item) => item.id === industryId);
      setStatusMessage(
        industry
          ? `${industry.name} defaults are now up to date.`
          : "All configured industry defaults are now up to date.",
      );
    }
  }

  return (
    <DefaultsWorkspaceDialog
      title="Add Industry Defaults"
      titleId="industry-defaults-workspace-title"
      descriptionId="industry-defaults-workspace-description"
      description={
        <>
          Review the built-in industry-specific process list, then add the default processes for the
          selected industry or all configured industries. Domain processes are always excluded.
        </>
      }
      icon={<FileSpreadsheet size={17} aria-hidden="true" />}
      isBusy={isBusy}
      onClose={onClose}
      controls={
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:gap-2">
          <label className="block min-w-0 md:w-[320px] xl:w-auto xl:min-w-[260px] xl:flex-1">
            <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#68686D] uppercase">
              Target industry
            </span>
            <span className="relative block">
              <Building2
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8A8A8F]"
                aria-hidden="true"
              />
              <select
                ref={industrySelectRef}
                value={selectedIndustryId}
                onChange={(event) => setSelectedIndustryId(event.target.value)}
                disabled={isBusy}
                className="h-10 w-full appearance-none rounded-lg border border-[#C9DBEE] bg-white pr-8 pl-9 text-sm font-semibold text-[#333] transition outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 disabled:cursor-wait"
              >
                {industryChoices.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2 md:flex md:items-center xl:shrink-0">
            <button
              type="button"
              onClick={() => void seedDefaults(selectedIndustryId)}
              disabled={!selectedIndustryId || isBusy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-4 text-xs font-bold whitespace-nowrap text-white transition hover:bg-[#0063CC] focus-visible:ring-2 focus-visible:ring-[#007AFF]/25 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:bg-[#A8CCF8] md:w-auto"
            >
              <Sparkles size={14} aria-hidden="true" />
              Add selected defaults
            </button>
            <button
              type="button"
              onClick={() => void seedDefaults()}
              disabled={isBusy || industries.length === 0}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#9BC7F7] bg-white px-4 text-xs font-bold whitespace-nowrap text-[#0063CC] transition hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 md:w-auto"
            >
              <Sparkles size={14} aria-hidden="true" />
              Add defaults to all industries
            </button>
          </div>
          <span className="hidden h-10 w-px shrink-0 bg-[#D7E7F6] xl:block" aria-hidden="true" />
          <DefaultsProcessListSelect
            className="sm:w-[250px] xl:ml-auto xl:shrink-0"
            disabled={isBusy}
            label="Process list"
            onChange={setTableIndustryKey}
            options={processListOptions}
            value={tableIndustryKey}
          />
        </div>
      }
      footer={
        errorMessage ? (
          <p className="text-xs font-bold text-[#C5221F]">{errorMessage}</p>
        ) : statusMessage ? (
          <p className="text-xs font-semibold text-[#16794A]">{statusMessage}</p>
        ) : (
          <p className="text-xs font-semibold text-[#68686D]">
            {displayedRows.length} of {rows.length} industry-specific rows displayed
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
          Loading industry process details...
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <FileSpreadsheet size={28} className="text-[#A1A1AA]" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-[#333]">No default processes to display</p>
          <p className="mt-1 text-xs text-[#68686D]">
            No built-in process rows are available for this industry.
          </p>
        </div>
      ) : (
        <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 text-left">
          <caption className="sr-only">Industry-specific default process list</caption>
          <colgroup>
            <col className="w-12" />
            <col className="w-40" />
            <col className="w-52" />
            <col className="w-60" />
            <col className="w-[310px]" />
            <col className="w-40" />
            <col className="w-40" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#F5F8FB] shadow-[0_1px_0_rgba(15,23,42,0.10)]">
            <tr>
              {[
                "#",
                "Industry",
                "Stable Slug",
                "Process Name",
                "Description",
                "Category",
                "Tier",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="h-10 border-r border-black/[0.06] px-3 text-[10px] font-bold tracking-[0.06em] text-[#68686D] uppercase last:border-r-0"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row, rowIndex) => (
              <tr
                key={`${row.industryKey}:${row.slug}:${rowIndex}`}
                className="h-11 bg-white even:bg-[#FAFCFE]"
              >
                <td className="border-r border-b border-black/[0.06] px-3 text-center text-[11px] font-semibold text-[#8A8A8F]">
                  {rowIndex + 1}
                </td>
                <td className="border-r border-b border-black/[0.06] px-3 text-xs font-semibold text-[#333]">
                  {row.industryName || industryNameByKey.get(row.industryKey) || row.industryKey}
                </td>
                <td
                  className="truncate border-r border-b border-black/[0.06] px-3 font-mono text-[11px] font-semibold text-[#555]"
                  title={row.slug}
                >
                  {row.slug}
                </td>
                <td
                  className="truncate border-r border-b border-black/[0.06] px-3 text-xs font-semibold text-[#333]"
                  title={row.name}
                >
                  {row.name}
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 text-xs font-medium text-[#555]">
                  <ProcessDescriptionPreview description={row.description} processName={row.name} />
                </td>
                <td
                  className="truncate border-r border-b border-black/[0.06] px-3 text-xs font-semibold text-[#555]"
                  title={row.category}
                >
                  {row.category}
                </td>
                <td
                  className="truncate border-b border-black/[0.06] px-3 text-xs font-semibold text-[#555]"
                  title={getTierLabel(row.tier)}
                >
                  {getTierLabel(row.tier)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DefaultsWorkspaceDialog>
  );
}
