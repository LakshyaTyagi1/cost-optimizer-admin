import { buildAdminApiUrl } from "@/lib/api/api-url";
import { getAdminRequestHeaders } from "@/lib/api/request-headers";

export type AdminApiResponse<T> = {
  data?: T;
  message?: string;
  pagination?: AdminApiPagination;
  status?: boolean;
  success?: boolean;
};

export type AdminApiListPayload<T> = {
  data: T[];
  pagination?: AdminApiPagination;
};

export type AdminApiPagination = {
  limit?: number;
  page?: number;
  totalCount?: number;
  totalPages?: number;
};

type AdminApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  authErrorMessage?: string;
  body?: BodyInit | null;
  emptyDataErrorMessage?: string;
  errorMessage?: string;
  headers?: HeadersInit;
  includeJsonContentType?: boolean;
  json?: unknown;
  params?: Record<string, string | undefined>;
  requireAuth?: boolean;
};

export async function fetchAdminApiResponse<T>(
  path: string,
  options: AdminApiRequestOptions = {},
): Promise<AdminApiResponse<T> | null> {
  const {
    authErrorMessage,
    body: inputBody,
    errorMessage = "Unable to load admin data",
    headers: inputHeaders,
    includeJsonContentType,
    json,
    params,
    requireAuth,
    ...requestOptions
  } = options;
  const hasJsonBody = json !== undefined;
  const headers = getAdminRequestHeaders(inputHeaders, {
    authErrorMessage,
    includeJsonContentType: includeJsonContentType ?? hasJsonBody,
    requireAuth,
  });
  const response = await fetch(buildAdminApiUrl(path, params), {
    ...requestOptions,
    body: hasJsonBody ? JSON.stringify(json) : inputBody,
    credentials: requestOptions.credentials ?? "include",
    headers,
  });
  const responseBody = (await response.json().catch(() => null)) as AdminApiResponse<T> | null;

  if (!response.ok || responseBody?.success === false || responseBody?.status === false) {
    throw new Error(responseBody?.message || errorMessage);
  }

  return responseBody;
}

export async function fetchAdminApiData<T>(
  path: string,
  options: AdminApiRequestOptions = {},
) {
  const responseBody = await fetchAdminApiResponse<T>(path, options);

  if (!responseBody?.data) {
    throw new Error(options.emptyDataErrorMessage || "Admin API response is empty");
  }

  return responseBody.data;
}

export async function fetchAdminApiList<T>(
  path: string,
  options: AdminApiRequestOptions = {},
): Promise<AdminApiListPayload<T>> {
  const responseBody = await fetchAdminApiResponse<T[]>(path, options);

  return {
    data: Array.isArray(responseBody?.data) ? responseBody.data : [],
    pagination: responseBody?.pagination,
  };
}
