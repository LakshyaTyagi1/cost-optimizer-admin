"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Sparkles } from "lucide-react";

import {
  fetchDataDictionaryIndustryDefaultGrid,
  type IndustryDefaultProcessGridRow,
} from "@/features/data-dictionary/api";
import {
  DefaultsProcessListSelect,
  type DefaultsProcessListOption,
} from "@/features/data-dictionary/components/defaults-process-list-select";
import {
  DefaultsIndustrySelect,
  type DefaultsIndustryConfigurationStatus,
} from "@/features/data-dictionary/components/defaults-industry-select";
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
    industryStatus: ["active", "inactive", "missing"].includes(row.industryStatus)
      ? row.industryStatus
      : "missing",
    isActive: row.isActive !== false,
    name: String(row.name || "").trim(),
    slug: toSlug(row.slug || row.name || ""),
    status: ["added", "inactive", "not-added"].includes(row.status) ? row.status : "not-added",
    tier: String(row.tier || "").trim(),
  };
}

const processStatusLabels: Record<IndustryDefaultProcessGridRow["status"], string> = {
  added: "Added",
  inactive: "Inactive",
  "not-added": "Not added",
};

const processStatusClassNames: Record<IndustryDefaultProcessGridRow["status"], string> = {
  added: "border-[#B7E4CE] bg-[#F0FDF4] text-[#16794A]",
  inactive: "border-[#F8D59B] bg-[#FFF9EB] text-[#9A6700]",
  "not-added": "border-[#D9E3F0] bg-[#F5F8FB] text-[#68686D]",
};

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

function getTierBackgroundClassName(tier: string) {
  const tierKey = toSlug(tier);

  if (tierKey === "must-have") return "bg-[#F8CBAD]";
  if (tierKey === "good-to-have") return "bg-[#FFE699]";
  if (tierKey === "nice-to-have") return "bg-[#BDD7EE]";
  if (["future", "future-enhancement", "future-enhancements"].includes(tierKey)) {
    return "bg-[#C6E0B4]";
  }

  return "";
}

export function IndustryDefaultsWorkspace({
  industries,
  initialIndustryId,
  isSeeding,
  onClose,
  onSeedDefaults,
}: IndustryDefaultsWorkspaceProps) {
  const industrySelectRef = useRef<HTMLButtonElement | null>(null);
  const [rows, setRows] = useState<IndustryDefaultProcessGridRow[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState(initialIndustryId);
  const [tableIndustryKey, setTableIndustryKey] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const industryConfigurationByKey = useMemo(() => {
    const configurationByKey = new Map<
      string,
      {
        addedProcessCount: number;
        industryStatus: IndustryDefaultProcessGridRow["industryStatus"];
        totalProcessCount: number;
      }
    >();

    rows.forEach((row) => {
      const current = configurationByKey.get(row.industryKey);
      configurationByKey.set(row.industryKey, {
        addedProcessCount: (current?.addedProcessCount || 0) + (row.status === "not-added" ? 0 : 1),
        industryStatus: current?.industryStatus || row.industryStatus,
        totalProcessCount: (current?.totalProcessCount || 0) + 1,
      });
    });

    return configurationByKey;
  }, [rows]);
  const industryChoices = useMemo(
    () =>
      industries.map((industry) => {
        const key = getIndustryKey(industry);
        const configuration = industryConfigurationByKey.get(key);
        let configurationStatus: DefaultsIndustryConfigurationStatus | undefined;

        if (configuration?.industryStatus === "missing") {
          configurationStatus = "missing";
        } else if (configuration?.industryStatus === "inactive") {
          configurationStatus = "inactive";
        } else if (configuration) {
          configurationStatus =
            configuration.addedProcessCount === configuration.totalProcessCount
              ? "configured"
              : configuration.addedProcessCount > 0
                ? "partial"
                : "not-added";
        }

        return {
          id: industry.id,
          key,
          name: industry.name,
          ...(configuration
            ? {
                addedProcessCount: configuration.addedProcessCount,
                configurationStatus,
                totalProcessCount: configuration.totalProcessCount,
              }
            : {}),
        };
      }),
    [industries, industryConfigurationByKey],
  );
  const industryNameByKey = useMemo(
    () => new Map(industryChoices.map((industry) => [industry.key, industry.name])),
    [industryChoices],
  );
  const selectedIndustryKey =
    industryChoices.find((industry) => industry.id === selectedIndustryId)?.key || "";
  const displayedRows = useMemo(
    () =>
      tableIndustryKey === "all"
        ? rows
        : rows.filter((row) => row.industryKey === tableIndustryKey),
    [rows, tableIndustryKey],
  );
  const processListOptions = useMemo<DefaultsProcessListOption[]>(() => {
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
      })),
    ];
  }, [rows]);
  const displayedConfiguredCount = useMemo(
    () => displayedRows.filter((row) => row.status === "added").length,
    [displayedRows],
  );
  const isBusy = isLoading || isSeeding;

  const loadGrid = useCallback(async (showLoadedMessage = true) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const grid = await fetchDataDictionaryIndustryDefaultGrid();
      setRows((grid.rows || []).map(normalizeRow));
      if (showLoadedMessage) {
        setStatusMessage(
          `${grid.totalCount || grid.rows?.length || 0} industry-specific source rows loaded.`,
        );
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let focusFrameId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      void loadGrid().finally(() => {
        if (isMounted) {
          focusFrameId = window.requestAnimationFrame(() => {
            if (isMounted) {
              industrySelectRef.current?.focus();
            }
          });
        }
      });
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(frameId);
      if (focusFrameId !== null) {
        window.cancelAnimationFrame(focusFrameId);
      }
    };
  }, [loadGrid]);

  function selectIndustry(industryKey: string) {
    const industry = industryChoices.find((item) => item.key === industryKey);
    setSelectedIndustryId(industry?.id || "");
  }

  async function seedDefaults(industryId?: string) {
    if (isBusy) {
      return;
    }
    setErrorMessage("");
    setStatusMessage("");
    const wasSeeded = await onSeedDefaults(industryId);
    if (wasSeeded) {
      const industry = industryChoices.find((item) => item.id === industryId);
      await loadGrid(false);
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
          <div className="min-w-0 md:w-[320px] xl:w-auto xl:min-w-[260px] xl:flex-1">
            <DefaultsIndustrySelect
              ref={industrySelectRef}
              disabled={isBusy || industryChoices.length === 0}
              dropdownMinWidth={400}
              label="Target industry"
              onChange={selectIndustry}
              options={industryChoices}
              value={selectedIndustryKey}
            />
          </div>
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
            {displayedConfiguredCount} of {displayedRows.length} displayed processes added
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
        <table className="w-full min-w-[1220px] table-fixed border-separate border-spacing-0 text-left">
          <caption className="sr-only">Industry-specific default process list</caption>
          <colgroup>
            <col className="w-12" />
            <col className="w-40" />
            <col className="w-40" />
            <col className="w-60" />
            <col className="w-[310px]" />
            <col className="w-52" />
            <col className="w-40" />
            <col className="w-32" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#F5F8FB] shadow-[0_1px_0_rgba(15,23,42,0.10)]">
            <tr>
              {[
                "#",
                "Industry",
                "Tier",
                "Process Name",
                "Description",
                "Stable Slug",
                "Category",
                "Status",
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
                  className={`truncate border-r border-b border-black/[0.06] px-3 text-xs font-semibold text-[#555] ${getTierBackgroundClassName(row.tier)}`}
                  title={getTierLabel(row.tier)}
                >
                  {getTierLabel(row.tier)}
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
                  className="truncate border-r border-b border-black/[0.06] px-3 font-mono text-[11px] font-semibold text-[#555]"
                  title={row.slug}
                >
                  {row.slug}
                </td>
                <td
                  className="truncate border-r border-b border-black/[0.06] px-3 text-xs font-semibold text-[#555]"
                  title={row.category}
                >
                  {row.category}
                </td>
                <td className="border-b border-black/[0.06] px-3">
                  <span
                    className={`inline-flex h-5 items-center rounded-full border px-2 text-[9px] font-bold whitespace-nowrap ${processStatusClassNames[row.status]}`}
                  >
                    {processStatusLabels[row.status]}
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
