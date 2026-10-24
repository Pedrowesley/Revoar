const TOKEN_KEY = "revoar_admin_token";
export const AUTH_CHANGE_EVENT = "revoar-auth-change";

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function saveToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    notifyAuthChange();
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    notifyAuthChange();
  }
}

/** Drop the stored session and leave the app shell for the login screen. */
export function expireSession() {
  clearToken();
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.replace("/login");
}

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}
