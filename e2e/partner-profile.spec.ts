import { expect, test } from "@playwright/test";
import { adminLogin, apiPatch, apiPost } from "./helpers/api";

const API = "http://localhost:3002";
const EXTRANET = "http://localhost:3000";
const ADMIN = "http://localhost:3001";

type Me = {
  name: string;
  email: string;
  avatarUrl: string | null;
  partner: {
    id: string;
    legalName: string;
    tradeName: string | null;
    cnpj: string;
    phone: string;
    contactName: string;
    logoUrl: string | null;
    detailsConfirmedAt: string | null;
    status: string;
  };
};

type Sheet = {
  name: string;
  email: string;
  avatarUrl: string | null;
  legalName: string;
  cnpj: string;
  tradeName: string | null;
  logoUrl: string | null;
  phone: string;
  contactName: string;
  detailsConfirmedAt: string | null;
};

function formatCnpj(value: string) {
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatPhone(value: string) {
  return value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}

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

async function partnerToken() {
  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(login.message);
  return login.data.accessToken;
}

async function apiGet<T>(path: string, token: string) {
  const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await response.json()) as T;
  return { status: response.status, body };
}

test.describe.configure({ mode: "serial" });

test.describe("Perfil do parceiro", () => {
  test("PROF-01 a PROF-05: ficha, edição, campos fiscais, fotos e confirmação", async () => {
    const unique = `${Date.now()}`;
    const signup = await apiPost<{ accessToken: string }>("/extranet/auth/signup", {
      legalName: `Perfil ${unique} Ltda`,
      tradeName: `Perfil ${unique}`,
      cnpj: cnpjDigits(),
      email: `perfil-${unique}@test.revoar.com.br`,
      phone: "11999998888",
      contactName: "Perfil E2E",
      password: "revoar123",
      name: "Perfil E2E",
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    const token = signup.data.accessToken;
    const me = await apiGet<Me>("/extranet/auth/me", token);
    expect(me.status).toBe(200);
    expect(me.body.avatarUrl).toBeNull();
    expect(me.body.partner.logoUrl).toBeNull();
    expect(me.body.partner.detailsConfirmedAt).toBeNull();

    const early = await fetch(`${API}/extranet/profile/confirm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    expect(early.status).toBe(422);
    const earlyBody = (await early.json()) as { missing?: string[]; message?: { missing?: string[] } };
    const missing = earlyBody.missing ?? earlyBody.message?.missing ?? [];
    expect(missing).toEqual(expect.arrayContaining(["avatarUrl", "logoUrl"]));

    const blocked = await apiPatch("/extranet/profile", { phone: "11988887777", cnpj: "11222333000181" }, token);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.status).toBe(400);
    expect((await apiGet<Me>("/extranet/auth/me", token)).body.partner.phone).toBe(me.body.partner.phone);

    const foreign = `http://localhost:4566/revoar-hotel-images/partners/00000000-0000-4000-8000-000000000000/avatar/foto.jpg`;
    const badPhoto = await apiPatch(
      "/extranet/profile",
      { phone: "11988887777", avatarUrl: foreign },
      token,
    );
    expect(badPhoto.ok).toBe(false);
    if (!badPhoto.ok) expect(badPhoto.status).toBe(400);
    expect((await apiGet<Me>("/extranet/auth/me", token)).body.partner.phone).toBe(me.body.partner.phone);

    const partnerId = me.body.partner.id;
    const avatarUrl = `http://localhost:4566/revoar-hotel-images/partners/${partnerId}/avatar/foto.jpg`;
    const logoUrl = `http://localhost:4566/revoar-hotel-images/partners/${partnerId}/logo/marca.jpg`;
    const nextName = `Nome ${unique}`;
    const nextTrade = `Fantasia ${unique}`;
    const nextPhone = "11988887777";
    const nextContact = `Resp ${unique}`;
    const saved = await apiPatch<Sheet>(
      "/extranet/profile",
      {
        name: nextName,
        tradeName: nextTrade,
        phone: nextPhone,
        contactName: nextContact,
        avatarUrl,
        logoUrl,
      },
      token,
    );
    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.data.name).toBe(nextName);
      expect(saved.data.tradeName).toBe(nextTrade);
      expect(saved.data.phone).toBe(nextPhone);
      expect(saved.data.contactName).toBe(nextContact);
      expect(saved.data.detailsConfirmedAt).toBeNull();
      expect(saved.data.legalName).toBe(me.body.partner.legalName);
      expect(saved.data.email).toBe(me.body.email);
      expect(saved.data.cnpj).toBe(me.body.partner.cnpj);
    }
    const reread = await apiGet<Me>("/extranet/auth/me", token);
    expect(reread.body.name).toBe(nextName);
    expect(reread.body.partner.tradeName).toBe(nextTrade);
    expect(reread.body.partner.phone).toBe(nextPhone);
    expect(reread.body.partner.contactName).toBe(nextContact);
    expect(reread.body.avatarUrl).toBe(avatarUrl);
    expect(reread.body.partner.logoUrl).toBe(logoUrl);
    expect(reread.body.partner.detailsConfirmedAt).toBeNull();
    expect(reread.body.partner.legalName).toBe(me.body.partner.legalName);

    const gif = await apiPost("/extranet/profile/avatar/presign", {
      contentType: "image/gif",
      fileSize: 1200,
      fileName: "foto.gif",
    }, token);
    expect(gif.ok).toBe(false);
    if (!gif.ok) {
      expect(gif.status).toBe(400);
      expect(gif.message).toBe("Formato inválido. Use JPG, PNG ou WebP.");
    }
    const huge = await apiPost("/extranet/profile/avatar/presign", {
      contentType: "image/png",
      fileSize: 5 * 1024 * 1024 + 1,
      fileName: "grande.png",
    }, token);
    expect(huge.ok).toBe(false);
    if (!huge.ok) {
      expect(huge.status).toBe(400);
      expect(huge.message).toBe("Arquivo deve ter no máximo 5MB");
    }
    const kept = await apiGet<Me>("/extranet/auth/me", token);
    expect(kept.body.avatarUrl).toBe(avatarUrl);
    expect(kept.body.partner.logoUrl).toBe(logoUrl);

    const presign = await apiPost<{ key: string }>("/extranet/profile/avatar/presign", {
      contentType: "image/png",
      fileSize: 1200,
      fileName: "foto.png",
    }, token);
    expect(presign.ok).toBe(true);
    if (presign.ok) {
      expect(presign.data.key.startsWith(`partners/${partnerId}/avatar/`)).toBe(true);
      expect(presign.data.key.includes("hotels/")).toBe(false);
      expect(presign.data.key.endsWith(".png")).toBe(true);
    }

    const other = await apiPost("/extranet/profile/logo/presign", {
      contentType: "image/jpeg",
      fileSize: 1200,
      partnerId: "00000000-0000-4000-8000-000000000099",
    }, token);
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.status).toBe(403);

    const admin = await adminLogin();
    const adminPatch = await apiPatch("/extranet/profile", { phone: "11977776666" }, admin);
    expect(adminPatch.ok).toBe(false);
    if (!adminPatch.ok) expect(adminPatch.status).toBe(401);

    const confirmed = await apiPost<Me>("/extranet/profile/confirm", {}, token);
    expect(confirmed.ok).toBe(true);
    if (confirmed.ok) expect(confirmed.data.detailsConfirmedAt).toEqual(expect.any(String));
  });

  test("PROF-06 a PROF-10: menu, ficha do admin, fila, link e evento", async ({ page }) => {
    const token = await partnerToken();
    const admin = await adminLogin();
    const me = await apiGet<Me>("/extranet/auth/me", token);
    const partnerId = me.body.partner.id;

    const loggedOut = await page.context().newPage();
    await loggedOut.goto(`${EXTRANET}/`);
    await expect(loggedOut.getByRole("link", { name: "Meu perfil" })).toHaveCount(0);
    await loggedOut.close();

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/dashboard`);
    await expect(page.evaluate(() => localStorage.getItem("revoar_partner_token"))).resolves.toBe(token);
    await expect(page.getByRole("link", { name: "Dados da empresa" })).toHaveAttribute("href", "/profile");
    await page.getByRole("button", { name: "Conta" }).click();
    await page.getByRole("link", { name: "Meu perfil" }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("link", { name: "Pessoal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Empresa" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contato" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Revisar" })).toBeVisible();
    await expect(page.getByText(me.body.email).first()).toBeVisible();
    await expect(page.getByText(me.body.partner.legalName).first()).toBeVisible();
    await expect(page.locator("input[name=cnpj]")).toHaveCount(0);
    await expect(page.locator("input[name=email]")).toHaveCount(0);
    await expect(page.locator("input[name=legalName]")).toHaveCount(0);

    await page.getByRole("link", { name: "Revisar" }).click();
    await expect(page.getByRole("button", { name: "Confirmar" })).toBeDisabled();

    const avatarUrl = `http://localhost:4566/revoar-hotel-images/partners/${partnerId}/avatar/tela.jpg`;
    const logoUrl = `http://localhost:4566/revoar-hotel-images/partners/${partnerId}/logo/tela.jpg`;
    expect((await apiPatch("/extranet/profile", { avatarUrl, logoUrl }, token)).ok).toBe(true);
    await page.reload();
    await page.getByRole("link", { name: "Revisar" }).click();
    await page.getByRole("checkbox", { name: "Confirmo os dados da ficha" }).check();
    await expect(page.getByRole("button", { name: "Confirmar" })).toBeEnabled();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/Confirmou em/).first()).toBeVisible();
    await page.getByRole("button", { name: "Conta" }).click();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

    const dossier = await apiGet<{
      legalName: string;
      detailsConfirmedAt: string | null;
      status: string;
    }>(`/admin/partners/${partnerId}`, admin);
    expect(dossier.status).toBe(200);
    expect(dossier.body.legalName).toBe(me.body.partner.legalName);
    expect(dossier.body.detailsConfirmedAt).toEqual(expect.any(String));

    const partnerOnAdmin = await fetch(`${API}/admin/partners/${partnerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(partnerOnAdmin.status).toBe(401);

    const missing = await fetch(`${API}/admin/partners/00000000-0000-4000-8000-000000000099`, {
      headers: { Authorization: `Bearer ${admin}` },
    });
    expect(missing.status).toBe(404);

    const unique = `${Date.now()}`;
    const signup = await apiPost<{ accessToken: string; partner: { id: string } }>("/extranet/auth/signup", {
      legalName: `Pendente ${unique} Ltda`,
      tradeName: `Pendente ${unique}`,
      cnpj: cnpjDigits(),
      email: `pendente-${unique}@test.revoar.com.br`,
      phone: "11999990000",
      contactName: "Fila E2E",
      password: "revoar123",
      name: "Fila E2E",
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    const pendingId = signup.data.partner.id;
    const pendingToken = signup.data.accessToken;
    const pendingAvatar = `http://localhost:4566/revoar-hotel-images/partners/${pendingId}/avatar/fila.jpg`;
    const pendingLogo = `http://localhost:4566/revoar-hotel-images/partners/${pendingId}/logo/fila.jpg`;
    expect((await apiPatch("/extranet/profile", { avatarUrl: pendingAvatar, logoUrl: pendingLogo }, pendingToken)).ok).toBe(
      true,
    );

    const partnerPage = await page.context().newPage();
    await partnerPage.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, pendingToken);
    await partnerPage.goto(`${EXTRANET}/profile`);
    await expect(partnerPage.getByText("Fila E2E", { exact: true })).toBeVisible();
    await expect(partnerPage.getByText(`pendente-${unique}@test.revoar.com.br`).first()).toBeVisible();
    await expect(partnerPage.getByRole("img", { name: "Avatar" })).toHaveAttribute("src", pendingAvatar);
    await expect(partnerPage.getByText(`Pendente ${unique} Ltda`).first()).toBeVisible();
    const pendingMe = await apiGet<Me>("/extranet/auth/me", pendingToken);
    await expect(partnerPage.getByText(`CNPJ ${formatCnpj(pendingMe.body.partner.cnpj)}`)).toBeVisible();
    await expect(partnerPage.getByText(`Pendente ${unique}`, { exact: true })).toBeVisible();
    await expect(partnerPage.getByRole("img", { name: "Logo" })).toHaveAttribute("src", pendingLogo);
    await expect(partnerPage.getByText(`Telefone: ${formatPhone("11999990000")}`).first()).toBeVisible();
    await expect(partnerPage.getByText("Responsável: Fila E2E").first()).toBeVisible();
    await expect(partnerPage.getByText("Ainda não confirmou").first()).toBeVisible();
    await partnerPage.close();

    const adminPage = await page.context().newPage();
    await adminPage.addInitScript((value) => {
      localStorage.setItem("revoar_admin_token", value);
    }, admin);
    await adminPage.goto(`${ADMIN}/partners/pending`);
    const row = adminPage.getByRole("listitem").filter({ hasText: `Pendente ${unique} Ltda` });
    await expect(row.getByText("Não confirmou")).toBeVisible();
    await expect(row.getByRole("link", { name: `Pendente ${unique} Ltda` })).toHaveAttribute(
      "href",
      `/partners/${pendingId}`,
    );
    await expect(row.getByRole("button", { name: "Aprovar" })).toBeVisible();
    await row.getByRole("link", { name: `Pendente ${unique} Ltda` }).click();
    await expect(adminPage.getByText("Ainda não confirmou")).toBeVisible();
    await expect(adminPage.getByRole("img", { name: "Avatar" })).toHaveAttribute("src", pendingAvatar);
    await expect(adminPage.getByRole("img", { name: "Logo" })).toHaveAttribute("src", pendingLogo);
    await expect(adminPage.getByText("Fila E2E", { exact: true })).toBeVisible();
    await expect(adminPage.getByText(`pendente-${unique}@test.revoar.com.br`)).toBeVisible();
    await expect(adminPage.getByText(`Pendente ${unique} Ltda`)).toBeVisible();
    await expect(adminPage.getByText(`CNPJ: ${formatCnpj(pendingMe.body.partner.cnpj)}`)).toBeVisible();
    await expect(adminPage.getByText(`Nome fantasia: Pendente ${unique}`)).toBeVisible();
    await expect(adminPage.getByText(`Telefone: ${formatPhone("11999990000")}`)).toBeVisible();
    await expect(adminPage.getByText("Responsável: Fila E2E")).toBeVisible();
    await expect(adminPage.getByText("Status: PENDING")).toBeVisible();
    expect(
      (await apiPatch("/extranet/profile", { contactName: "Resp Ao Vivo" }, pendingToken)).ok,
    ).toBe(true);
    await expect(adminPage.getByText("Responsável: Resp Ao Vivo")).toBeVisible();
    await expect(adminPage.locator("input")).toHaveCount(0);
    await expect(adminPage.getByRole("button", { name: "Confirmar" })).toHaveCount(0);
    await adminPage.getByRole("button", { name: "Aprovar" }).click();
    await expect(adminPage.getByText("ACTIVE")).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "Aprovar" })).toHaveCount(0);

    const hotels = await apiGet<{ id: string }[]>("/extranet/hotels", token);
    const hotelId = hotels.body[0]?.id;
    expect(hotelId).toBeTruthy();
    await adminPage.goto(`${ADMIN}/hotels/${hotelId}`);
    await expect(adminPage.getByRole("link", { name: me.body.partner.legalName })).toHaveAttribute(
      "href",
      `/partners/${partnerId}`,
    );

    const controller = new AbortController();
    const stream = await fetch(`${API}/admin/notifications/stream`, {
      headers: { Authorization: `Bearer ${admin}`, Accept: "text/event-stream" },
      signal: controller.signal,
    });
    expect(stream.ok).toBe(true);
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder();
    const received = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("evento ausente")), 8000);
      void (async () => {
        let text = "";
        while (!text.includes("partner.profile.updated")) {
          const chunk = await reader.read();
          if (chunk.done) break;
          text += decoder.decode(chunk.value);
        }
        clearTimeout(timer);
        resolve(text);
      })();
    });
    expect((await apiPatch("/extranet/profile", { contactName: "Maria Silva" }, token)).ok).toBe(true);
    const payload = await received;
    expect(payload).toContain(`"partnerId":"${partnerId}"`);
    controller.abort();
  });
});
