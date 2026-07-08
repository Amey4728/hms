import type { ApiErrorResponse, ApiResponse } from '@hms/shared';
import { env } from './env';

/** Typed error thrown for any non-2xx API response. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: ApiErrorResponse['error']['details'],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type TokenListener = (token: string | null) => void;

/**
 * Central HTTP client.
 *  - Sends the in-memory access token as a Bearer header.
 *  - Sends cookies (credentials: 'include') so the refresh cookie flows.
 *  - On a 401, performs a single-flight POST /auth/refresh and retries once.
 */
class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private readonly tokenListeners = new Set<TokenListener>();

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    this.tokenListeners.forEach((l) => l(token));
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  onTokenChange(listener: TokenListener): () => void {
    this.tokenListeners.add(listener);
    return () => this.tokenListeners.delete(listener);
  }

  async request<T, M = unknown>(
    path: string,
    options: RequestInit & { skipAuthRefresh?: boolean } = {},
  ): Promise<ApiResponse<T, M>> {
    const response = await this.rawFetch(path, options);

    if (response.status === 401 && !options.skipAuthRefresh) {
      const newToken = await this.refreshOnce();
      if (newToken) {
        const retry = await this.rawFetch(path, options);
        return this.parse<T, M>(retry);
      }
    }
    return this.parse<T, M>(response);
  }

  private rawFetch(path: string, options: RequestInit): Promise<Response> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`);

    return fetch(`${env.apiUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  /** Single-flight refresh: concurrent 401s share one refresh request. */
  private refreshOnce(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.rawFetch('/auth/refresh', {
        method: 'POST',
        // do not recurse on refresh itself
      })
        .then(async (res) => {
          if (!res.ok) {
            this.setAccessToken(null);
            return null;
          }
          const body = (await res.json()) as ApiResponse<{ accessToken: string }>;
          this.setAccessToken(body.data.accessToken);
          return body.data.accessToken;
        })
        .catch(() => {
          this.setAccessToken(null);
          return null;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private async parse<T, M>(response: Response): Promise<ApiResponse<T, M>> {
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const err = json as ApiErrorResponse | null;
      throw new ApiError(
        err?.message ?? response.statusText,
        err?.error?.statusCode ?? response.status,
        err?.error?.code ?? 'UNKNOWN',
        err?.error?.details,
      );
    }
    return json as ApiResponse<T, M>;
  }

  // Convenience verbs ------------------------------------------------------
  get<T, M = unknown>(path: string) {
    return this.request<T, M>(path, { method: 'GET' });
  }
  post<T>(path: string, body?: unknown, opts?: { skipAuthRefresh?: boolean }) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    });
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }
  del<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /** Fetches a binary endpoint (with the auth header + one refresh retry) and opens it in a new tab. */
  async openBlob(path: string): Promise<void> {
    let response = await this.rawFetch(path, { method: 'GET' });
    if (response.status === 401) {
      const token = await this.refreshOnce();
      if (token) response = await this.rawFetch(path, { method: 'GET' });
    }
    if (!response.ok) {
      const text = await response.text();
      const json = text ? (JSON.parse(text) as ApiErrorResponse) : null;
      throw new ApiError(json?.message ?? response.statusText, response.status, json?.error?.code ?? 'UNKNOWN');
    }
    const url = URL.createObjectURL(await response.blob());
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

export const apiClient = new ApiClient();
