import { expireSession } from "./auth";

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

/** Keep loopback hostname aligned with the tab (localhost vs 127.0.0.1). */
export function getApiUrl(): string {
  if (typeof window === "undefined") return CONFIGURED_API_URL;
  try {
    const url = new URL(CONFIGURED_API_URL);
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      url.hostname = host;
    }
    return url.origin;
  } catch {
    return CONFIGURED_API_URL;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      expireSession();
    }
    const message =
      typeof data.message === "string"
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join("; ")
          : "Erro na requisição";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  partner: {
    id: string;
    legalName: string;
    status: "PENDING" | "ACTIVE" | "SUSPENDED";
  };
};

export type PartnerProfile = {
  id: string;
  name: string;
  email: string;
  partner: {
    id: string;
    legalName: string;
    tradeName: string | null;
    cnpj: string;
    status: "PENDING" | "ACTIVE" | "SUSPENDED";
    email: string;
    phone: string;
    contactName: string;
  };
};
