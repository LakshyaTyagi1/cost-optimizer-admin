import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  fetchArchivedDataDictionaryProcesses,
  fetchDataDictionary,
  fetchDataDictionaryCatalog,
  fetchDataDictionaryOptions,
  fetchDataDictionaryPageCatalog,
  fetchDataDictionaryProcessPage,
  fetchTechnologyProductDomainMapping,
  fetchTechnologyProductIndustryMapping,
  fetchMappedTechStackPage,
  fetchZoftwarehubParentIndustries,
  fetchZoftwarehubSubCategories,
  type DataDictionaryCatalog,
  type DataDictionaryOptions,
  type DataDictionaryPayload,
  type DataDictionaryProcessPage,
  type DataDictionaryTechStackPage,
  type TechnologyProductDomainMapping,
  type TechnologyProductIndustryMapping,
  type ZoftwarehubTaxonomyOption,
} from "@/features/data-dictionary/api";
import type { DictionaryProcess } from "@/features/data-dictionary/model";

export const dataDictionaryQueryKey = ["data-dictionary", "snapshot"] as const;
export const dataDictionaryCatalogQueryKey = ["data-dictionary", "catalog"] as const;
export const legacyDataDictionaryCatalogQueryKey = [
  "data-dictionary",
  "catalog",
  "legacy-flat",
] as const;
export const dataDictionaryProcessesQueryKey = ["data-dictionary", "processes"] as const;
export const dataDictionaryOptionsQueryKey = ["data-dictionary", "options"] as const;
export const archiveProcessesQueryKey = ["data-dictionary", "archive", "processes"] as const;
export const techStackQueryKey = ["data-dictionary", "tech-stack"] as const;
export const technologyProductMappingQueryKey = [
  "data-dictionary",
  "technology-product-mapping",
] as const;
export const zoftwarehubTaxonomyQueryKey = ["data-dictionary", "zoftwarehub-taxonomy"] as const;

const dataDictionaryCacheTime = 5 * 60_000;
const dataDictionaryGcTime = 30 * 60_000;

export type DataDictionaryQuery = UseQueryResult<DataDictionaryPayload, Error>;
export type DataDictionaryCatalogQuery = UseQueryResult<DataDictionaryCatalog, Error>;
export type DataDictionaryOptionsQuery = UseQueryResult<DataDictionaryOptions, Error>;
export type DataDictionaryProcessPageQuery = UseQueryResult<DataDictionaryProcessPage, Error>;
export type ArchivedDataDictionaryProcessesQuery = UseQueryResult<DictionaryProcess[], Error>;
export type DataDictionaryTechStackPageQuery = UseQueryResult<DataDictionaryTechStackPage, Error>;
export type TechnologyProductIndustryMappingQuery = UseQueryResult<
  TechnologyProductIndustryMapping,
  Error
>;
export type TechnologyProductDomainMappingQuery = UseQueryResult<
  TechnologyProductDomainMapping,
  Error
>;
export type ZoftwarehubTaxonomyQuery = UseQueryResult<ZoftwarehubTaxonomyOption[], Error>;

export function useDataDictionary(): DataDictionaryQuery {
  return useQuery<DataDictionaryPayload, Error>({
    queryKey: dataDictionaryQueryKey,
    queryFn: fetchDataDictionary,
    gcTime: dataDictionaryGcTime,
    staleTime: dataDictionaryCacheTime,
  });
}

export function useDataDictionaryCatalog(): DataDictionaryCatalogQuery {
  return useQuery<DataDictionaryCatalog, Error>({
    queryKey: legacyDataDictionaryCatalogQueryKey,
    queryFn: fetchDataDictionaryCatalog,
  });
}

export function useDataDictionaryPageCatalog({
  enabled,
}: {
  enabled: boolean;
}): DataDictionaryCatalogQuery {
  return useQuery<DataDictionaryCatalog, Error>({
    queryKey: dataDictionaryCatalogQueryKey,
    queryFn: ({ signal }) => fetchDataDictionaryPageCatalog(signal),
    enabled,
    gcTime: dataDictionaryGcTime,
    refetchOnWindowFocus: false,
    staleTime: dataDictionaryCacheTime,
  });
}

export function useDataDictionaryOptions({
  enabled,
}: {
  enabled: boolean;
}): DataDictionaryOptionsQuery {
  return useQuery<DataDictionaryOptions, Error>({
    queryKey: dataDictionaryOptionsQueryKey,
    queryFn: ({ signal }) => fetchDataDictionaryOptions(signal),
    enabled,
    gcTime: dataDictionaryGcTime,
    refetchOnWindowFocus: false,
    staleTime: dataDictionaryGcTime,
  });
}

export function useDataDictionaryProcessPage({
  catalog,
  domainKey,
  enabled,
  industryId,
  limit,
  page,
  scope,
  search,
}: {
  catalog?: DataDictionaryCatalog;
  domainKey?: string;
  enabled: boolean;
  industryId?: string;
  limit: number;
  page: number;
  scope?: "industry-default" | "industry-domain";
  search: string;
}): DataDictionaryProcessPageQuery {
  const normalizedSearch = search.trim();

  return useQuery<DataDictionaryProcessPage, Error>({
    queryKey: [
      ...dataDictionaryProcessesQueryKey,
      {
        catalogRevision: catalog?.revision || "",
        domainKey: domainKey || "",
        industryId: industryId || "",
        limit,
        page,
        scope: scope || "all",
        search: normalizedSearch,
      },
    ],
    queryFn: ({ signal }) => {
      if (!catalog) {
        throw new Error("Data dictionary catalog is required to load processes");
      }

      return fetchDataDictionaryProcessPage({
        catalog,
        domainKey,
        industryId,
        limit,
        page,
        scope,
        search: normalizedSearch,
        signal,
      });
    },
    enabled: enabled && Boolean(catalog),
    gcTime: dataDictionaryGcTime,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: dataDictionaryCacheTime,
  });
}

export function useArchivedDataDictionaryProcesses(): ArchivedDataDictionaryProcessesQuery {
  return useQuery<DictionaryProcess[], Error>({
    queryKey: archiveProcessesQueryKey,
    queryFn: fetchArchivedDataDictionaryProcesses,
  });
}

export function useMappedTechStackPage({
  enabled,
  limit,
  page,
  search,
}: {
  enabled: boolean;
  limit: number;
  page: number;
  search: string;
}): DataDictionaryTechStackPageQuery {
  return useQuery<DataDictionaryTechStackPage, Error>({
    queryKey: [...techStackQueryKey, "common", page, search.trim()],
    queryFn: () => fetchMappedTechStackPage({ limit, page, search }),
    enabled,
    gcTime: dataDictionaryGcTime,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: dataDictionaryCacheTime,
  });
}

export function useTechnologyProductIndustryMapping({
  enabled,
  industryId,
}: {
  enabled: boolean;
  industryId: string;
}): TechnologyProductIndustryMappingQuery {
  return useQuery<TechnologyProductIndustryMapping, Error>({
    queryKey: [...technologyProductMappingQueryKey, "industry", industryId],
    queryFn: () => fetchTechnologyProductIndustryMapping(industryId),
    enabled: enabled && Boolean(industryId),
    staleTime: dataDictionaryCacheTime,
  });
}

export function useTechnologyProductDomainMapping({
  domainId,
  enabled,
}: {
  domainId: string;
  enabled: boolean;
}): TechnologyProductDomainMappingQuery {
  return useQuery<TechnologyProductDomainMapping, Error>({
    queryKey: [...technologyProductMappingQueryKey, "domain", domainId],
    queryFn: () => fetchTechnologyProductDomainMapping(domainId),
    enabled: enabled && Boolean(domainId),
    staleTime: dataDictionaryCacheTime,
  });
}

export function useZoftwarehubParentIndustries({
  enabled,
}: {
  enabled: boolean;
}): ZoftwarehubTaxonomyQuery {
  return useQuery<ZoftwarehubTaxonomyOption[], Error>({
    queryKey: [...zoftwarehubTaxonomyQueryKey, "parent-industries"],
    queryFn: fetchZoftwarehubParentIndustries,
    enabled,
    staleTime: dataDictionaryCacheTime,
  });
}

export function useZoftwarehubSubCategories({
  enabled,
}: {
  enabled: boolean;
}): ZoftwarehubTaxonomyQuery {
  return useQuery<ZoftwarehubTaxonomyOption[], Error>({
    queryKey: [...zoftwarehubTaxonomyQueryKey, "sub-categories"],
    queryFn: fetchZoftwarehubSubCategories,
    enabled,
    staleTime: dataDictionaryCacheTime,
  });
}
