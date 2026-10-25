import { expect, test } from "@playwright/test";
import { adminLogin, apiPost } from "./helpers/api";

const API = "http://localhost:3002";
const ADMIN = "http://localhost:3001";

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

test("admin lista todos os parceiros e hotéis e modera sem editar", async ({ page }) => {
  const admin = await adminLogin();
  const unique = `${Date.now()}`;
  const signup = await apiPost<{ partner: { id: string } }>("/extranet/auth/signup", {
    legalName: `Lista ${unique} Ltda`,
    cnpj: cnpjDigits(),
    email: `lista-${unique}@test.revoar.com.br`,
    phone: "11999990000",
    contactName: "Lista E2E",
    password: "revoar123",
    name: "Lista E2E",
  });
  expect(signup.ok).toBe(true);

  const all = await fetch(`${API}/admin/partners`, { headers: { Authorization: `Bearer ${admin}` } });
  expect(all.status).toBe(200);
  const partners = (await all.json()) as { legalName: string; status: string }[];
  expect(partners.some((partner) => partner.legalName === "Hospedagens Nordeste Ltda" && partner.status === "ACTIVE")).toBe(
    true,
  );
  expect(partners.some((partner) => partner.legalName === `Lista ${unique} Ltda` && partner.status === "PENDING")).toBe(
    true,
  );

  const active = await fetch(`${API}/admin/partners?status=ACTIVE`, {
    headers: { Authorization: `Bearer ${admin}` },
  });
  const activeRows = (await active.json()) as { status: string }[];
  expect(activeRows.every((partner) => partner.status === "ACTIVE")).toBe(true);

  const invalid = await fetch(`${API}/admin/partners?status=NOPE`, {
    headers: { Authorization: `Bearer ${admin}` },
  });
  expect(invalid.status).toBe(400);

  const pending = await fetch(`${API}/admin/partners/pending`, {
    headers: { Authorization: `Bearer ${admin}` },
  });
  expect(pending.status).toBe(200);

  const partnerDenied = await fetch(`${API}/admin/partners`, {
    headers: { Authorization: `Bearer ${signup.ok ? signup.data.partner.id : "nope"}` },
  });
  expect(partnerDenied.status).toBe(401);

  const hotels = await fetch(`${API}/admin/hotels`, { headers: { Authorization: `Bearer ${admin}` } });
  expect(hotels.status).toBe(200);
  const hotelRows = (await hotels.json()) as { id: string; name: string; status: string }[];
  expect(hotelRows.length).toBeGreaterThan(0);
  const badHotel = await fetch(`${API}/admin/hotels?status=NOPE`, {
    headers: { Authorization: `Bearer ${admin}` },
  });
  expect(badHotel.status).toBe(400);

  await page.addInitScript((value) => {
    localStorage.setItem("revoar_admin_token", value);
  }, admin);
  await page.goto(`${ADMIN}/partners`);
  const activeRow = page.getByRole("listitem").filter({ hasText: "Hospedagens Nordeste Ltda" });
  await expect(activeRow.getByText("Ativo")).toBeVisible();
  await expect(activeRow.getByRole("link", { name: "Hospedagens Nordeste Ltda" })).toHaveAttribute(
    "href",
    /\/partners\//,
  );
  await expect(activeRow.getByRole("button", { name: "Suspender" })).toBeVisible();
  await expect(activeRow.locator("input")).toHaveCount(0);

  const pendingRow = page.getByRole("listitem").filter({ hasText: `Lista ${unique} Ltda` });
  await expect(pendingRow.getByText("Pendente")).toBeVisible();
  await pendingRow.getByRole("button", { name: "Aprovar" }).click();
  await expect(pendingRow.getByText("Ativo")).toBeVisible();

  await page.goto(`${ADMIN}/hotels`);
  const hotel = hotelRows[0];
  await expect(page.getByRole("link", { name: hotel.name })).toHaveAttribute("href", `/hotels/${hotel.id}`);
  await expect(page.getByText("Rascunho").or(page.getByText("Em análise")).or(page.getByText("Ativo")).first()).toBeVisible();
});
