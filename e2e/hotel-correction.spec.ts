import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { adminLogin, apiPatch, apiPost, registerTestImage } from "./helpers/api";

const API = "http://localhost:3002";
const EXTRANET = "http://localhost:3000";
const ADMIN = "http://localhost:3001";

type HotelDetail = {
  id: string;
  status: string;
  rejectionReason: string | null;
  statusHistory: { fromStatus: string | null; toStatus: string; actorType: string }[];
};

async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

async function approvedPartner() {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(login.message);
  const adminToken = await adminLogin();
  return { token: login.data.accessToken, adminToken, uniqueId };
}

async function createReadyHotel(token: string, name: string) {
  const hotel = await apiPost<{ id: string }>(
    "/extranet/hotels",
    {
      name,
      description: "Hotel de teste E2E com descrição completa para validação.",
      addressLine: "Rua Teste, 100",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      phone: "(11) 3333-4444",
      checkInTime: "14:00",
      checkOutTime: "12:00",
    },
    token,
  );
  if (!hotel.ok) throw new Error(hotel.message);

  const room = await apiPost<{ id: string }>(
    `/extranet/hotels/${hotel.data.id}/rooms`,
    {
      name: "Standard",
      description: "Quarto padrão para teste automatizado.",
      maxAdults: 2,
      maxChildren: 0,
      maxOccupancy: 2,
      bedConfiguration: "1 cama queen",
      amenities: ["WIFI", "AC"],
    },
    token,
  );
  if (!room.ok) throw new Error(room.message);

  const image = await registerTestImage(hotel.data.id, token);
  if (!image.ok) throw new Error(image.message);

  const roomImage = await apiPost(
    `/extranet/hotels/${hotel.data.id}/rooms/${room.data.id}/images`,
    {
      url: `http://localhost:4566/revoar-hotel-images/hotels/${hotel.data.id}/rooms/${room.data.id}/e2e.jpg`,
    },
    token,
  );
  if (!roomImage.ok) throw new Error(roomImage.message);

  return { hotelId: hotel.data.id, roomId: room.data.id };
}

async function publishHotel(token: string, adminToken: string, name: string) {
  const created = await createReadyHotel(token, name);
  const submit = await apiPost(`/extranet/hotels/${created.hotelId}/submit`, {}, token);
  if (!submit.ok) throw new Error(submit.message);
  const approved = await apiPatch(`/admin/hotels/${created.hotelId}/approve`, undefined, adminToken);
  if (!approved.ok) throw new Error(approved.message);
  return created;
}

test.describe("Ajuste de hotel ativo", () => {
  test("AJUS-01: correção leva o hotel ativo a rascunho e registra o histórico", async () => {
    const { token, adminToken, uniqueId } = await approvedPartner();
    const { hotelId } = await publishHotel(token, adminToken, `Hotel Ajuste ${uniqueId}`);

    const correction = await apiPost<HotelDetail>(`/extranet/hotels/${hotelId}/correction`, {}, token);
    expect(correction.ok).toBe(true);
    if (!correction.ok) return;

    expect(correction.data.status).toBe("DRAFT");
    expect(correction.data.statusHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromStatus: "ACTIVE",
          toStatus: "DRAFT",
          actorType: "PARTNER",
        }),
      ]),
    );

    const stayed = await apiGet<HotelDetail>(`/extranet/hotels/${hotelId}`, token);
    expect(stayed.status).toBe("DRAFT");
  });

  test("AJUS-03: rascunho e em análise recusam a correção sem mudar o status", async () => {
    const { token, uniqueId } = await approvedPartner();
    const { hotelId } = await createReadyHotel(token, `Hotel Travado ${uniqueId}`);

    const draft = await apiPost(`/extranet/hotels/${hotelId}/correction`, {}, token);
    expect(draft.ok).toBe(false);
    if (!draft.ok) {
      expect(draft.status).toBe(422);
      expect(draft.message).toBe("Só um hotel ativo pode entrar em correção.");
    }
    expect((await apiGet<HotelDetail>(`/extranet/hotels/${hotelId}`, token)).status).toBe("DRAFT");

    const submit = await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token);
    expect(submit.ok).toBe(true);

    const inReview = await apiPost(`/extranet/hotels/${hotelId}/correction`, {}, token);
    expect(inReview.ok).toBe(false);
    if (!inReview.ok) {
      expect(inReview.status).toBe(422);
      expect(inReview.message).toBe("Só um hotel ativo pode entrar em correção.");
    }
    expect((await apiGet<HotelDetail>(`/extranet/hotels/${hotelId}`, token)).status).toBe("IN_REVIEW");
  });

  test("admin não aprova um hotel que saiu de análise para correção", async () => {
    const { token, adminToken, uniqueId } = await approvedPartner();
    const { hotelId } = await publishHotel(token, adminToken, `Hotel Fora ${uniqueId}`);
    const correction = await apiPost(`/extranet/hotels/${hotelId}/correction`, {}, token);
    expect(correction.ok).toBe(true);

    const approve = await apiPatch(`/admin/hotels/${hotelId}/approve`, undefined, adminToken);
    expect(approve.ok).toBe(false);
    if (!approve.ok) {
      expect(approve.status).toBe(422);
      expect(approve.message).toBe("Hotel não está em revisão.");
    }
    expect((await apiGet<HotelDetail>(`/extranet/hotels/${hotelId}`, token)).status).toBe("DRAFT");
  });

  test("AJUS-01 e AJUS-02: Corrigir ficha reabre o quarto e mostra o histórico", async ({ page }) => {
    const { token, adminToken, uniqueId } = await approvedPartner();
    const { hotelId } = await publishHotel(token, adminToken, `Hotel Tela ${uniqueId}`);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}`);
    await expect(page.getByRole("button", { name: "Corrigir ficha" })).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("A ficha sai do ar até a equipe Revoar aprovar de novo.");
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "Corrigir ficha" }).click();
    await expect(page.getByText("Ativo", { exact: true })).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("A ficha sai do ar até a equipe Revoar aprovar de novo.");
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Corrigir ficha" }).click();

    await expect(page.getByText("Rascunho", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nome do hotel")).toBeEnabled();
    await expect(page.getByText("Ativo → Rascunho (PARTNER)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Corrigir ficha" })).toHaveCount(0);

    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms`);
    await page.getByRole("link", { name: "Standard" }).click();
    await expect(page.getByLabel("Nome do quarto")).toBeEnabled();
    await expect(page.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Adicionar foto" })).toBeEnabled();

    await page.goto(`${EXTRANET}/hotels/${hotelId}/photos`);
    await expect(page.getByRole("button", { name: "Adicionar foto" })).toBeEnabled();
  });

  test("o botão fica oculto em rascunho, análise, rejeitado e inativo", async ({ page }) => {
    const { token, adminToken, uniqueId } = await approvedPartner();
    const { hotelId } = await createReadyHotel(token, `Hotel Sem Botão ${uniqueId}`);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}`);
    await expect(page.getByRole("button", { name: "Corrigir ficha" })).toHaveCount(0);

    const submit = await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token);
    expect(submit.ok).toBe(true);
    await page.reload();
    await expect(page.getByRole("button", { name: "Corrigir ficha" })).toHaveCount(0);

    const rejected = await apiPatch(
      `/admin/hotels/${hotelId}/reject`,
      { reason: "Endereço incompleto na ficha." },
      adminToken,
    );
    expect(rejected.ok).toBe(true);
    await page.reload();
    await expect(page.getByRole("button", { name: "Corrigir ficha" })).toHaveCount(0);

    const published = await publishHotel(token, adminToken, `Hotel Inativo ${uniqueId}`);
    await page.goto(`${EXTRANET}/hotels/${published.hotelId}`);
    await expect(page.getByRole("button", { name: "Corrigir ficha" })).toBeVisible();
    execFileSync("docker", [
      "exec",
      "revoar-postgres",
      "psql",
      "-U",
      "revoar",
      "-d",
      "revoar",
      "-c",
      `UPDATE hotels SET status = 'INACTIVE' WHERE id = '${published.hotelId}';`,
    ]);
    await page.reload();
    await expect(page.getByRole("button", { name: "Corrigir ficha" })).toHaveCount(0);
  });

  test("AJUS-04: quarto sem foto bloqueia o reenvio e mantém o rascunho", async () => {
    const { token, adminToken, uniqueId } = await approvedPartner();
    const { hotelId } = await publishHotel(token, adminToken, `Hotel Foto ${uniqueId}`);
    const correction = await apiPost(`/extranet/hotels/${hotelId}/correction`, {}, token);
    expect(correction.ok).toBe(true);

    const room = await apiPost(`/extranet/hotels/${hotelId}/rooms`, {
      name: "Sem foto",
      description: "Quarto criado na correção sem imagem.",
      maxAdults: 2,
      maxChildren: 0,
      maxOccupancy: 2,
      bedConfiguration: "1 cama de solteiro",
      amenities: ["WIFI"],
    }, token);
    expect(room.ok).toBe(true);

    const submit = await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token);
    expect(submit.ok).toBe(false);
    if (!submit.ok) {
      expect(submit.status).toBe(422);
      expect(submit.message).toBe("Cadastre ao menos 1 foto em: Sem foto");
    }
    expect((await apiGet<HotelDetail>(`/extranet/hotels/${hotelId}`, token)).status).toBe("DRAFT");
  });

  test("AJUS-05: a fila aprova de novo e a rejeição mostra o motivo", async ({ page }) => {
    const { token, adminToken, uniqueId } = await approvedPartner();
    const name = `Hotel Fila ${uniqueId}`;
    const { hotelId } = await publishHotel(token, adminToken, name);
    expect((await apiPost(`/extranet/hotels/${hotelId}/correction`, {}, token)).ok).toBe(true);
    expect((await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token)).ok).toBe(true);

    await page.addInitScript(
      ({ admin, partner }) => {
        localStorage.setItem("revoar_admin_token", admin);
        localStorage.setItem("revoar_partner_token", partner);
      },
      { admin: adminToken, partner: token },
    );

    await page.goto(`${ADMIN}/hotels/pending`);
    await expect(page.getByText(name)).toBeVisible();
    await page.getByText(name).click();
    await expect(page.getByText("Ativo → Rascunho (PARTNER)")).toBeVisible();
    await page.getByRole("button", { name: "Aprovar" }).click();
    await expect(page).toHaveURL(/\/hotels\/pending/);
    expect((await apiGet<HotelDetail>(`/extranet/hotels/${hotelId}`, token)).status).toBe("ACTIVE");

    expect((await apiPost(`/extranet/hotels/${hotelId}/correction`, {}, token)).ok).toBe(true);
    expect((await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token)).ok).toBe(true);

    await page.goto(`${ADMIN}/hotels/${hotelId}`);
    await page.getByRole("button", { name: "Rejeitar" }).click();
    await page.getByLabel("Descreva o que o parceiro precisa corrigir").fill("O CEP da ficha está errado.");
    await page.getByRole("button", { name: "Confirmar rejeição" }).click();
    await expect(page).toHaveURL(/\/hotels\/pending/);

    const partnerPage = await page.context().newPage();
    await partnerPage.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await partnerPage.goto(`${EXTRANET}/hotels/${hotelId}`);
    await expect(partnerPage.getByText("Rejeitado", { exact: true })).toBeVisible();
    await expect(partnerPage.getByText("O CEP da ficha está errado.")).toBeVisible();
    await partnerPage.close();
  });
});
