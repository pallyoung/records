const SESSION_KEY = "app_session";

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

function load(): SessionTokens | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionTokens;
    if (!data.access_token || !data.refresh_token) return null;
    return data;
  } catch {
    return null;
  }
}

function save(tokens: SessionTokens | null): void {
  if (tokens === null) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(tokens));
}

export const session = {
  getAccessToken(): string | null {
    return load()?.access_token ?? null;
  },

  getRefreshToken(): string | null {
    return load()?.refresh_token ?? null;
  },

  setTokens(tokens: SessionTokens): void {
    save(tokens);
  },

  clear(): void {
    save(null);
  },

  hasTokens(): boolean {
    return load() !== null;
  },
};
