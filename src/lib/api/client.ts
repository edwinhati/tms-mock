/**
 * API client with automatic redirect on 401 Unauthorized
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    const currentPath = window.location.pathname;
    window.location.href = `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`;
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(error.error || `HTTP ${res.status}`, res.status);
  }

  return res;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await apiFetch(url);
  return res.json();
}

export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiPut<T>(url: string, data: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiDelete(url: string): Promise<void> {
  await apiFetch(url, { method: "DELETE" });
}
