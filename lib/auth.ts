export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  status: "active" | "blocked";
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type RefreshTokenResponse = {
  accessToken: string;
};

type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const buildDefaultHeaders = (headers?: HeadersInit): HeadersInit => {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const apiUrl = new URL(API_BASE_URL);
    if (apiUrl.hostname.includes("ngrok")) {
      baseHeaders["ngrok-skip-browser-warning"] = "true";
    }
  } catch {
    // Ignore invalid env parsing and fall back to the provided headers only.
  }

  return {
    ...baseHeaders,
    ...(headers ?? {}),
  };
};

export class ApiClientError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.details = details;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: buildDefaultHeaders(init?.headers),
  });

  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null;

  if (!response.ok || !payload?.success) {
    throw new ApiClientError(payload?.message ?? "Request failed", payload && "errors" in payload ? payload.errors : null);
  }

  return payload.data;
};

export const authApi = {
  register(input: { firstName: string; lastName: string; email: string; password: string }) {
    return request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string }) {
    return request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  refreshToken(refreshToken: string) {
    return request<RefreshTokenResponse>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },
};

export const authStorage = {
  key: "commandctr-merchant-auth",

  save(session: AuthSession) {
    window.localStorage.setItem(this.key, JSON.stringify(session));
  },

  load(): AuthSession | null {
    const raw = window.localStorage.getItem(this.key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      window.localStorage.removeItem(this.key);
      return null;
    }
  },

  clear() {
    window.localStorage.removeItem(this.key);
  },
};

export const getStoredAccessToken = () => authStorage.load()?.accessToken ?? null;

export const clearStoredSession = () => {
  authStorage.clear();
};

let refreshSessionPromise: Promise<AuthSession | null> | null = null;
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

const redirectToLogin = () => {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const normalized = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const payload = atob(padded);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const shouldRefreshAccessToken = (accessToken: string) => {
  const payload = decodeJwtPayload(accessToken);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;

  if (!exp) {
    return false;
  }

  return exp * 1000 <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS;
};

const refreshStoredSession = async (): Promise<AuthSession | null> => {
  const session = authStorage.load();
  if (!session?.refreshToken) {
    clearStoredSession();
    return null;
  }

  if (!refreshSessionPromise) {
    refreshSessionPromise = authApi
      .refreshToken(session.refreshToken)
      .then((result) => {
        const nextSession: AuthSession = {
          ...session,
          accessToken: result.accessToken,
        };
        authStorage.save(nextSession);
        return nextSession;
      })
      .catch(() => {
        clearStoredSession();
        return null;
      })
      .finally(() => {
        refreshSessionPromise = null;
      });
  }

  return refreshSessionPromise;
};

const fetchWithAccessToken = (accessToken: string, path: string, init?: RequestInit) =>
  fetch(buildUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...buildDefaultHeaders(init?.headers),
    },
  });

export const requestWithAuth = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let accessToken = getStoredAccessToken();

  if (accessToken && shouldRefreshAccessToken(accessToken)) {
    const refreshedSession = await refreshStoredSession();
    accessToken = refreshedSession?.accessToken ?? null;
  }

  if (!accessToken) {
    const refreshedSession = await refreshStoredSession();
    accessToken = refreshedSession?.accessToken ?? null;
  }

  if (!accessToken) {
    clearStoredSession();
    redirectToLogin();
    throw new ApiClientError("Authentication is required.");
  }

  let response = await fetchWithAccessToken(accessToken, path, init);

  if (response.status === 401) {
    const refreshedSession = await refreshStoredSession();
    const nextAccessToken = refreshedSession?.accessToken ?? null;

    if (!nextAccessToken) {
      redirectToLogin();
      throw new ApiClientError("Authentication is required.");
    }

    response = await fetchWithAccessToken(nextAccessToken, path, init);
  }

  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null;

  if (response.status === 401) {
    clearStoredSession();
    redirectToLogin();
  }

  if (!response.ok || !payload?.success) {
    throw new ApiClientError(payload?.message ?? "Request failed", payload && "errors" in payload ? payload.errors : null);
  }

  return payload.data;
};
