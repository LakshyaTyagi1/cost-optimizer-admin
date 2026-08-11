"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Database, FileSpreadsheet, Sparkles } from "lucide-react";

import {
  fetchDataDictionaryIndustryDomainDefaultGrid,
  type IndustryDomainDefaultProcessGridRow,
} from "@/features/data-dictionary/api";
import {
  DefaultsProcessListSelect,
  type DefaultsProcessListOption,
} from "@/features/data-dictionary/components/defaults-process-list-select";
import { DefaultsIndustrySelect } from "@/features/data-dictionary/components/defaults-industry-select";
import { DefaultsWorkspaceDialog } from "@/features/data-dictionary/components/defaults-workspace-dialog";
import { ProcessDescriptionPreview } from "@/features/data-dictionary/components/process-description-preview";
import type { DictionaryLibrary } from "@/features/data-dictionary/model";
import {
  getDomainDisplayTitle,
  getLibraryIdentity,
  toSlug,
} from "@/features/data-dictionary/utils/domain-mapping";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";

export type IndustryDomainDefaultsWorkspaceProps = {
  initialIndustryDomainId: string;
  isSeeding: boolean;
  libraries: DictionaryLibrary[];
  onClose: () => void;
  onSeedDefaults: (industryDomainId?: string) => Promise<boolean>;
};

function normalizeRow(
  row: IndustryDomainDefaultProcessGridRow,
): IndustryDomainDefaultProcessGridRow {
  return {
    category: String(row.category || "").trim(),
    description: String(row.description || "").trim(),
    domainKey: toSlug(row.domainKey || row.domainName || ""),
    domainName: String(row.domainName || "").trim(),
    industryKey: toSlug(row.industryKey || row.industryName || ""),
    industryName: String(row.industryName || "").trim(),
    isActive: row.isActive !== false,
    name: String(row.name || "").trim(),
    scope: String(row.scope || "Domain").trim(),
    slug: toSlug(row.slug || row.name || ""),
    tier: String(row.tier || "").trim(),
  };
}

function getTierLabel(tier: string) {
  const labels: Record<string, string> = {
    future: "Future Enhancements",
    "future-enhancement": "Future Enhancements",
    "future-enhancements": "Future Enhancements",
    "good-to-have": "Good-to-Have",
    "must-have": "Must-Have",
    "nice-to-have": "Nice-to-Have",
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

export function IndustryDomainDefaultsWorkspace({
  initialIndustryDomainId,
  isSeeding,
  libraries,
  onClose,
  onSeedDefaults,
}: IndustryDomainDefaultsWorkspaceProps) {
  const industrySelectRef = useRef<HTMLButtonElement | null>(null);
  const initialMapping =
    libraries.find(
      (library) => library.id === initialIndustryDomainId && library.isActive !== false,
    ) || libraries.find((library) => library.isActive !== false);
  const initialIndustryKey = toSlug(
    initialMapping?.industrySlug || initialMapping?.industryName || "",
  );
  const [rows, setRows] = useState<IndustryDomainDefaultProcessGridRow[]>([]);
  const [selectedIndustryKey, setSelectedIndustryKey] = useState(initialIndustryKey);
  const [selectedMappingId, setSelectedMappingId] = useState(initialMapping?.id || "");
  const [tableDomainKey, setTableDomainKey] = useState(
    initialMapping ? getLibraryIdentity(initialMapping) : "cx",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const activeMappings = useMemo(
    () =>
      libraries
        .filter((library) => library.isActive !== false)
        .map((library) => ({
          domainKey: getLibraryIdentity(library),
          id: library.id,
          domainName: getDomainDisplayTitle(library.domainName),
          industryId: library.industryId,
          industryKey: toSlug(library.industrySlug || library.industryName),
          industryName: library.industryName,
        })),
    [libraries],
  );
  const industryChoices = useMemo(() => {
    const choices = new Map<string, string>();

    rows.forEach((row) => {
      if (row.industryKey && !choices.has(row.industryKey)) {
        choices.set(row.industryKey, row.industryName || row.industryKey);
      }
    });
    activeMappings.forEach((mapping) => {
      if (mapping.industryKey && !choices.has(mapping.industryKey)) {
        choices.set(mapping.industryKey, mapping.industryName);
      }
    });

    return Array.from(choices, ([key, name]) => ({ key, name }));
  }, [activeMappings, rows]);
  const seedDomainChoices = useMemo(
    () => activeMappings.filter((mapping) => mapping.industryKey === selectedIndustryKey),
    [activeMappings, selectedIndustryKey],
  );
  const selectedMapping = useMemo(
    () =>
      seedDomainChoices.find((mapping) => mapping.id === selectedMappingId) ||
      seedDomainChoices.find((mapping) => mapping.domainKey === "cx") ||
      seedDomainChoices[0],
    [seedDomainChoices, selectedMappingId],
  );
  const effectiveRows = useMemo(
    () => rows.filter((row) => !row.industryKey || row.industryKey === selectedIndustryKey),
    [rows, selectedIndustryKey],
  );
  const domainChoices = useMemo(() => {
    const choices = new Map<string, string>();

    effectiveRows.forEach((row) => {
      if (row.domainKey && !choices.has(row.domainKey)) {
        choices.set(row.domainKey, row.domainName || getDomainDisplayTitle(row.domainKey));
      }
    });

    return Array.from(choices, ([key, name]) => ({ key, name }));
  }, [effectiveRows]);
  const displayedRows = useMemo(
    () =>
      tableDomainKey === "all"
        ? effectiveRows
        : effectiveRows.filter((row) => row.domainKey === tableDomainKey),
    [effectiveRows, tableDomainKey],
  );
  const processListOptions = useMemo<DefaultsProcessListOption[]>(() => {
    const rowCountByDomain = new Map<string, number>();
    effectiveRows.forEach((row) => {
      rowCountByDomain.set(row.domainKey, (rowCountByDomain.get(row.domainKey) || 0) + 1);
    });

    return [
      { value: "all", label: "All domains", count: effectiveRows.length },
      ...domainChoices.map((domain) => ({
        value: domain.key,
        label: getDomainDisplayTitle(domain.name),
        count: rowCountByDomain.get(domain.key) || 0,
      })),
    ];
  }, [domainChoices, effectiveRows]);
  const isBusy = isLoading || isSeeding;

  useEffect(() => {
    let isMounted = true;
    let focusFrameId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      void fetchDataDictionaryIndustryDomainDefaultGrid()
        .then((grid) => {
          if (!isMounted) return;
          const normalizedRows = (grid.rows || []).map(normalizeRow);
          setRows(normalizedRows);
          setSelectedIndustryKey(
            (currentIndustryKey) =>
              currentIndustryKey ||
              normalizedRows.find((row) => row.industryKey)?.industryKey ||
              "",
          );
          setStatusMessage("");
        })
        .catch((error) => {
          if (isMounted) setErrorMessage(getErrorMessage(error));
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
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
  }, []);

  function selectIndustry(industryKey: string) {
    const industryMappings = activeMappings.filter(
      (mapping) => mapping.industryKey === industryKey,
    );
    const preferredMapping =
      industryMappings.find((mapping) => mapping.domainKey === "cx") || industryMappings[0];

    setSelectedIndustryKey(industryKey);
    setSelectedMappingId(preferredMapping?.id || "");
    if (preferredMapping?.domainKey) {
      setTableDomainKey(preferredMapping.domainKey);
    } else if (rows.some((row) => row.industryKey === industryKey && row.domainKey === "cx")) {
      setTableDomainKey("cx");
    }
  }

  function selectDomain(industryDomainId: string) {
    const mapping = activeMappings.find((item) => item.id === industryDomainId);
    setSelectedMappingId(industryDomainId);
    if (mapping?.industryKey) {
      setSelectedIndustryKey(mapping.industryKey);
    }
    if (mapping?.domainKey) {
      setTableDomainKey(mapping.domainKey);
    }
  }

  async function seedDefaults(industryDomainId?: string) {
    if (isBusy) {
      return;
    }

    setErrorMessage("");
    setStatusMessage("");
    const wasSeeded = await onSeedDefaults(industryDomainId);
    if (wasSeeded) {
      const mapping = activeMappings.find((item) => item.id === industryDomainId);
      setStatusMessage(
        mapping
          ? `${mapping.industryName} — ${mapping.domainName} defaults are now up to date.`
          : "All supported industry × domain defaults are now up to date.",
      );
    }
  }

  return (
    <DefaultsWorkspaceDialog
      title="Add Industry × Domain Defaults"
      titleId="industry-domain-defaults-workspace-title"
      descriptionId="industry-domain-defaults-workspace-description"
      description={
        <>
          Review the built-in domain process list, then add the default processes for the selected
          active industry × domain mapping or all supported mappings. Industry-specific processes
          are always excluded.
        </>
      }
      icon={<FileSpreadsheet size={17} aria-hidden="true" />}
      isBusy={isBusy}
      onClose={onClose}
      controls={
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(150px,0.8fr)_minmax(180px,1fr)_auto_minmax(190px,0.9fr)] xl:items-end xl:gap-2">
          <DefaultsIndustrySelect
            ref={industrySelectRef}
            disabled={isBusy || industryChoices.length === 0}
            label="Target industry"
            onChange={selectIndustry}
            options={industryChoices}
            value={selectedIndustryKey}
          />
          <label className="block min-w-0">
            <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#68686D] uppercase">
              Target domain
            </span>
            <span className="relative block">
              <Database
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8A8A8F]"
                aria-hidden="true"
              />
              <select
                value={selectedMapping?.id || ""}
                onChange={(event) => selectDomain(event.target.value)}
                disabled={isBusy || seedDomainChoices.length === 0}
                aria-label="Target domain"
                className="h-10 w-full appearance-none rounded-lg border border-[#C9DBEE] bg-white pr-8 pl-9 text-sm font-semibold text-[#333] transition outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 disabled:cursor-wait"
              >
                {seedDomainChoices.length === 0 ? (
                  <option value="">No active mapped domains</option>
                ) : null}
                {seedDomainChoices.map((mapping) => (
                  <option key={mapping.id} value={mapping.id}>
                    {mapping.domainName}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2 md:col-span-2 md:flex md:items-center xl:col-span-1 xl:shrink-0">
            <button
              type="button"
              onClick={() => void seedDefaults(selectedMapping?.id)}
              disabled={!selectedMapping || isBusy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-4 text-xs font-bold whitespace-nowrap text-white transition hover:bg-[#0063CC] focus-visible:ring-2 focus-visible:ring-[#007AFF]/25 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:bg-[#A8CCF8] md:w-auto"
            >
              <Sparkles size={14} aria-hidden="true" />
              Add selected defaults
            </button>
            <button
              type="button"
              onClick={() => void seedDefaults()}
              disabled={isBusy || activeMappings.length === 0}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#9BC7F7] bg-white px-4 text-xs font-bold whitespace-nowrap text-[#0063CC] transition hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 md:w-auto"
            >
              <Sparkles size={14} aria-hidden="true" />
              Add defaults to all mappings
            </button>
          </div>
          <DefaultsProcessListSelect
            className="md:col-span-2 xl:col-span-1"
            disabled={isBusy}
            label="Process list"
            onChange={setTableDomainKey}
            options={processListOptions}
            value={tableDomainKey}
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
            {displayedRows.length} of {effectiveRows.length} domain-specific rows displayed
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
          Loading domain process details...
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <FileSpreadsheet size={28} className="text-[#A1A1AA]" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-[#333]">No default processes to display</p>
          <p className="mt-1 text-xs text-[#68686D]">
            No built-in process rows are available for this domain.
          </p>
        </div>
      ) : (
        <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 text-left">
          <caption className="sr-only">Industry × domain default process list</caption>
          <colgroup>
            <col className="w-12" />
            <col className="w-48" />
            <col className="w-40" />
            <col className="w-60" />
            <col className="w-[310px]" />
            <col className="w-52" />
            <col className="w-40" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#F5F8FB] shadow-[0_1px_0_rgba(15,23,42,0.10)]">
            <tr>
              {[
                "#",
                "Domain",
                "Tier",
                "Process Name",
                "Description",
                "Stable Slug",
                "Category",
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
                key={`${row.industryKey || "shared"}:${row.domainKey}:${row.slug}:${rowIndex}`}
                className="h-11 bg-white even:bg-[#FAFCFE]"
              >
                <td className="border-r border-b border-black/[0.06] px-3 text-center text-[11px] font-semibold text-[#8A8A8F]">
                  {rowIndex + 1}
                </td>
                <td className="border-r border-b border-black/[0.06] px-3 text-xs font-semibold whitespace-nowrap text-[#333]">
                  {getDomainDisplayTitle(row.domainName || row.domainKey)}
                </td>
                <td
                  className={`truncate border-r border-b border-black/[0.06] px-3 text-xs font-semibold text-[#555] ${getTierBackgroundClassName(row.tier)}`}
                  title={getTierLabel(row.tier)}
                >
                  {getTierLabel(row.tier)}
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 text-xs font-semibold text-[#333]">
                  <ProcessDescriptionPreview
                    activation="double-click"
                    description={row.description}
                    processName={row.name}
                    triggerText={row.name}
                  />
                </td>
                <td className="min-w-0 border-r border-b border-black/[0.06] px-2 text-xs font-medium text-[#555]">
                  <ProcessDescriptionPreview
                    activation="double-click"
                    description={row.description}
                    processName={row.name}
                  />
                </td>
                <td
                  className="truncate border-r border-b border-black/[0.06] px-3 font-mono text-[11px] font-semibold text-[#555]"
                  title={row.slug}
                >
                  {row.slug}
                </td>
                <td
                  className="truncate border-b border-black/[0.06] px-3 text-xs font-semibold text-[#555]"
                  title={row.category}
                >
                  {row.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DefaultsWorkspaceDialog>
  );
}
