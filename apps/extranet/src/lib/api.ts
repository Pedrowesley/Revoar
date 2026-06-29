const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

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

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
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
