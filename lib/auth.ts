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
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

export const requestWithAuth = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    clearStoredSession();
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
    throw new ApiClientError("Authentication is required.");
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null;

  if (response.status === 401) {
    clearStoredSession();
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  }

  if (!response.ok || !payload?.success) {
    throw new ApiClientError(payload?.message ?? "Request failed", payload && "errors" in payload ? payload.errors : null);
  }

  return payload.data;
};
