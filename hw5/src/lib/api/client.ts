export type ApiErrorPayload = {
  message: string;
  statusCode: number;
  data?: unknown;
};

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.statusCode = payload.statusCode;
    this.data = payload.data;
  }
}

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000/api";

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path.replace(/^\//, ""), BASE_URL + "/");
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

let cachedToken: string | null | undefined = undefined;

async function getSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    // Server-side: cannot access client cookies
    return null;
  }
  
  // Return cached token if available
  if (cachedToken !== undefined) {
    return cachedToken;
  }
  
  // Fetch token from our API endpoint that has access to HttpOnly cookies
  try {
    const response = await fetch("/api/token", {
      credentials: "include"
    });
    
    if (response.ok) {
      const data = await response.json();
      const token = data.token || null;
      cachedToken = token;
      console.log("[API Client] Got session token:", token ? "yes" : "no");
      return token;
    } else {
      console.log("[API Client] No session token available");
      cachedToken = null;
      return null;
    }
  } catch (error) {
    console.error("[API Client] Failed to get session token:", error);
    cachedToken = null;
    return null;
  }
}

// Reset cached token when needed (e.g., after login/logout)
export function resetSessionToken() {
  cachedToken = undefined;
}

export async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { query, headers, body, ...rest } = options;

  const url = buildUrl(path, query);

  const finalHeaders: Record<string, string> = {};
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        finalHeaders[key] = value;
      });
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        finalHeaders[key] = value;
      }
    } else {
      Object.assign(finalHeaders, headers);
    }
  }

  // Add session token as Bearer token if available
  const sessionToken = await getSessionToken();
  if (sessionToken && !finalHeaders["Authorization"]) {
    finalHeaders["Authorization"] = `Bearer ${sessionToken}`;
    console.log(`[API Client] Sending request to ${path} with auth token`);
  } else {
    console.log(`[API Client] Sending request to ${path} WITHOUT auth token`, {
      hasToken: !!sessionToken,
      hasExistingAuth: !!finalHeaders["Authorization"]
    });
  }

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: payload,
    credentials: "include",
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  const payloadResult = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError({
      message:
        (payloadResult && typeof payloadResult === "object" && "message" in payloadResult
          ? (payloadResult as { message?: string }).message
          : undefined) ?? "Request failed",
      statusCode: response.status,
      data: payloadResult,
    });
  }

  return payloadResult as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: RequestOptions) =>
    apiFetch<TResponse>(path, { ...options, method: "GET" }),
  post: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) => apiFetch<TResponse, TBody>(path, { ...options, method: "POST", body }),
  put: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) => apiFetch<TResponse, TBody>(path, { ...options, method: "PUT", body }),
  patch: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) => apiFetch<TResponse, TBody>(path, { ...options, method: "PATCH", body }),
  delete: <TResponse>(path: string, options?: RequestOptions) =>
    apiFetch<TResponse>(path, { ...options, method: "DELETE" }),
};

export type PaginationQuery = {
  limit?: number;
  cursor?: string | null;
};

