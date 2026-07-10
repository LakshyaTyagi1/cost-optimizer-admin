import type {
  DictionaryDomain,
  DictionaryLibrary,
  DictionaryProcess,
} from "@/features/data-dictionary/model";
import {
  getDomainIdentity,
  normalizeSearch,
  toSlug,
} from "@/features/data-dictionary/utils/domain-mapping";

export type DictionaryProcessFilters = {
  domainFilter: string;
  industryFilter: string;
  search: string;
};

type DictionaryProcessListRow = {
  domainKey: string;
  process: DictionaryProcess;
  searchableText: string;
};

const industryDefaultDomainFilter = "industry-default";

export function createDomainIdentityById(
  domains: DictionaryDomain[],
  libraries: DictionaryLibrary[],
) {
  const domainIdentityMap = new Map(
    domains.map((domain) => [domain.id, getDomainIdentity(domain)]),
  );

  libraries.forEach((library) => {
    const domainKey = domainIdentityMap.get(library.domainId) || toSlug(library.domainName);

    if (!domainKey) {
      return;
    }

    domainIdentityMap.set(library.id, domainKey);
    domainIdentityMap.set(library.domainId, domainKey);
  });

  return domainIdentityMap;
}

export function getSelectedProcessDomainFilterKey(
  processDomainFilter: string,
  domainIdentityById: Map<string, string>,
) {
  return processDomainFilter === "all" ||
    processDomainFilter === industryDefaultDomainFilter
    ? ""
    : domainIdentityById.get(processDomainFilter) || "";
}

export function createDictionaryProcessListRows(
  processes: DictionaryProcess[],
  domainIdentityById: Map<string, string>,
): DictionaryProcessListRow[] {
  return processes.map((process) => ({
    domainKey: process.domainId ? domainIdentityById.get(process.domainId) || "" : "",
    process,
    searchableText: normalizeSearch(
      `${process.name} ${process.description} ${process.code} ${process.domain} ${process.category} ${process.source} ${process.industryLabel || ""}`,
    ),
  }));
}

export function filterDictionaryProcessRows(
  rows: DictionaryProcessListRow[],
  filters: DictionaryProcessFilters,
  selectedProcessDomainFilterKey: string,
) {
  const query = normalizeSearch(filters.search);

  return rows
    .filter(({ domainKey, process, searchableText }) => {
      const matchesSearch = !query || searchableText.includes(query);
      const matchesDomain =
        filters.domainFilter === "all" ||
        process.domainId === filters.domainFilter ||
        Boolean(selectedProcessDomainFilterKey && domainKey === selectedProcessDomainFilterKey);
      const matchesIndustry =
        filters.industryFilter === "all" ||
        process.industryIds.includes(filters.industryFilter);

      return matchesSearch && matchesDomain && matchesIndustry;
    })
    .map(({ process }) => process);
}
