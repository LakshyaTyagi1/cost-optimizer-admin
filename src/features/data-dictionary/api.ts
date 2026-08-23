import { fetchAdminApiData, fetchAdminApiList, type AdminApiListPayload } from "@/lib/api/client";

import {
  processCategories,
  type ProcessOption,
  DictionaryDomain,
  DictionaryIndustry,
  DictionaryLibrary,
  DictionaryProcess,
  ProcessTier,
  TechStackBenchmarkPricing,
  TechStackTool,
} from "@/features/data-dictionary/model";

type ApiEntity = {
  _id?: string;
  associatedProcessCount?: number;
  defaultProcessCount?: number;
  displayOrder?: number;
  id?: string;
  industryDomainProcessCount?: number;
  isActive?: boolean;
  name?: string;
  processCounts?: ApiRecordCounts;
  slug?: string;
};

type ApiRecordCounts = {
  active?: number;
  inactive?: number;
  nonDeleted?: number;
};

type ApiMapping = {
  displayOrder?: number;
  domainName?: string;
  domainId?: ApiEntity | string;
  domainSlug?: string;
  id?: string;
  industryId?: ApiEntity | string;
  industryName?: string;
  industrySlug?: string;
  isActive?: boolean;
  processCount?: number;
};

type ApiProcess = {
  _id?: string;
  category?: string;
  code?: string;
  description?: string;
  domainName?: string;
  domainSlug?: string;
  estimatedAnnualCost?: {
    amount?: number;
    currency?: "AED" | "USD";
  };
  id?: string;
  hoursPerYear?: number;
  industryDomainId?: string;
  industryName?: string;
  industrySlug?: string;
  industryId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  name?: string;
  scope?: "industry-default" | "industry-domain";
  slug?: string;
  state?:
    | "active"
    | "inactive"
    | "archived"
    | "deleted"
    | {
        isActive?: boolean;
        isDeleted?: boolean;
      };
  tier?: string;
};

type ApiTechStack = {
  _id?: string;
  benchmarkPricing?: {
    currency?: string;
    monthlyOperationalCost?: number | null;
    setupCost?: number | null;
    sourceLabel?: string;
    sourceUrl?: string;
    checkedAt?: string | null;
    confidence?: string;
  };
  category?: string;
  company?: string;
  createdAt?: string;
  description?: string;
  id?: string;
  isActive?: boolean;
  title?: string;
  updatedAt?: string;
};

type ApiCatalogPayload = {
  domains?: ApiEntity[];
  industries?: ApiEntity[];
  libraries?: ApiMapping[];
  options?: ApiProcessOptions;
};

type ApiDataDictionaryDomain = ApiEntity & {
  industryDomainId?: string;
  processCount?: number;
};

type ApiDataDictionaryIndustry = ApiEntity & {
  domains?: ApiDataDictionaryDomain[];
  processCounts?: ApiRecordCounts & {
    industryDefault?: ApiRecordCounts;
    industryDomain?: ApiRecordCounts;
  };
};

type ApiDataDictionaryPayload = {
  industries?: ApiDataDictionaryIndustry[];
  options?: ApiProcessOptions;
  processes?: ApiProcess[];
};

type ApiDataDictionaryCatalogPayload = {
  industries?: ApiDataDictionaryIndustry[];
  options?: ApiProcessOptions;
  processSummary?: {
    activeCount?: number;
    inactiveCount?: number;
    nonDeletedCount?: number;
    totalCount?: number;
  };
  revision?: number | string;
};

type ApiProcessOptions = {
  baseCurrency?: "AED";
  categories?: string[];
  currency?: {
    base?: "AED";
    display?: "USD";
    displayToBaseRate?: number;
    supported?: Array<"AED" | "USD">;
  };
  currencyConversionRate?: number;
  currencies?: Array<"AED" | "USD">;
  displayCurrency?: "USD";
  displayToBaseCurrencyRate?: number;
  supportedCurrencies?: Array<"AED" | "USD">;
  tiers?: string[];
};

type ApiCurrencySettings = {
  currencyConversionRate?: number;
  displayToBaseCurrencyRate?: number;
};

type ApiListPayload<T> = AdminApiListPayload<T>;

type DataDictionaryProcessPayload = {
  category: string;
  description: string;
  estimatedAnnualCost: {
    amount: number;
    currency: "AED" | "USD";
  };
  hoursPerYear: number;
  name: string;
  tier: string;
};

type DataDictionaryTechStackPayload = {
  benchmarkPricing?: TechStackBenchmarkPricing | null;
  category: string;
  description?: string;
  name: string;
  vendor: string;
};

export type DataDictionaryOptions = {
  categories: ProcessOption[];
  currencyConversionRate: number;
  tiers: ProcessOption[];
};

export type DataDictionaryCatalog = {
  domains: DictionaryDomain[];
  inactiveDomains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  inactiveIndustries: DictionaryIndustry[];
  libraries: DictionaryLibrary[];
  options: DataDictionaryOptions;
  processSummary?: {
    activeCount: number;
    inactiveCount: number;
    nonDeletedCount: number;
    totalCount: number;
  };
  revision?: string;
};

export type DataDictionaryPayload = DataDictionaryCatalog & {
  processes: DictionaryProcess[];
};

export type DataDictionaryPagination = {
  limit: number;
  page: number;
  totalCount: number;
  totalPages: number;
};

export type DataDictionaryTechStackPage = {
  pagination: DataDictionaryPagination;
  tools: TechStackTool[];
};

export type DataDictionaryProcessPage = {
  pagination: DataDictionaryPagination;
  processes: DictionaryProcess[];
};

export type DataDictionaryProcessPageParams = {
  catalog: DataDictionaryCatalog;
  domainKey?: string;
  industryId?: string;
  limit: number;
  page: number;
  scope?: "industry-default" | "industry-domain";
  search: string;
  signal?: AbortSignal;
};

export type DefaultIndustryProcessImportResult = {
  createdCount: number;
  skippedCount: number;
  totalCount: number;
  unavailableIndustryCount: number;
};

export type DefaultIndustryRow = {
  categories: string[];
  defaultProcessCount: number;
  industryKey: string;
  industryName: string;
  status: "active" | "inactive" | "missing";
  tiers: string[];
};

export type DefaultIndustryGrid = {
  rows: DefaultIndustryRow[];
  totalCount: number;
};

export type DefaultIndustryImportResult = {
  createdCount: number;
  reactivatedCount: number;
  skippedCount: number;
  totalCount: number;
};

export type DefaultDomainRow = {
  activeIndustryCount: number;
  defaultProcessCount: number;
  displayOrder: number;
  domainAliases: string[];
  domainKey: string;
  domainName: string;
  inactiveIndustryCount: number;
  missingIndustryCount: number;
  status: "active" | "partial" | "inactive" | "missing";
};

export type DefaultDomainGrid = {
  configuredMappingCount: number;
  industryCount: number;
  rows: DefaultDomainRow[];
  totalCount: number;
  totalMappingCount: number;
};

export type DefaultDomainImportResult = {
  createdCount: number;
  domainCount: number;
  industryCount: number;
  reactivatedCount: number;
  skippedCount: number;
  totalCount: number;
};

export type IndustryDefaultProcessGridRow = {
  category: string;
  description: string;
  industryKey: string;
  industryName: string;
  industryStatus: "active" | "inactive" | "missing";
  isActive: boolean;
  name: string;
  slug: string;
  status: "added" | "inactive" | "not-added";
  tier: string;
};

export type IndustryDefaultProcessGrid = {
  columns: Array<{
    key: string;
    label: string;
    required: boolean;
  }>;
  industryCount: number;
  rows: IndustryDefaultProcessGridRow[];
  totalCount: number;
};

export type IndustryDomainDefaultProcessImportResult = {
  createdCount: number;
  skippedCount: number;
  totalCount: number;
  unavailableDomainCount?: number;
  unavailableIndustryDomainCount: number;
};

export type IndustryDomainDefaultProcessGridRow = {
  category: string;
  description: string;
  domainKey: string;
  domainName: string;
  industryDomainId: string;
  industryKey?: string;
  industryName?: string;
  isActive: boolean;
  name: string;
  scope: string;
  slug: string;
  status: "added" | "inactive" | "not-added";
  tier: string;
};

export type IndustryDomainDefaultProcessGrid = {
  columns: Array<{
    key: string;
    label: string;
    required: boolean;
  }>;
  domainCount: number;
  industryCount?: number;
  rows: IndustryDomainDefaultProcessGridRow[];
  totalCount: number;
};

export type DomainDisplayNameUpdateResult = {
  domainKey: string;
  matchedMappingCount: number;
  name: string;
  updatedMappingCount: number;
};

const adminBasePath = "/adm/cos-process-management";

export async function fetchDataDictionary(): Promise<DataDictionaryPayload> {
  const payload = await fetchApi<ApiDataDictionaryPayload>(`${adminBasePath}/data-dictionary`);
  const dictionaryCatalog = mapCatalog(flattenDataDictionaryCatalog(payload));
  const mappedProcesses = mapProcesses(payload.processes ?? [], dictionaryCatalog);

  return {
    ...dictionaryCatalog,
    processes: mappedProcesses,
  };
}

export async function fetchDataDictionaryPageCatalog(signal?: AbortSignal) {
  const payload = await fetchApi<ApiDataDictionaryCatalogPayload>(
    `${adminBasePath}/data-dictionary/catalog`,
    { signal },
  );
  return {
    ...mapCatalog(flattenDataDictionaryCatalog(payload)),
    processSummary: payload.processSummary
      ? {
          activeCount: Math.max(0, Number(payload.processSummary.activeCount) || 0),
          inactiveCount: Math.max(0, Number(payload.processSummary.inactiveCount) || 0),
          nonDeletedCount: Math.max(0, Number(payload.processSummary.nonDeletedCount) || 0),
          totalCount: Math.max(
            0,
            Number(payload.processSummary.totalCount ?? payload.processSummary.nonDeletedCount) ||
              0,
          ),
        }
      : undefined,
    revision: payload.revision === undefined ? undefined : String(payload.revision),
  };
}

export async function fetchDataDictionaryOptions(signal?: AbortSignal) {
  const options = await fetchApi<ApiProcessOptions>(`${adminBasePath}/options`, { signal });

  return mapDataDictionaryOptions(options);
}

export async function fetchDataDictionaryProcessPage({
  catalog,
  domainKey,
  industryId,
  limit,
  page,
  scope,
  search,
  signal,
}: DataDictionaryProcessPageParams): Promise<DataDictionaryProcessPage> {
  const params: Record<string, string> = {
    limit: String(limit),
    page: String(page),
    state: "active",
  };
  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    params.search = normalizedSearch;
  }
  if (industryId) {
    params.industryId = industryId;
  }
  if (domainKey) {
    params.domainKey = domainKey;
  }
  if (scope) {
    params.scope = scope;
  }

  const response = await fetchListApi<ApiProcess>(`${adminBasePath}/data-dictionary/processes`, {
    params,
    signal,
  });
  const pagination = response.pagination ?? {};
  const lookup = createProcessLookup(catalog);
  const processes = (response.data ?? [])
    .map((process) =>
      mapProcess(
        process,
        process.scope === "industry-domain" ? "industry-domain" : "industry-default",
        catalog,
        lookup,
      ),
    )
    .filter((process): process is DictionaryProcess => Boolean(process));

  return {
    pagination: {
      limit: Number(pagination.limit) || limit,
      page: Number(pagination.page) || page,
      totalCount: Number(pagination.totalCount) || 0,
      totalPages: Number(pagination.totalPages) || 0,
    },
    processes,
  };
}

export async function fetchDataDictionaryCatalog() {
  const catalogPayload = await fetchApi<ApiCatalogPayload>(`${adminBasePath}/catalog`, {
    params: { includeInactive: "true" },
  });

  return mapCatalog(catalogPayload);
}

export async function fetchMappedProcesses(catalog: DataDictionaryCatalog) {
  const [industryProcesses, domainProcesses] = await Promise.all([
    fetchAllListApi<ApiProcess>(`${adminBasePath}/industry-processes`, {
      params: { includeInactive: "true" },
    }),
    fetchAllListApi<ApiProcess>(`${adminBasePath}/processes`, {
      params: { includeInactive: "true" },
    }),
  ]);

  return mapProcesses([...industryProcesses, ...domainProcesses], catalog);
}

function mapProcesses(processes: ApiProcess[], catalog: DataDictionaryCatalog) {
  const lookup = createProcessLookup(catalog);
  const mappedProcessRows = processes
    .map((process) =>
      mapProcess(
        process,
        process.scope === "industry-domain" ? "industry-domain" : "industry-default",
        catalog,
        lookup,
      ),
    )
    .filter((process): process is DictionaryProcess => Boolean(process))
    .filter((process) => process.isActive !== false);

  return addProcessCodes(mappedProcessRows);
}

type ProcessLookup = {
  categoryLabelByValue: Map<string, string>;
  domainById: Map<string, DictionaryDomain>;
  industryById: Map<string, DictionaryIndustry>;
  libraryById: Map<string, DictionaryLibrary>;
  libraryByIndustryAndDomain: Map<string, DictionaryLibrary>;
};

function createProcessLookup(catalog: DataDictionaryCatalog): ProcessLookup {
  const libraryById = new Map<string, DictionaryLibrary>();
  const libraryByIndustryAndDomain = new Map<string, DictionaryLibrary>();

  catalog.libraries.forEach((library) => {
    [library.id, library.domainId].filter(Boolean).forEach((id) => {
      if (!libraryById.has(id)) {
        libraryById.set(id, library);
      }
    });
    libraryByIndustryAndDomain.set(`${library.industryId}:${library.domainId}`, library);
  });

  return {
    categoryLabelByValue: new Map(
      catalog.options.categories.map((option) => [option.value, option.label]),
    ),
    domainById: new Map(catalog.domains.map((domain) => [domain.id, domain])),
    industryById: new Map(
      [...catalog.industries, ...catalog.inactiveIndustries].map((industry) => [
        industry.id,
        industry,
      ]),
    ),
    libraryById,
    libraryByIndustryAndDomain,
  };
}

export async function fetchArchivedDataDictionaryProcesses() {
  const archiveCatalog = getArchiveProcessCatalog();
  const archiveLookup = createProcessLookup(archiveCatalog);
  const [archivedIndustryProcesses, archivedDomainProcesses] = await Promise.all([
    fetchAllListApi<ApiProcess>(`${adminBasePath}/industry-processes`, {
      params: { archiveView: "true", includeInactive: "true" },
    }),
    fetchAllListApi<ApiProcess>(`${adminBasePath}/processes`, {
      params: { archiveView: "true", includeInactive: "true" },
    }),
  ]);
  const archivedProcessRows = [
    ...archivedIndustryProcesses.map((process) =>
      mapProcess(process, "industry-default", archiveCatalog, archiveLookup),
    ),
    ...archivedDomainProcesses.map((process) =>
      mapProcess(process, "industry-domain", archiveCatalog, archiveLookup),
    ),
  ].filter((process): process is DictionaryProcess => Boolean(process));

  return addProcessCodes(archivedProcessRows);
}

function getArchiveProcessCatalog(): DataDictionaryCatalog {
  return {
    domains: [],
    inactiveDomains: [],
    industries: [],
    inactiveIndustries: [],
    libraries: [],
    options: {
      categories: [...processCategories],
      currencyConversionRate: 3.6725,
      tiers: getStaticTierOptions(),
    },
  };
}

export async function fetchMappedTechStackPage({
  limit,
  page,
  search,
}: {
  limit: number;
  page: number;
  search: string;
}): Promise<DataDictionaryTechStackPage> {
  const trimmedSearch = search.trim();
  const params: Record<string, string> = {
    includeInactive: "true",
    limit: String(limit),
    page: String(page),
    scope: "common",
  };

  if (trimmedSearch) {
    params.search = trimmedSearch;
  }

  const techStackResponse = await fetchListApi<ApiTechStack>(`${adminBasePath}/tech-stack`, {
    params,
  });
  const techStackPagination = techStackResponse.pagination ?? {};

  return {
    pagination: {
      limit: Number(techStackPagination.limit) || limit,
      page: Number(techStackPagination.page) || page,
      totalCount: Number(techStackPagination.totalCount) || 0,
      totalPages: Number(techStackPagination.totalPages) || 0,
    },
    tools: (techStackResponse.data ?? [])
      .map(mapTechStackTool)
      .filter((tool): tool is TechStackTool => Boolean(tool)),
  };
}

export async function createDataDictionaryIndustry(payload: { name: string }) {
  const industry = await fetchApi<ApiEntity>(`${adminBasePath}/industries`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return mapIndustry(industry);
}

export async function fetchDataDictionaryDefaultIndustries() {
  return fetchApi<DefaultIndustryGrid>(`${adminBasePath}/industries/defaults`);
}

export async function addDataDictionaryDefaultIndustries(payload: { industryKey?: string }) {
  return fetchApi<DefaultIndustryImportResult>(`${adminBasePath}/industries/defaults`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function fetchDataDictionaryDefaultDomains() {
  return fetchApi<DefaultDomainGrid>(`${adminBasePath}/domains/defaults`);
}

export async function addDataDictionaryDefaultDomains(payload: {
  domainKey?: string;
  industryId?: string;
}) {
  return fetchApi<DefaultDomainImportResult>(`${adminBasePath}/domains/defaults`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function deleteDataDictionaryIndustry(payload: {
  force?: boolean;
  industryId: string;
}) {
  const industry = await fetchApi<ApiEntity>(`${adminBasePath}/industries/${payload.industryId}`, {
    method: "DELETE",
    params: payload.force ? { force: "true" } : undefined,
  });

  return mapIndustry(industry);
}

export async function createDataDictionaryDomain(payload: {
  industryId: string;
  name: string;
  slug?: string;
}) {
  const domain = await fetchApi<ApiEntity>(`${adminBasePath}/domains`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return mapDomain(domain, [payload.industryId]);
}

export async function updateDataDictionaryDomainDisplayName(payload: {
  domainKey: string;
  name: string;
}) {
  return fetchApi<DomainDisplayNameUpdateResult>(
    `${adminBasePath}/domains/by-key/${encodeURIComponent(payload.domainKey)}/display-name`,
    {
      body: JSON.stringify({ name: payload.name.trim() }),
      method: "PATCH",
    },
  );
}

export async function permanentlyDeleteDataDictionaryDomain(domain: DictionaryDomain) {
  if (domain.isActive !== false) {
    throw new Error("Deactivate the domain before deleting it permanently");
  }

  const deletedDomain = await fetchApi<ApiEntity>(
    `${adminBasePath}/domains/${domain.id}/permanent`,
    { method: "DELETE" },
  );

  return mapDomain(deletedDomain, domain.industryIds);
}

export async function deleteDataDictionaryProcessLibrary(libraryId: string) {
  const domain = await fetchApi<ApiEntity>(`${adminBasePath}/libraries/${libraryId}`, {
    method: "DELETE",
  });

  return mapDomain(domain, []);
}

export async function createDataDictionaryProcessLibrary(payload: {
  domainId: string;
  industryId: string;
}) {
  const library = await fetchApi<ApiMapping>(`${adminBasePath}/libraries`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return mapLibrary(library);
}

export async function reorderDataDictionaryIndustries(payload: { industryIds: string[] }) {
  const industries = await fetchApi<ApiEntity[]>(`${adminBasePath}/industries/reorder`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });

  return industries
    .map(mapIndustry)
    .filter((industry): industry is DictionaryIndustry => Boolean(industry));
}

export async function reorderDataDictionaryDomains(payload: {
  domainIds: string[];
  industryId: string;
}) {
  const libraries = await fetchApi<ApiMapping[]>(`${adminBasePath}/domains/reorder`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });

  return libraries
    .map((library) => mapLibrary(library))
    .filter((library): library is DictionaryLibrary => Boolean(library));
}

export async function createDataDictionaryIndustryProcess(
  payload: DataDictionaryProcessPayload & { industryId: string },
) {
  const process = await fetchApi<ApiProcess>(`${adminBasePath}/industry-processes`, {
    body: JSON.stringify(toApiProcessPayload(payload)),
    method: "POST",
  });

  return getId(process);
}

export async function addDataDictionaryDefaultIndustryProcesses(payload: { industryId?: string }) {
  return fetchApi<DefaultIndustryProcessImportResult>(
    `${adminBasePath}/industry-processes/defaults`,
    { body: JSON.stringify(payload), method: "POST" },
  );
}

export async function fetchDataDictionaryIndustryDefaultGrid() {
  return fetchApi<IndustryDefaultProcessGrid>(`${adminBasePath}/industry-processes/defaults`);
}

export async function createDataDictionaryDomainProcess(
  payload: DataDictionaryProcessPayload & { industryDomainId: string },
) {
  const process = await fetchApi<ApiProcess>(`${adminBasePath}/processes`, {
    body: JSON.stringify(toApiProcessPayload(payload)),
    method: "POST",
  });

  return getId(process);
}

export async function addDataDictionaryDefaultIndustryDomainProcesses(payload: {
  industryDomainId?: string;
}) {
  return fetchApi<IndustryDomainDefaultProcessImportResult>(`${adminBasePath}/processes/defaults`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function fetchDataDictionaryIndustryDomainDefaultGrid() {
  return fetchApi<IndustryDomainDefaultProcessGrid>(`${adminBasePath}/processes/defaults`);
}

export async function createDataDictionaryTechStack(
  payload: DataDictionaryTechStackPayload,
): Promise<string> {
  const tool = await fetchApi<ApiTechStack>(`${adminBasePath}/tech-stack`, {
    body: JSON.stringify(toApiTechStackPayload(payload)),
    method: "POST",
  });

  return getId(tool);
}

export async function updateDataDictionaryTechStack(payload: {
  tool: TechStackTool;
  values: DataDictionaryTechStackPayload;
}) {
  const tool = await fetchApi<ApiTechStack>(`${adminBasePath}/tech-stack/${payload.tool.id}`, {
    body: JSON.stringify(toApiTechStackPayload(payload.values)),
    method: "PUT",
    params: { scope: "common" },
  });

  return getId(tool);
}

export async function updateDataDictionaryTechStackStatus(payload: {
  isActive: boolean;
  tool: TechStackTool;
}) {
  const tool = await fetchApi<ApiTechStack>(
    `${adminBasePath}/tech-stack/${payload.tool.id}/status`,
    {
      body: JSON.stringify({ isActive: payload.isActive }),
      method: "PATCH",
      params: { scope: "common" },
    },
  );

  return getId(tool);
}

export async function deleteDataDictionaryTechStack(toolId: string) {
  const tool = await fetchApi<ApiTechStack>(`${adminBasePath}/tech-stack/${toolId}`, {
    method: "DELETE",
    params: { scope: "common" },
  });

  return getId(tool);
}

export async function activateAllDataDictionaryTechStack() {
  const response = await fetchApi<{
    activatedCount?: number;
    skippedCount?: number;
  }>(`${adminBasePath}/tech-stack/activate-all`, {
    method: "PATCH",
    params: { scope: "common" },
  });

  return {
    activatedCount: Number(response.activatedCount || 0),
    skippedCount: Number(response.skippedCount || 0),
  };
}

export async function archiveAllDataDictionaryTechStack() {
  const response = await fetchApi<{ archivedCount?: number }>(
    `${adminBasePath}/tech-stack/archive-all`,
    {
      method: "PATCH",
      params: { scope: "common" },
    },
  );

  return Number(response.archivedCount || 0);
}

export async function deleteAllDataDictionaryTechStack() {
  const deleteAllToolsResponse = await fetchApi<{ deletedCount?: number }>(
    `${adminBasePath}/tech-stack`,
    {
      method: "DELETE",
      params: { scope: "common" },
    },
  );

  return Number(deleteAllToolsResponse.deletedCount || 0);
}

export async function updateDataDictionaryProcess(payload: {
  process: DictionaryProcess;
  values: DataDictionaryProcessPayload;
}) {
  const process = await fetchApi<ApiProcess>(getProcessPath(payload.process), {
    body: JSON.stringify(toApiProcessPayload(payload.values)),
    method: "PUT",
  });

  return getId(process);
}

export async function updateDataDictionaryProcessStatus(payload: {
  isActive: boolean;
  process: DictionaryProcess;
}) {
  const process = await fetchApi<ApiProcess>(`${getProcessPath(payload.process)}/status`, {
    body: JSON.stringify({ isActive: payload.isActive }),
    method: "PATCH",
  });

  return getId(process);
}

export async function deleteDataDictionaryProcess(process: DictionaryProcess) {
  const deletedProcess = await fetchApi<ApiProcess>(getProcessPath(process), {
    method: "DELETE",
  });

  return getId(deletedProcess);
}

export async function permanentlyDeleteDataDictionaryProcess(process: DictionaryProcess) {
  if (process.isDeleted !== true) {
    await deleteDataDictionaryProcess(process);
  }

  const deletedProcess = await fetchApi<ApiProcess>(getProcessPath(process), {
    method: "DELETE",
    params: { permanent: "true" },
  });

  return getId(deletedProcess);
}

export type DeleteAllArchivedProcessesResult = {
  counts: {
    industryDefault: number;
    industryDomain: number;
  };
  deletedCount: number;
};

export async function permanentlyDeleteAllArchivedDataDictionaryProcesses() {
  return fetchApi<DeleteAllArchivedProcessesResult>(`${adminBasePath}/archive/processes`, {
    method: "DELETE",
  });
}

export async function restoreDataDictionaryProcess(process: DictionaryProcess) {
  const restoredProcess = await fetchApi<ApiProcess>(`${getProcessPath(process)}/restore`, {
    method: "PATCH",
  });

  return getId(restoredProcess);
}

export async function updateDataDictionaryCurrencyConversionRate(rate: number) {
  const settingsResponse = await fetchApi<ApiCurrencySettings>(
    `${adminBasePath}/settings/currency-conversion-rate`,
    {
      body: JSON.stringify({ currencyConversionRate: rate }),
      method: "PUT",
    },
  );

  const savedRate = Number(
    settingsResponse.displayToBaseCurrencyRate ?? settingsResponse.currencyConversionRate,
  );
  return Number.isFinite(savedRate) && savedRate > 0 ? savedRate : rate;
}

function toApiTechStackPayload(payload: DataDictionaryTechStackPayload) {
  return {
    benchmarkPricing: payload.benchmarkPricing,
    category: payload.category.trim(),
    company: payload.vendor.trim(),
    description: payload.description?.trim() || undefined,
    scope: "common",
    title: payload.name.trim(),
  };
}

function mapCatalog(catalogPayload: ApiCatalogPayload = {}): DataDictionaryCatalog {
  const mappedIndustries = (catalogPayload.industries ?? [])
    .map(mapIndustry)
    .filter((industry): industry is DictionaryIndustry => Boolean(industry));
  const industries = mappedIndustries.filter((industry) => industry.isActive !== false);
  const inactiveIndustries = mappedIndustries.filter((industry) => industry.isActive === false);
  const industryIds = new Set(industries.map((industry) => industry.id));
  const industryById = new Map(industries.map((industry) => [industry.id, industry]));
  const domainById = new Map<string, DictionaryDomain>();
  const libraries: DictionaryLibrary[] = [];

  (catalogPayload.domains ?? []).forEach((domain) => {
    const mappedDomain = mapDomain(domain, []);

    if (mappedDomain) {
      domainById.set(mappedDomain.id, mappedDomain);
    }
  });

  (catalogPayload.libraries ?? []).forEach((mapping) => {
    if (!mapping) {
      return;
    }

    const industryId = getId(mapping.industryId);
    const domainId = getId(mapping.domainId);
    const rawDomain = typeof mapping.domainId === "object" ? mapping.domainId : undefined;
    const existingDomain = domainById.get(domainId);
    const library = mapLibrary(mapping, {
      domainName: existingDomain?.name,
      industryName: industryById.get(industryId)?.name,
    });

    if (!library || !industryIds.has(industryId)) {
      return;
    }

    if (library.isActive !== false) {
      libraries.push(library);
    }

    const domain =
      mapDomain(rawDomain, industryId ? [industryId] : []) ||
      existingDomain ||
      mapDomain(
        {
          _id: library.domainId,
          displayOrder: library.displayOrder,
          isActive: library.isActive,
          name: library.domainName,
          slug: toSlug(library.domainName),
        },
        [industryId],
      );

    if (!domain) {
      return;
    }

    const currentDomain = domainById.get(domain.id);
    if (!currentDomain) {
      domainById.set(domain.id, domain);
      return;
    }

    if (!currentDomain.industryIds.includes(industryId)) {
      currentDomain.industryIds.push(industryId);
    }
  });

  return {
    domains: sortByDisplayOrder(
      Array.from(domainById.values()).filter(
        (domain) => domain.isActive !== false && domain.industryIds.length > 0,
      ),
    ),
    inactiveDomains: sortByDisplayOrder(
      Array.from(domainById.values()).filter(
        (domain) => domain.isActive === false && domain.industryIds.length > 0,
      ),
    ),
    industries: sortByDisplayOrder(industries),
    inactiveIndustries: sortByDisplayOrder(inactiveIndustries),
    libraries: sortByDisplayOrder(libraries),
    options: mapDataDictionaryOptions(catalogPayload.options),
  };
}

function flattenDataDictionaryCatalog(payload: ApiDataDictionaryPayload): ApiCatalogPayload {
  const domains: ApiEntity[] = [];
  const libraries: ApiMapping[] = [];

  const industries = (payload.industries ?? []).map((industry) => {
    const industryId = getId(industry);
    const normalizedIndustry: ApiDataDictionaryIndustry = {
      ...industry,
      associatedProcessCount: industry.associatedProcessCount ?? industry.processCounts?.nonDeleted,
      defaultProcessCount:
        industry.defaultProcessCount ?? industry.processCounts?.industryDefault?.nonDeleted,
      industryDomainProcessCount:
        industry.industryDomainProcessCount ?? industry.processCounts?.industryDomain?.nonDeleted,
    };

    (industry.domains ?? []).forEach((domain) => {
      const domainId = domain.industryDomainId || getId(domain);

      if (!industryId || !domainId) {
        return;
      }

      const domainEntity: ApiEntity = {
        ...domain,
        id: domainId,
        processCounts: domain.processCounts,
      };

      domains.push(domainEntity);
      libraries.push({
        displayOrder: domain.displayOrder,
        domainId: domainEntity,
        domainName: domain.name,
        domainSlug: domain.slug,
        id: domainId,
        industryId: normalizedIndustry,
        industryName: normalizedIndustry.name,
        industrySlug: normalizedIndustry.slug,
        isActive: domain.isActive,
        processCount: domain.processCount ?? domain.processCounts?.nonDeleted,
      });
    });

    return normalizedIndustry;
  });

  return {
    domains,
    industries,
    libraries,
    options: payload.options,
  };
}

function getCurrencyConversionRate(conversionRateValue: unknown) {
  const rate = Number(conversionRateValue);

  return Number.isFinite(rate) && rate > 0 ? rate : 3.6725;
}

function mapDataDictionaryOptions(options?: ApiProcessOptions): DataDictionaryOptions {
  return {
    categories: mapProcessOptions(options?.categories),
    currencyConversionRate: getCurrencyConversionRate(
      options?.currency?.displayToBaseRate ??
        options?.displayToBaseCurrencyRate ??
        options?.currencyConversionRate,
    ),
    tiers: mapProcessOptions(options?.tiers, getStaticTierOptions()),
  };
}

function mapIndustry(industry?: ApiEntity): DictionaryIndustry | null {
  const id = getId(industry);
  const name = toDisplayName(industry?.name || industry?.slug || "");
  const associatedProcessCount = industry?.associatedProcessCount;
  const defaultProcessCount = industry?.defaultProcessCount;
  const industryDomainProcessCount = industry?.industryDomainProcessCount;

  if (!id || !name) {
    return null;
  }

  return {
    associatedProcessCount:
      typeof associatedProcessCount === "number" && Number.isFinite(associatedProcessCount)
        ? Math.max(0, Math.floor(associatedProcessCount))
        : undefined,
    defaultProcessCount:
      typeof defaultProcessCount === "number" && Number.isFinite(defaultProcessCount)
        ? Math.max(0, Math.floor(defaultProcessCount))
        : undefined,
    displayOrder: Number(industry?.displayOrder) || 0,
    id,
    industryDomainProcessCount:
      typeof industryDomainProcessCount === "number" && Number.isFinite(industryDomainProcessCount)
        ? Math.max(0, Math.floor(industryDomainProcessCount))
        : undefined,
    isActive: industry?.isActive !== false,
    name,
    slug: industry?.slug || toSlug(name),
  };
}

function mapDomain(domain: ApiEntity | undefined, industryIds: string[]): DictionaryDomain | null {
  const id = getId(domain);
  const name = toDomainLabel(domain);

  if (!id || !name) {
    return null;
  }

  return {
    displayOrder: Number(domain?.displayOrder) || 0,
    id,
    industryIds,
    isActive: domain?.isActive !== false,
    name,
    slug: domain?.slug || toSlug(name),
  };
}

function mapLibrary(
  mapping?: ApiMapping,
  fallbackNames: { domainName?: string; industryName?: string } = {},
): DictionaryLibrary | null {
  const domainId = getId(mapping?.domainId);
  const industryId = getId(mapping?.industryId);
  const domain = typeof mapping?.domainId === "object" ? mapping.domainId : undefined;
  const industry = typeof mapping?.industryId === "object" ? mapping.industryId : undefined;

  if (!domainId || !industryId) {
    return null;
  }

  return {
    displayOrder: Number(mapping?.displayOrder) || 0,
    id: mapping?.id || domainId,
    domainId,
    domainName:
      toDisplayName(mapping?.domainName || "") ||
      toDomainLabel(domain) ||
      fallbackNames.domainName ||
      "Mapped Domain",
    domainSlug:
      mapping?.domainSlug ||
      domain?.slug ||
      toSlug(mapping?.domainName || fallbackNames.domainName || ""),
    industryId,
    industryName:
      toDisplayName(mapping?.industryName || "") ||
      toDisplayName(industry?.name || industry?.slug || "") ||
      fallbackNames.industryName ||
      "Mapped Industry",
    industrySlug:
      mapping?.industrySlug ||
      industry?.slug ||
      toSlug(mapping?.industryName || industry?.name || fallbackNames.industryName || ""),
    isActive: mapping?.isActive !== false,
    processCount: Math.max(0, Number(mapping?.processCount) || 0),
  };
}

function mapProcess(
  process: ApiProcess,
  fallbackScope: "industry-default" | "industry-domain",
  catalog: DataDictionaryCatalog,
  lookup: ProcessLookup,
): DictionaryProcess | null {
  const id = getId(process);
  const name = toDisplayName(process.name || process.slug || "");
  const scope = process.scope || fallbackScope;
  const industryId = process.industryId || "";
  const domainId = process.industryDomainId || "";
  const domainLibrary =
    lookup.libraryById.get(domainId) ||
    lookup.libraryByIndustryAndDomain.get(`${industryId}:${domainId}`);
  const domain = lookup.domainById.get(domainLibrary?.domainId || domainId);
  const industry = lookup.industryById.get(industryId || domainLibrary?.industryId || "");
  const processIndustryName = toDisplayName(process.industryName || process.industrySlug || "");
  const processDomainName = toDisplayName(process.domainName || process.domainSlug || "");

  if (!id || !name) {
    return null;
  }

  const costAmount = Number(process.estimatedAnnualCost?.amount) || 0;
  const costCurrency = process.estimatedAnnualCost?.currency || "AED";
  const processState = getApiProcessState(process);

  return {
    category:
      lookup.categoryLabelByValue.get(toSlug(process.category || "")) ||
      getOptionLabel(catalog.options.categories, process.category || ""),
    categoryValue: toSlug(process.category || ""),
    code: String(process.code || "").trim(),
    cost: formatCost(process.estimatedAnnualCost),
    costAmount,
    costCurrency,
    description: String(process.description || "").trim(),
    domain:
      scope === "industry-domain"
        ? domain?.name || domainLibrary?.domainName || processDomainName || "Mapped Domain"
        : "Industry Default",
    domainId:
      scope === "industry-domain"
        ? domain?.id || domainLibrary?.domainId || domainId
        : "industry-default",
    hours: formatHours(process.hoursPerYear),
    id,
    industryIds: industry?.id ? [industry.id] : industryId ? [industryId] : [],
    isActive: processState.isActive,
    isDeleted: processState.isDeleted,
    name,
    scope,
    source: scope === "industry-domain" ? "Industry x Domain" : "Industry Default",
    tier: toTierLabel(process.tier),
    tierValue: process.tier || "",
    industryLabel:
      industry?.name || domainLibrary?.industryName || processIndustryName || undefined,
  };
}

function getApiProcessState(process: ApiProcess) {
  if (typeof process.state === "object" && process.state) {
    return {
      isActive: process.state.isActive ?? process.isActive !== false,
      isDeleted: process.state.isDeleted ?? process.isDeleted === true,
    };
  }

  if (typeof process.state === "string") {
    const state = process.state.toLowerCase();

    return {
      isActive: state === "active",
      isDeleted: state === "archived" || state === "deleted",
    };
  }

  return {
    isActive: process.isActive !== false,
    isDeleted: process.isDeleted === true,
  };
}

function mapTechStackTool(tool: ApiTechStack): TechStackTool | null {
  const id = getId(tool);
  const name = toDisplayName(tool.title || "");
  const hasExplicitCategory = Boolean(tool.category?.trim());

  if (!id || !name) {
    return null;
  }

  return {
    benchmarkPricing: mapTechStackBenchmarkPricing(tool.benchmarkPricing),
    category: toDisplayName(tool.category || tool.description || "") || "General",
    description: hasExplicitCategory ? String(tool.description || "").trim() : undefined,
    id,
    isActive: tool.isActive !== false,
    name,
    vendor: toDisplayName(tool.company || "") || "Unassigned",
  };
}

function mapTechStackBenchmarkPricing(
  value: ApiTechStack["benchmarkPricing"],
): TechStackBenchmarkPricing | undefined {
  if (!value || value.currency !== "USD") {
    return undefined;
  }

  const monthlyOperationalCost = normalizeOptionalBenchmarkCost(value.monthlyOperationalCost);
  const setupCost = normalizeOptionalBenchmarkCost(value.setupCost);
  const confidence = ["published", "indicative", "quote-required"].includes(
    String(value.confidence),
  )
    ? (value.confidence as TechStackBenchmarkPricing["confidence"])
    : undefined;

  return {
    currency: "USD",
    monthlyOperationalCost,
    setupCost,
    sourceLabel: String(value.sourceLabel || "").trim() || undefined,
    sourceUrl: String(value.sourceUrl || "").trim() || undefined,
    checkedAt: String(value.checkedAt || "").trim() || null,
    confidence,
  };
}

function normalizeOptionalBenchmarkCost(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function mapProcessOptions(
  values?: string[],
  fallbackOptions: readonly ProcessOption[] = processCategories,
): ProcessOption[] {
  const options = (values ?? [])
    .map((value) => toProcessOption(value, fallbackOptions))
    .filter((option): option is ProcessOption => Boolean(option));

  return options.length ? options : [...fallbackOptions];
}

function toProcessOption(
  value: string,
  fallbackOptions: readonly ProcessOption[] = processCategories,
): ProcessOption | null {
  const normalizedValue = toSlug(value);

  if (!normalizedValue) {
    return null;
  }

  return {
    value: normalizedValue,
    label:
      fallbackOptions.find((option) => option.value === normalizedValue)?.label ||
      toDisplayName(normalizedValue),
  };
}

function getStaticTierOptions(): ProcessOption[] {
  return [
    { label: "Must-Have", value: "must-have" },
    { label: "Good-to-Have", value: "good-to-have" },
    { label: "Nice to Have", value: "nice-to-have" },
    { label: "Future Enhancement", value: "future-enhancement" },
  ];
}

function getOptionLabel(options: readonly ProcessOption[], value: string) {
  const normalizedValue = toSlug(value);

  if (!normalizedValue) {
    return "";
  }

  return (
    options.find((option) => option.value === normalizedValue)?.label ||
    toDisplayName(normalizedValue)
  );
}

function addProcessCodes(processes: DictionaryProcess[]) {
  const counters = new Map<string, number>();

  return processes.map((process) => {
    const prefix =
      process.scope === "industry-domain"
        ? getDomainCode(process.domain)
        : getDomainCode(process.industryLabel || "Default");
    const nextCount = (counters.get(prefix) ?? 0) + 1;

    counters.set(prefix, nextCount);

    const codeNumber =
      process.scope === "industry-domain" ? String(nextCount) : String(nextCount).padStart(2, "0");

    return {
      ...process,
      code: `${prefix}-${codeNumber}`,
    };
  });
}

function toApiProcessPayload<T extends DataDictionaryProcessPayload>(payload: T) {
  return {
    ...payload,
    category: toSlug(payload.category),
    estimatedAnnualCost: {
      amount: Math.max(0, Number(payload.estimatedAnnualCost.amount) || 0),
      currency: payload.estimatedAnnualCost.currency,
    },
    hoursPerYear: Math.max(0, Math.round(Number(payload.hoursPerYear) || 0)),
    name: payload.name.trim(),
    tier: toBackendTier(payload.tier),
  };
}

function getProcessPath(process: DictionaryProcess) {
  const collectionPath = process.scope === "industry-default" ? "industry-processes" : "processes";

  return `${adminBasePath}/${collectionPath}/${process.id}`;
}

function toBackendTier(tierValue: string) {
  const normalizedValue = toSlug(tierValue);
  const tiers: Record<string, string> = {
    future: "future",
    "future-enhancement": "future",
    "future-enhancements": "future",
    "good-to-have": "good-to-have",
    "must-have": "must-have",
    "nice-to-have": "nice-to-have",
  };

  return tiers[normalizedValue] || normalizedValue;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
) {
  return fetchAdminApiData<T>(path, {
    ...options,
    authErrorMessage: "Admin access token is required to load mapped COS data",
    emptyDataErrorMessage: "COS data dictionary response is empty",
    errorMessage: "Unable to load COS data dictionary",
    includeJsonContentType: true,
  });
}

async function fetchListApi<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
): Promise<ApiListPayload<T>> {
  return fetchAdminApiList<T>(path, {
    ...options,
    authErrorMessage: "Admin access token is required to load mapped COS data",
    errorMessage: "Unable to load COS data dictionary",
    includeJsonContentType: true,
  });
}

async function fetchAllListApi<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
) {
  const firstPage = await fetchListApi<T>(path, {
    ...options,
    params: { ...options.params, page: "1" },
  });
  const totalPages = Math.max(1, Number(firstPage.pagination?.totalPages) || 1);

  if (totalPages <= 1) {
    return firstPage.data ?? [];
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchListApi<T>(path, {
        ...options,
        params: { ...options.params, page: String(index + 2) },
      }),
    ),
  );

  return [...(firstPage.data ?? []), ...remainingPages.flatMap((page) => page.data ?? [])];
}

function getId(entity?: ApiEntity | string | null) {
  if (!entity) {
    return "";
  }

  return typeof entity === "string" ? entity : entity.id || entity._id || "";
}

function toDomainLabel(domain?: ApiEntity) {
  return toDisplayName(domain?.name || domain?.slug || "");
}

function toDisplayName(rawName: string) {
  return rawName
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b[a-z]/g, (character) => character.toUpperCase())
    .replace(/\b(Cx|Hr|It|Bpo|Uae|Usa|Uk)\b/g, (match) => match.toUpperCase());
}

function toSlug(rawValue: string) {
  return rawValue
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTierLabel(value?: string): ProcessTier {
  const normalizedValue = toSlug(value || "");
  const labels: Record<string, ProcessTier> = {
    future: "Future Enhancement",
    "future-enhancement": "Future Enhancement",
    "future-enhancements": "Future Enhancement",
    "good-to-have": "Good-to-Have",
    "must-have": "Must-Have",
    "nice-to-have": "Nice to Have",
  };

  if (!normalizedValue) {
    return "Must-Have";
  }

  return labels[normalizedValue] || toDisplayName(normalizedValue);
}

function sortByDisplayOrder<T extends { displayOrder?: number }>(items: T[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((firstItem, secondItem) => {
      const firstOrder = getPositiveDisplayOrder(firstItem.item.displayOrder);
      const secondOrder = getPositiveDisplayOrder(secondItem.item.displayOrder);

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return firstItem.index - secondItem.index;
    })
    .map(({ item }) => item);
}

function getPositiveDisplayOrder(displayOrder?: number) {
  const value = Number(displayOrder);

  return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function formatCost(cost?: ApiProcess["estimatedAnnualCost"]) {
  const amount = Number(cost?.amount) || 0;
  const currency = cost?.currency || "AED";
  const formattedAmount = amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

  return currency === "USD" ? `$${formattedAmount}` : `${currency} ${formattedAmount}`;
}

function formatHours(value?: number) {
  const hours = Math.max(0, Math.round(Number(value) || 0));

  return hours > 0 ? hours.toLocaleString("en-US") : "Not set";
}

function getDomainCode(value: string) {
  const normalizedValue = toSlug(value);
  const knownCodes: Record<string, string> = {
    admin: "ADM",
    "customer-experience": "CX",
    cx: "CX",
    default: "DEF",
    hr: "HR",
    "industry-default": "DEF",
    "it-operations": "IT",
    "it-ops": "IT",
    mktg: "MKT",
  };

  if (knownCodes[normalizedValue]) {
    return knownCodes[normalizedValue];
  }

  return value
    .replace(/&/g, "")
    .split(/\s+|\//)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}
