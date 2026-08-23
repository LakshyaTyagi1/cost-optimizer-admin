"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Database, Layers3, Sparkles } from "lucide-react";

import {
  fetchDataDictionaryDefaultDomains,
  type DefaultDomainGrid,
  type DefaultDomainRow,
} from "@/features/data-dictionary/api";
import { DefaultsCellPreview } from "@/features/data-dictionary/components/defaults-cell-preview";
import { DefaultsWorkspaceDialog } from "@/features/data-dictionary/components/defaults-workspace-dialog";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";

export type DefaultDomainsWorkspaceProps = {
  isSeeding: boolean;
  onClose: () => void;
  onSeedDefaults: (domainKey?: string) => Promise<boolean>;
};

const emptyGridSummary = {
  configuredMappingCount: 0,
  industryCount: 0,
  totalMappingCount: 0,
};

const statusLabels: Record<DefaultDomainRow["status"], string> = {
  active: "Configured",
  partial: "Partially configured",
  inactive: "Inactive",
  missing: "Not added",
};

const statusClassNames: Record<DefaultDomainRow["status"], string> = {
  active: "border-[#B7E4CE] bg-[#F0FDF4] text-[#16794A]",
  partial: "border-[#B8D8FF] bg-[#F0F7FF] text-[#0063CC]",
  inactive: "border-[#F8D59B] bg-[#FFF9EB] text-[#9A6700]",
  missing: "border-[#D9E3F0] bg-[#F5F8FB] text-[#68686D]",
};

function normalizeRows(rows: DefaultDomainRow[]) {
  return rows
    .map((row) => ({
      ...row,
      activeIndustryCount: Math.max(0, Number(row.activeIndustryCount) || 0),
      defaultProcessCount: Math.max(0, Number(row.defaultProcessCount) || 0),
      displayOrder: Math.max(0, Number(row.displayOrder) || 0),
      domainAliases: Array.isArray(row.domainAliases)
        ? row.domainAliases.map((alias) => String(alias).trim()).filter(Boolean)
        : [],
      domainKey: String(row.domainKey || "").trim(),
      domainName: String(row.domainName || "").trim(),
      inactiveIndustryCount: Math.max(0, Number(row.inactiveIndustryCount) || 0),
      missingIndustryCount: Math.max(0, Number(row.missingIndustryCount) || 0),
      status: ["active", "partial", "inactive", "missing"].includes(row.status)
        ? row.status
        : ("missing" as const),
    }))
    .filter((row) => row.domainKey && row.domainName)
    .sort((firstDomain, secondDomain) => firstDomain.displayOrder - secondDomain.displayOrder);
}

function getGridSummary(grid: DefaultDomainGrid) {
  return {
    configuredMappingCount: Math.max(0, Number(grid.configuredMappingCount) || 0),
    industryCount: Math.max(0, Number(grid.industryCount) || 0),
    totalMappingCount: Math.max(0, Number(grid.totalMappingCount) || 0),
  };
}

export function DefaultDomainsWorkspace({
  isSeeding,
  onClose,
  onSeedDefaults,
}: DefaultDomainsWorkspaceProps) {
  const domainSelectRef = useRef<HTMLSelectElement | null>(null);
  const [rows, setRows] = useState<DefaultDomainRow[]>([]);
  const [selectedDomainKey, setSelectedDomainKey] = useState("");
  const [gridSummary, setGridSummary] = useState(emptyGridSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isBusy = isLoading || isSeeding;
  const configuredDomainCount = useMemo(
    () => rows.filter((row) => row.status === "active").length,
    [rows],
  );
  const hasActiveIndustries = gridSummary.industryCount > 0;

  const loadDomains = useCallback(async (showLoadedMessage = true) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fetchDataDictionaryDefaultDomains();
      const nextRows = normalizeRows(result.rows || []);
      const nextSummary = getGridSummary(result);
      setRows(nextRows);
      setGridSummary(nextSummary);
      setSelectedDomainKey((currentKey) => {
        if (nextRows.some((row) => row.domainKey === currentKey)) {
          return currentKey;
        }

        return (
          nextRows.find((row) => row.status !== "active")?.domainKey || nextRows[0]?.domainKey || ""
        );
      });
      if (showLoadedMessage) {
        setStatusMessage(`${result.totalCount || nextRows.length} default domains loaded.`);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadDomains();
      domainSelectRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadDomains]);

  async function seedDefaults(domainKey?: string) {
    if (isBusy || !hasActiveIndustries) {
      return;
    }

    setErrorMessage("");
    setStatusMessage("");
    const wasSeeded = await onSeedDefaults(domainKey);
    if (!wasSeeded) {
      return;
    }

    const domain = rows.find((row) => row.domainKey === domainKey);
    await loadDomains(false);
    setStatusMessage(
      domain
        ? `${domain.domainName} is now configured across all active industries.`
        : "All default domains are now configured across all active industries.",
    );
  }

  return (
    <DefaultsWorkspaceDialog
      title="Add Default Domains"
      titleId="default-domains-workspace-title"
      descriptionId="default-domains-workspace-description"
      description={
        <>
          Review the eight domains defined by the Cost Cutting Tool, then add one selected domain or
          all missing domains across every active industry. Default process counts are shown per
          industry mapping; processes are added separately.
        </>
      }
      icon={<Database size={17} aria-hidden="true" />}
      isBusy={isBusy}
      onClose={onClose}
      controls={
        <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="block min-w-0 md:flex-1">
              <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#68686D] uppercase">
                Default domain
              </span>
              <span className="relative block">
                <Layers3
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8A8A8F]"
                  aria-hidden="true"
                />
                <select
                  ref={domainSelectRef}
                  value={selectedDomainKey}
                  onChange={(event) => setSelectedDomainKey(event.target.value)}
                  disabled={isBusy || rows.length === 0}
                  className="h-10 w-full appearance-none rounded-lg border border-[#C9DBEE] bg-white pr-8 pl-9 text-sm font-semibold text-[#333] transition outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 disabled:cursor-wait"
                >
                  {rows.map((row) => (
                    <option key={row.domainKey} value={row.domainKey}>
                      {row.domainName} · {statusLabels[row.status]} · {row.activeIndustryCount}/
                      {gridSummary.industryCount} industries
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2 md:flex md:shrink-0 md:items-center">
              <button
                type="button"
                onClick={() => void seedDefaults(selectedDomainKey)}
                disabled={!selectedDomainKey || !hasActiveIndustries || isBusy}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-4 text-xs font-bold whitespace-nowrap text-white transition hover:bg-[#0063CC] focus-visible:ring-2 focus-visible:ring-[#007AFF]/25 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:bg-[#A8CCF8] md:w-auto"
              >
                <Sparkles size={14} aria-hidden="true" />
                Add selected domain
              </button>
              <button
                type="button"
                onClick={() => void seedDefaults()}
                disabled={!hasActiveIndustries || isBusy || rows.length === 0}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#9BC7F7] bg-white px-4 text-xs font-bold whitespace-nowrap text-[#0063CC] transition hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 md:w-auto"
              >
                <Sparkles size={14} aria-hidden="true" />
                Add all default domains
              </button>
            </div>
          </div>
          {!isLoading && !errorMessage && !hasActiveIndustries ? (
            <p className="mt-3 rounded-lg border border-[#F8D59B] bg-[#FFF9EB] px-3 py-2 text-xs font-semibold text-[#9A6700]">
              Add at least one active industry before adding default domains.
            </p>
          ) : null}
        </div>
      }
      footer={
        errorMessage ? (
          <p className="text-xs font-bold text-[#C5221F]">{errorMessage}</p>
        ) : statusMessage ? (
          <p className="text-xs font-semibold text-[#16794A]">{statusMessage}</p>
        ) : (
          <p className="text-xs font-semibold text-[#68686D]">
            {configuredDomainCount} of {rows.length} default domains fully configured ·{" "}
            {gridSummary.configuredMappingCount} of {gridSummary.totalMappingCount} active industry
            mappings configured
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
          Loading default domains...
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <Database size={28} className="text-[#A1A1AA]" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-[#333]">No default domains available</p>
        </div>
      ) : (
        <table className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-left">
          <caption className="sr-only">Default domain catalog details</caption>
          <colgroup>
            <col className="w-12" />
            <col className="w-48" />
            <col className="w-48" />
            <col className="w-56" />
            <col className="w-36" />
            <col className="w-52" />
            <col className="w-40" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#F5F8FB] shadow-[0_1px_0_rgba(15,23,42,0.10)]">
            <tr>
              {[
                "#",
                "Domain",
                "Stable Slug",
                "Aliases",
                "Default Processes / Mapping",
                "Industry Mappings",
                "Domain Mapping Status",
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
              <tr key={row.domainKey} className="h-14 bg-white even:bg-[#FAFCFE]">
                <td className="border-r border-b border-black/[0.06] px-3 text-center text-[11px] font-semibold text-[#8A8A8F]">
                  {rowIndex + 1}
                </td>
                <td className="border-r border-b border-black/[0.06] px-3 text-xs font-bold text-[#333]">
                  {row.domainName}
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 font-mono text-[11px] font-semibold text-[#555]">
                  <DefaultsCellPreview
                    activation="double-click"
                    content={row.domainKey}
                    label="Full stable slug"
                    title={row.domainName}
                  />
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 text-xs font-semibold text-[#555]">
                  <DefaultsCellPreview
                    activation="double-click"
                    content={row.domainAliases.join(", ")}
                    label="Full aliases"
                    title={row.domainName}
                  />
                </td>
                <td className="border-r border-b border-black/[0.06] px-3 text-xs font-bold text-[#333]">
                  {row.defaultProcessCount}
                </td>
                <td className="border-r border-b border-black/[0.06] px-3 text-xs font-semibold text-[#555]">
                  <span className="block font-bold text-[#333]">
                    {row.activeIndustryCount}/{gridSummary.industryCount} active
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#8A8A8F]">
                    {row.missingIndustryCount} missing · {row.inactiveIndustryCount} inactive
                  </span>
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
