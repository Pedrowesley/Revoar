const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export function getApiUrl(): string {
  if (typeof window === "undefined") return CONFIGURED_API_URL;
  try {
    const url = new URL(CONFIGURED_API_URL);
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") url.hostname = host;
    return url.origin;
  } catch {
    return CONFIGURED_API_URL;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof data.message === "string" ? data.message : "Erro na requisição";
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}
