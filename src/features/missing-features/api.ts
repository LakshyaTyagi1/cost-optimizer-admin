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

export type MissingFeatureHistoryEntry = {
  event: string;
  at?: string;
};

export type MissingFeatureReview = {
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedByEmail?: string;
  reason?: string;
};

/**
 * One row of the admin review list.
 *
 * Declares only the fields the missing-features page actually renders or needs
 * to address an action. The endpoint also returns `assessmentTitle`,
 * `assessmentStatus`, `toolKey`, `toolId`, `toolCompany`, `category` and
 * `audit`, but nothing here reads them, so they are left off the type rather
 * than carried as dead weight.
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

export type MissingFeatureQuery = {
  limit?: number;
  page?: number;
  productId?: string;
  search?: string;
  status?: MissingFeatureStatus | "";
};

export type MissingFeatureActionResult = {
  candidate: MissingFeatureCandidate;
  injection?: MissingFeatureInjection;
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
      productId: query.productId?.trim() || undefined,
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
  action: "accept" | "decline" | "review",
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
