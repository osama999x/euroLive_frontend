import { env } from "@/config/env";
import type { ApiEnvelope, TokenPair } from "@/lib/api/types";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type Portal,
} from "@/lib/auth/tokens";
import { formatMessage } from "@/lib/utils";

export class ApiError extends Error {
  statusCode: number;
  path?: string;
  errors?: string | string[];

  constructor(
    message: string | string[],
    statusCode: number,
    path?: string,
    errors?: string | string[],
  ) {
    super(formatMessage(message));
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.path = path;
    this.errors = errors;
  }
}

type ApiFetchOptions = RequestInit & {
  portal?: Portal;
  auth?: boolean;
  skipRefresh?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
};

function buildUrl(path: string, query?: ApiFetchOptions["query"]) {
  const base = env.apiBaseUrl.replace(/\/$/, "");
  const url = new URL(
    path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function refreshTokens(portal: Portal): Promise<TokenPair> {
  const refreshToken = getRefreshToken(portal);
  if (!refreshToken) {
    throw new ApiError("Missing refresh token", 401);
  }

  const res = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = (await res.json()) as ApiEnvelope<TokenPair>;
  if (!res.ok || !json.success) {
    clearTokens(portal);
    throw new ApiError(json.message ?? "Session expired", json.statusCode ?? res.status);
  }

  setTokens(portal, {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
  });
  return json.data;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    portal,
    auth = Boolean(portal),
    skipRefresh = false,
    query,
    headers,
    ...init
  } = options;

  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has("Content-Type") && init.body) {
    reqHeaders.set("Content-Type", "application/json");
  }

  if (auth && portal) {
    const access = getAccessToken(portal);
    if (access) reqHeaders.set("Authorization", `Bearer ${access}`);
  }

  const res = await fetch(buildUrl(path, query), {
    ...init,
    headers: reqHeaders,
  });

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError("Invalid JSON response", res.status);
  }

  const okHttp = res.status === 200 || res.status === 201;
  const okBody = json?.success === true;

  if (okHttp && okBody) {
    return json.data;
  }

  if (
    res.status === 401 &&
    portal &&
    auth &&
    !skipRefresh &&
    !path.includes("/auth/refresh") &&
    !path.includes("/auth/login")
  ) {
    await refreshTokens(portal);
    return apiFetch<T>(path, { ...options, skipRefresh: true });
  }

  if (res.status === 401 && portal) {
    clearTokens(portal);
  }

  throw new ApiError(
    json?.message ?? "Request failed",
    json?.statusCode ?? res.status,
    json?.path,
    json?.errors,
  );
}

export async function apiLogout(portal: Portal) {
  const refreshToken = getRefreshToken(portal);
  try {
    if (refreshToken) {
      await apiFetch("/auth/logout", {
        method: "POST",
        portal,
        auth: false,
        skipRefresh: true,
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // still clear local session
  } finally {
    clearTokens(portal);
  }
}
