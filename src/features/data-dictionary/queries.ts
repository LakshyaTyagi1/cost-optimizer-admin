import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  fetchArchivedDataDictionaryProcesses,
  fetchDataDictionary,
  fetchDataDictionaryCatalog,
  fetchMappedTechStackPage,
  type DataDictionaryCatalog,
  type DataDictionaryPayload,
  type DataDictionaryTechStackPage,
} from "@/features/data-dictionary/api";
import type { DictionaryProcess } from "@/features/data-dictionary/model";

export const dataDictionaryQueryKey = ["data-dictionary"] as const;
export const dataDictionaryCatalogQueryKey = ["data-dictionary", "catalog", "industries"] as const;
export const archiveProcessesQueryKey = ["data-dictionary", "archive", "processes"] as const;
export const techStackQueryKey = ["data-dictionary", "tech-stack"] as const;

const dataDictionaryCacheTime = 5 * 60_000;
const dataDictionaryGcTime = 30 * 60_000;

export type DataDictionaryQuery = UseQueryResult<DataDictionaryPayload, Error>;
export type DataDictionaryCatalogQuery = UseQueryResult<DataDictionaryCatalog, Error>;
export type ArchivedDataDictionaryProcessesQuery = UseQueryResult<DictionaryProcess[], Error>;
export type DataDictionaryTechStackPageQuery = UseQueryResult<DataDictionaryTechStackPage, Error>;

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
    queryKey: dataDictionaryCatalogQueryKey,
    queryFn: fetchDataDictionaryCatalog,
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
