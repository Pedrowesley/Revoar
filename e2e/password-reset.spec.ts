import { expect, test } from "@playwright/test";
import { adminLogin, apiPost } from "./helpers/api";

const API = "http://localhost:3002";
const EXTRANET = "http://localhost:3000";

function cnpjDigits() {
  const base = `${String(Date.now()).slice(-8)}0001`.slice(0, 12);
  const calc = (value: string, weights: number[]) => {
    const sum = value.split("").reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const d1 = calc(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(base + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${d1}${d2}`;
}

test("parceiro redefine a senha por um link de uso único", async ({ page }) => {
  const admin = await adminLogin();
  const unique = `${Date.now()}`;
  const email = `reset-${unique}@test.revoar.com.br`;
  const signup = await apiPost("/extranet/auth/signup", {
    legalName: `Reset ${unique} Ltda`,
    cnpj: cnpjDigits(),
    email,
    phone: "11999990000",
    contactName: "Reset E2E",
    password: "revoar123",
    name: "Reset E2E",
  });
  expect(signup.ok).toBe(true);

  const unknown = await apiPost<{ sent: boolean }>("/extranet/auth/forgot-password", {
    email: `ausente-${unique}@test.revoar.com.br`,
  });
  expect(unknown.ok).toBe(true);
  if (unknown.ok) expect(unknown.data.sent).toBe(true);

  const forgot = await apiPost<{ sent: boolean }>("/extranet/auth/forgot-password", { email });
  expect(forgot.ok).toBe(true);

  const outbox = await fetch(`${API}/admin/notifications/outbox`, {
    headers: { Authorization: `Bearer ${admin}` },
  });
  const messages = (await outbox.json()) as { to: string; subject: string; html: string }[];
  const message = messages.find((item) => item.to === email && item.subject === "Redefinir senha — Revoar");
  expect(message).toBeTruthy();
  const token = message?.html.match(/token=([a-f0-9]{64})/)?.[1];
  expect(token).toBeTruthy();

  const reset = await apiPost("/extranet/auth/reset-password", { token, password: "novasenha123" });
  expect(reset.ok).toBe(true);

  const again = await apiPost("/extranet/auth/reset-password", { token, password: "outrasenha123" });
  expect(again.ok).toBe(false);
  if (!again.ok) {
    expect(again.status).toBe(400);
    expect(again.message).toBe("Link inválido ou expirado.");
  }

  const oldPassword = await apiPost("/extranet/auth/login", { email, password: "revoar123" });
  expect(oldPassword.ok).toBe(false);
  const nextPassword = await apiPost("/extranet/auth/login", { email, password: "novasenha123" });
  expect(nextPassword.ok).toBe(true);

  await page.goto(`${EXTRANET}/login`);
  await page.getByRole("link", { name: "Esqueci a senha" }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Se o e-mail existir, enviamos o link.")).toBeVisible();
});
