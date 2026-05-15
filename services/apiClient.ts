import Config from '@/constants/Config';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Config.apiTimeoutMs);

  try {
    const res = await fetch(`${Config.apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new ApiError(res.status, json.error ?? 'Request failed', json);
    }

    return json.data as T;
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new ApiError(408, 'Request timed out');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
