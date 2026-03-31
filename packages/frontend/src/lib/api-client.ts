// Direct backend URL - bypass Next.js proxy to eliminate double-hop latency
const DIRECT_BACKEND = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : null;

const API_URL =
  typeof window !== "undefined"
    ? DIRECT_BACKEND || "/api/backend" // prefer direct if env is set
    : process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001/api/v1";
// v6 - direct backend

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem("auth_token", token);
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(API_URL + url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || "HTTP " + res.status);
  }
  const json = await res.json();
  if (json.data && Array.isArray(json.data) && "pagination" in json) {
    return {
      products: json.data,
      pagination: json.pagination,
      available_filters: json.available_filters,
    } as T;
  }
  return json.data as T;
}

export const apiClient = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, data?: unknown) => request<T>("POST", url, data),
  put: <T>(url: string, data?: unknown) => request<T>("PUT", url, data),
  patch: <T>(url: string, data?: unknown) => request<T>("PATCH", url, data),
  delete: <T>(url: string) => request<T>("DELETE", url),
  setToken,
  clearToken,
};

export type ApiResponse<T> = { data: T; message?: string; status: number };
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
  };
};
