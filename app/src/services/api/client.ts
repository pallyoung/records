type GetToken = () => string | null;
type RefreshFn = () => Promise<boolean>;

export function createApiClient(
  baseUrl: string,
  getToken: GetToken,
  refresh: RefreshFn,
) {
  const base = baseUrl.replace(/\/$/, "");

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && (await refresh())) {
      const retryToken = getToken();
      if (retryToken) {
        headers.Authorization = `Bearer ${retryToken}`;
        res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      }
    }

    if (!res.ok) {
      const text = await res.text();
      const err: Error & { status?: number } = new Error(text || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const contentType = res.headers.get("Content-Type");
    if (contentType?.includes("application/json")) {
      return res.json() as Promise<T>;
    }
    return undefined as unknown as T;
  }

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  };
}

export function getApiBaseUrl(): string {
  return typeof import.meta.env?.VITE_API_URL === "string"
    ? (import.meta.env.VITE_API_URL as string)
    : "";
}
