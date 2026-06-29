const API_URL = process.env.API_URL ?? "http://localhost:3002";

type ApiResult<T> = { ok: true; data: T; status: number } | { ok: false; status: number; message: string };

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join("; ")
          : "Erro na requisição";
    return { ok: false, status: response.status, message };
  }
  return { ok: true, data: data as T, status: response.status };
}

export async function apiPost<T>(path: string, body: unknown, token?: string) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function apiPatch<T>(path: string, body?: unknown, token?: string) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(response);
}

export async function adminLogin() {
  const result = await apiPost<{ accessToken: string }>("/admin/auth/login", {
    email: "admin@revoar.com.br",
    password: "revoar123",
  });
  if (!result.ok) throw new Error(result.message);
  return result.data.accessToken;
}

export async function partnerSignup(uniqueId: string, cnpjDigits: string) {
  return apiPost<{ accessToken: string; partner: { id: string; status: string } }>(
    "/extranet/auth/signup",
    {
      legalName: `Hotel E2E ${uniqueId} Ltda`,
      tradeName: `E2E Hotel ${uniqueId}`,
      cnpj: cnpjDigits,
      email: `e2e-${uniqueId}@test.revoar.com.br`,
      phone: "(11) 99999-0000",
      contactName: "Teste E2E",
      password: "revoar123",
      name: "Operador E2E",
    },
  );
}

export async function registerTestImage(hotelId: string, token: string) {
  const url = `http://localhost:4566/revoar-hotel-images/hotels/${hotelId}/e2e-test.jpg`;
  return apiPost(`/extranet/hotels/${hotelId}/images`, { url, isPrimary: true }, token);
}
