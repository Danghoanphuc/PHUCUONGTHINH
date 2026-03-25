/**
 * Admin API client instance for CMS admin pages.
 * Uses the shared ApiClient factory with the frontend's token storage.
 */
import { createApiClient, ApiClient } from "@repo/shared-utils";

const TOKEN_KEY = "auth_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function onUnauthorized(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("auth_user");
    window.dispatchEvent(new Event("auth:unauthorized"));
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
// v3

export const adminApiClient: ApiClient = createApiClient({
  baseURL: API_URL,
  getToken,
  onUnauthorized,
});

// Convenience alias matching CMS api-client interface
export const apiClient = adminApiClient;
export const rawApiClient = adminApiClient;
