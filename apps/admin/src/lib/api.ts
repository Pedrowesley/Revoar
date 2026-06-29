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

export type AdminAuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};
