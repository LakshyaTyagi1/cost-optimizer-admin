import {
  fetchAdminApiData,
  fetchAdminApiResponse,
  type AdminApiRequestOptions,
  type AdminApiResponse,
} from "@/lib/api/client";

/**
 * Admin review of customer-reported missing features.
 *
 * Reported candidates are not a collection of their own - each lives nested
 * inside the assessment that raised it. Every action is therefore addressed by
 * `(assessmentId, candidateId)` rather than by a document id.
 */

const adminBasePath = "/adm/cos-process-management/missing-features";

/** Mirrors the backend's server-owned transition vocabulary. */
export const missingFeatureStatuses = [
  "captured-to-organization",
  "organization-to-admin-review",
  "admin-review-to-zoftwarehub-catalog",
  "declined-at-admin-review",
] as const;

export type MissingFeatureStatus = (typeof missingFeatureStatuses)[number];

export const missingFeatureStatusLabels: Record<MissingFeatureStatus, string> = {
  "captured-to-organization": "Captured",
  "organization-to-admin-review": "Under review",
  "admin-review-to-zoftwarehub-catalog": "Accepted",
  "declined-at-admin-review": "Declined",
};

/** Short badge-style labels for the `history` transition trail. */
export const missingFeatureHistoryLabels: Record<string, string> = {
  "captured-to-organization": "Captured",
  "organization-to-admin-review": "Under review",
  "admin-review-to-zoftwarehub-catalog": "Accepted",
  "declined-at-admin-review": "Declined",
};

export function formatMissingFeatureHistory(history: MissingFeatureHistoryEntry[]) {
  if (!Array.isArray(history) || history.length === 0) {
    return "";
  }

  return history
    .map((entry) => missingFeatureHistoryLabels[entry.event] ?? entry.event)
    .join(" → ");
}

export type MissingFeatureHistoryEntry = {
  event: string;
  at?: string;
};

export type MissingFeatureReview = {
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedByEmail?: string;
  /**
   * Whether accepting this report added the feature to the ZOftwarehub product.
   * Absent means "not recorded", which is why the backend refuses to undo those
   * rather than guessing at the catalog entry's origin.
   */
  injected?: boolean;
  reason?: string;
};

/**
 * One row of the admin review list. Mirrors the backend's
 * `serializeAdminMissingFeatureListRow` exactly: identity, display fields, queue
 * state, and the report date. `review` carries only the decline reason and the
 * accept-origin flag - the accept actor/timestamp are stored server-side but are
 * not part of this response.
 */
export type MissingFeatureCandidate = {
  assessmentId: string;
  candidateId: string;
  createdAt?: string;
  customerCompany: string;
  customerEmail: string;
  customerName: string;
  description: string;
  history: MissingFeatureHistoryEntry[];
  name: string;
  parentProductId: string;
  parentProductName: string;
  review: MissingFeatureReview | null;
  status: MissingFeatureStatus;
  toolName: string;
};

export type MissingFeatureInjection = {
  injected: boolean;
  target: string;
  reason?: string;
  feature?: string;
};

export type MissingFeatureCounts = {
  total: number;
  captured: number;
  underReview: number;
  published: number;
  declined: number;
};

export type MissingFeaturePage = {
  data: MissingFeatureCandidate[];
  pagination: { limit: number; page: number; totalCount: number; totalPages: number };
  counts: MissingFeatureCounts;
};

/** The list envelope, widened with this endpoint's `counts` sibling. */
type MissingFeatureListEnvelope = AdminApiResponse<MissingFeatureCandidate[]> & {
  counts?: Partial<MissingFeatureCounts>;
};

/**
 * The exact request contract for the list endpoint. Only `limit`, `page`,
 * `search` and `status` are sent - the backend also accepts an optional
 * `productId` filter, but this page has no product filter UI so it is never
 * included on the wire.
 */
export type MissingFeatureQuery = {
  limit?: number;
  page?: number;
  search?: string;
  status?: MissingFeatureStatus | "";
};

export type MissingFeatureRemoval = {
  reason?: string;
  removed: boolean;
  target: string;
  feature?: string;
};

export type MissingFeatureActionResult = {
  candidate: MissingFeatureCandidate;
  injection?: MissingFeatureInjection;
  removal?: MissingFeatureRemoval;
};

async function requestMissingFeatures<T>(
  path: string,
  options: AdminApiRequestOptions = {},
  params?: Record<string, string | undefined>,
) {
  return fetchAdminApiData<T>(path, {
    ...options,
    authErrorMessage: "Admin access token is required to review reported features",
    emptyDataErrorMessage: "Reported features response is empty",
    errorMessage: "Unable to load reported features",
    includeJsonContentType: true,
    params,
  });
}

/**
 * The list endpoint returns `data`, `pagination` and `counts` as siblings in the
 * response envelope, so it must read the whole envelope. `fetchAdminApiData`
 * unwraps to `data` alone and would silently drop the other two, leaving the
 * page permanently empty.
 */
async function requestMissingFeaturesEnvelope(
  path: string,
  options: AdminApiRequestOptions = {},
  params?: Record<string, string | undefined>,
): Promise<MissingFeatureListEnvelope | null> {
  // `counts` is specific to this endpoint, so the envelope is widened here
  // rather than adding a domain field to the shared admin client.
  return fetchAdminApiResponse<MissingFeatureCandidate[]>(path, {
    ...options,
    authErrorMessage: "Admin access token is required to review reported features",
    errorMessage: "Unable to load reported features",
    includeJsonContentType: true,
    params,
  }) as Promise<MissingFeatureListEnvelope | null>;
}

export async function fetchMissingFeatures(
  query: MissingFeatureQuery = {},
  signal?: AbortSignal,
): Promise<MissingFeaturePage> {
  const payload = await requestMissingFeaturesEnvelope(
    adminBasePath,
    { signal },
    {
      limit: query.limit === undefined ? undefined : String(query.limit),
      page: query.page === undefined ? undefined : String(query.page),
      search: query.search?.trim() || undefined,
      status: query.status || undefined,
    },
  );

  // The envelope types these as optional, and the backend omits `pagination`
  // entirely when a request fails partway, so every field is defaulted rather
  // than trusted.
  const rawPagination = payload?.pagination;
  const rawCounts = payload?.counts;

  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    pagination: {
      limit: rawPagination?.limit ?? query.limit ?? 20,
      page: rawPagination?.page ?? query.page ?? 1,
      totalCount: rawPagination?.totalCount ?? 0,
      totalPages: rawPagination?.totalPages ?? 1,
    },
    counts: {
      total: rawCounts?.total ?? 0,
      captured: rawCounts?.captured ?? 0,
      underReview: rawCounts?.underReview ?? 0,
      published: rawCounts?.published ?? 0,
      declined: rawCounts?.declined ?? 0,
    },
  };
}

function candidatePath(
  assessmentId: string,
  candidateId: string,
  action: "accept" | "decline" | "review" | "revert",
) {
  return `${adminBasePath}/${encodeURIComponent(assessmentId)}/${encodeURIComponent(candidateId)}/${action}`;
}

export async function reviewMissingFeatureCandidate(
  candidate: MissingFeatureCandidate,
): Promise<MissingFeatureActionResult> {
  const data = await requestMissingFeatures<MissingFeatureCandidate>(
    candidatePath(candidate.assessmentId, candidate.candidateId, "review"),
    {
      method: "PATCH",
      json: {},
    },
  );

  return { candidate: data };
}

export async function acceptMissingFeatureCandidate(
  candidate: MissingFeatureCandidate,
): Promise<MissingFeatureActionResult> {
  const data = await requestMissingFeatures<
    MissingFeatureCandidate & { injection?: MissingFeatureInjection }
  >(candidatePath(candidate.assessmentId, candidate.candidateId, "accept"), {
    method: "PATCH",
    json: {},
  });

  return { candidate: data, injection: data.injection };
}

/**
 * Undoes an accepted report: the backend removes the feature this accept added
 * to the ZOftwarehub product and returns the report to the review queue.
 *
 * `removal` explains the outcome because the catalog entry may not have been
 * deleted - see `MissingFeatureRemoval`.
 */
export async function revertMissingFeatureCandidate(
  candidate: MissingFeatureCandidate,
): Promise<MissingFeatureActionResult> {
  const data = await requestMissingFeatures<
    MissingFeatureCandidate & { removal?: MissingFeatureRemoval }
  >(candidatePath(candidate.assessmentId, candidate.candidateId, "revert"), {
    method: "PATCH",
    json: {},
  });

  return { candidate: data, removal: data.removal };
}

export async function declineMissingFeatureCandidate(
  candidate: MissingFeatureCandidate,
  reason: string,
): Promise<MissingFeatureActionResult> {
  const data = await requestMissingFeatures<MissingFeatureCandidate>(
    candidatePath(candidate.assessmentId, candidate.candidateId, "decline"),
    {
      method: "PATCH",
      json: { reason: reason.trim() },
    },
  );

  return { candidate: data };
}

/**
 * The technology stack customers selected: every tool or product, with one `selections`
 * entry for each assessment that chose it. Each selection carries the plans the customer
 * picked with their prices and features, the features they ticked, the features they
 * reported as missing and the additional costs they recorded. Read-only: it exists so QA
 * can see what to add to or change in the Master Inventory catalog, and nothing here is
 * written back.
 *
 * A feature's `origin` is `added` when the customer made it up and `catalog` when it came
 * from the catalog. A catalog plan has no "not selected" state; only a plan the customer
 * created can be saved unticked.
 */
export type StackFeatureOrigin = "added" | "catalog";

export type StackSelectionPlanKind = "catalog" | "created" | "custom";

export type StackSelectionFeature = {
  featureId: string;
  name: string;
  origin: StackFeatureOrigin;
};

export type StackSelectionPlan = {
  currency: string;
  features: StackSelectionFeature[];
  kind: StackSelectionPlanKind | string;
  name: string;
  planId: string;
  selected: boolean;
  /** Empty when the customer did not enter a price for the plan. */
  unitPrice: string;
};

export type StackSelectionReport = {
  candidateId: string;
  category: string;
  createdAt: string;
  description: string;
  name: string;
  /** The plan the report was made against. Absent from an older response, which means Custom. */
  planId?: string;
  planName: string;
  status: MissingFeatureStatus;
};

export type StackSelectionCost = {
  amount: string;
  costId: string;
  costType: string;
  currency: string;
  description: string;
  enabled: boolean;
  frequency: string;
  name: string;
};

export type StackSelection = {
  additionalCosts: StackSelectionCost[];
  assessmentId: string;
  assessmentTitle: string;
  customerCompany: string;
  customerEmail: string;
  customerName: string;
  domain: string;
  featuresInUse: Array<{ name: string; origin: StackFeatureOrigin }>;
  industry: string;
  plans: StackSelectionPlan[];
  reportedFeatures: StackSelectionReport[];
  selectedAt: string;
};

export type StackProductOrigin = "catalog-tool" | "created-tool";

export type StackProduct = {
  category: string;
  company: string;
  customerCount: number;
  description: string;
  key: string;
  latestAt: string;
  origin: StackProductOrigin;
  productId: string;
  reportedFeatureCount: number;
  selectionCount: number;
  selections: StackSelection[];
  source: string;
  subCategory: string;
  toolName: string;
};

export type StackSelectionsSummary = {
  createdTools: number;
  customers: number;
  products: number;
  reportedFeatures: number;
  selections: number;
};

export type StackSelectionSort = "most-selected" | "name" | "newest";

export type StackSelectionsQuery = {
  hasReports?: boolean;
  limit?: number;
  origin?: "catalog" | "created" | "";
  page?: number;
  reportStatus?: MissingFeatureStatus | "";
  search?: string;
  sort?: StackSelectionSort;
};

export type StackSelectionsPage = {
  data: StackProduct[];
  pagination: { limit: number; page: number; totalCount: number; totalPages: number };
  summary: StackSelectionsSummary;
};

type StackSelectionsEnvelope = AdminApiResponse<StackProduct[]> & {
  summary?: Partial<StackSelectionsSummary>;
};

export async function fetchStackSelections(
  query: StackSelectionsQuery = {},
  signal?: AbortSignal,
): Promise<StackSelectionsPage> {
  // The list comes with `pagination` and `summary` as siblings of `data`, so the whole
  // envelope is read, as for the reported-features list.
  const payload = (await fetchAdminApiResponse<StackProduct[]>(
    `${adminBasePath}/stack-selections`,
    {
      authErrorMessage: "Admin access token is required to view the technology stack",
      errorMessage: "Unable to load the technology stack",
      includeJsonContentType: true,
      params: {
        hasReports: query.hasReports ? "true" : undefined,
        limit: query.limit === undefined ? undefined : String(query.limit),
        origin: query.origin || undefined,
        page: query.page === undefined ? undefined : String(query.page),
        reportStatus: query.reportStatus || undefined,
        search: query.search?.trim() || undefined,
        sort: query.sort,
      },
      signal,
    },
  )) as StackSelectionsEnvelope | null;
  const pagination = payload?.pagination;
  const summary = payload?.summary;

  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    pagination: {
      limit: pagination?.limit ?? query.limit ?? 20,
      page: pagination?.page ?? query.page ?? 1,
      totalCount: pagination?.totalCount ?? 0,
      totalPages: pagination?.totalPages ?? 1,
    },
    summary: {
      createdTools: summary?.createdTools ?? 0,
      customers: summary?.customers ?? 0,
      products: summary?.products ?? 0,
      reportedFeatures: summary?.reportedFeatures ?? 0,
      selections: summary?.selections ?? 0,
    },
  };
}
