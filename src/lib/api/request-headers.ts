import { getAccessToken } from "@/lib/auth/storage";

type AdminRequestHeadersOptions = {
  authErrorMessage?: string;
  includeJsonContentType?: boolean;
  requireAuth?: boolean;
};

const fallbackTokenKeys = ["access_token", "auth_token"] as const;

export function getStoredAdminAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const storedToken = getAccessTokenSafely();

  if (storedToken) {
    return storedToken;
  }

  for (const key of fallbackTokenKeys) {
    const token = getWebStorageToken(window.localStorage, key);

    if (token) {
      return token;
    }
  }

  for (const key of fallbackTokenKeys) {
    const token = getWebStorageToken(window.sessionStorage, key);

    if (token) {
      return token;
    }
  }

  return "";
}

export function getAdminAuthHeaders() {
  const token = getStoredAdminAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    accesstoken: `Bearer ${token}`,
  };
}

export function getAdminRequestHeaders(
  inputHeaders?: HeadersInit,
  options: AdminRequestHeadersOptions = {},
) {
  const headers = new Headers(inputHeaders);
  const authHeaders = getAdminAuthHeaders();
  const requireAuth = options.requireAuth ?? true;

  if (requireAuth && !authHeaders.Authorization) {
    throw new Error(options.authErrorMessage || "Admin access token is required");
  }

  headers.set("Accept", "application/json");

  if (options.includeJsonContentType) {
    headers.set("Content-Type", "application/json");
  }

  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return headers;
}

function getAccessTokenSafely() {
  try {
    return getAccessToken();
  } catch {
    return "";
  }
}

function getWebStorageToken(storage: Storage, key: string) {
  try {
    return storage.getItem(key) || "";
  } catch {
    return "";
  }
}
