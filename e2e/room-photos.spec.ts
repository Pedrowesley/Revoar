import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { apiPost, registerTestImage } from "./helpers/api";

const EXTRANET = "http://localhost:3000";
const ADMIN = "http://localhost:3001";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function roomBody(name: string) {
  return {
    name,
    description: "Quarto com descrição completa para o teste.",
    maxAdults: 2,
    maxChildren: 0,
    maxOccupancy: 2,
    bedConfiguration: "1 cama queen",
    amenities: ["WIFI"],
  };
}

async function partnerToken() {
  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(login.message);
  return login.data.accessToken;
}

async function createHotel(token: string, name: string) {
  const hotel = await apiPost<{ id: string }>(
    "/extranet/hotels",
    {
      name,
      description: "Hotel de teste E2E com descrição completa para validação.",
      addressLine: "Rua Teste, 100",
      city: "Fortaleza",
      state: "CE",
      zipCode: "60160-230",
      phone: "(85) 3333-4444",
      checkInTime: "14:00",
      checkOutTime: "12:00",
    },
    token,
  );
  if (!hotel.ok) throw new Error(hotel.message);
  return hotel.data.id;
}

async function createRoom(token: string, hotelId: string, name: string) {
  const room = await apiPost<{ id: string }>(`/extranet/hotels/${hotelId}/rooms`, roomBody(name), token);
  if (!room.ok) throw new Error(room.message);
  return room.data.id;
}

async function uploadRoomPng(hotelId: string, roomId: string, token: string) {
  const presign = await apiPost<{ uploadUrl: string; publicUrl: string }>(
    `/extranet/hotels/${hotelId}/rooms/${roomId}/images/presign`,
    { contentType: "image/png", fileSize: PNG.length, fileName: "capa.png" },
    token,
  );
  if (!presign.ok) throw new Error(presign.message);
  const put = await fetch(presign.data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: PNG,
  });
  if (!put.ok) throw new Error(`Upload da foto falhou (${put.status})`);
  return apiPost(`/extranet/hotels/${hotelId}/rooms/${roomId}/images`, {
    url: presign.data.publicUrl,
    altText: "Capa da suíte",
  }, token);
}

function registerRoomImage(hotelId: string, roomId: string, token: string, index: number) {
  const url = `http://localhost:4566/revoar-hotel-images/hotels/${hotelId}/rooms/${roomId}/e2e-${index}.jpg`;
  return apiPost(`/extranet/hotels/${hotelId}/rooms/${roomId}/images`, { url }, token);
}

test.describe("Fotos do quarto", () => {
  test("FOTO-07: revisão lista o quarto sem foto e não muda o status", async () => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Fotos ${Date.now()}`);
    await createRoom(token, hotelId, "Suíte");
    await createRoom(token, hotelId, "Standard");
    const rooms = await fetch(`http://localhost:3002/extranet/hotels/${hotelId}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => response.json() as Promise<{ id: string; name: string }[]>);
    const suite = rooms.find((room) => room.name === "Suíte");
    if (!suite) throw new Error("Suíte não encontrada");
    const image = await registerRoomImage(hotelId, suite.id, token, 1);
    expect(image.ok).toBe(true);
    const hotelImage = await registerTestImage(hotelId, token);
    expect(hotelImage.ok).toBe(true);

    const blocked = await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.status).toBe(422);
      expect(blocked.message).toBe("Cadastre ao menos 1 foto em: Standard");
    }

    const hotel = await fetch(`http://localhost:3002/extranet/hotels/${hotelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => response.json() as Promise<{ status: string }>);
    expect(hotel.status).toBe("DRAFT");
  });

  test("FOTO-03: a nona foto é recusada pela API", async () => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Limite ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte");

    for (let index = 1; index <= 8; index += 1) {
      const image = await registerRoomImage(hotelId, roomId, token, index);
      expect(image.ok, image.ok ? "" : image.message).toBe(true);
    }

    const ninth = await registerRoomImage(hotelId, roomId, token, 9);
    expect(ninth.ok).toBe(false);
    if (!ninth.ok) {
      expect(ninth.status).toBe(422);
      expect(ninth.message).toBe("Este quarto já tem 8 fotos.");
    }
  });

  test("FOTO-01 e FOTO-10: criar com foto abre a edição com a capa", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Criar ${Date.now()}`);
    const photo = join(tmpdir(), `revoar-room-${Date.now()}.png`);
    writeFileSync(photo, PNG);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms/new`);
    await page.getByLabel("Nome do quarto").fill("Suíte com foto");
    await page.getByLabel("Descrição").fill("Quarto com descrição completa para o teste.");
    await page.getByLabel("Configuração de camas").fill("1 cama queen");
    await page.getByRole("button", { name: "Wi-Fi" }).click();
    await page.locator("input[type=file]").setInputFiles(photo);
    await page.getByRole("button", { name: "Criar quarto" }).click();

    await expect(page.getByText("Quarto criado")).toBeVisible();
    await expect(page).toHaveURL(/\/rooms\/(?!new$)[^/]+$/);
    await expect(page.getByText("Principal", { exact: true })).toBeVisible();
    await expect(page.getByText("Foto principal enviada")).toBeVisible();
  });

  test("FOTO-05 e FOTO-12: edição troca a capa, exclui e a lista mostra a capa", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Editar ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte");
    expect((await uploadRoomPng(hotelId, roomId, token)).ok).toBe(true);
    expect((await uploadRoomPng(hotelId, roomId, token)).ok).toBe(true);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms/${roomId}`);
    await expect(page.getByText("Principal", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Definir principal" }).click();
    await expect(page.getByText("Foto principal definida")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir foto" }).first().click();
    await expect(page.getByText("Foto excluída")).toBeVisible();

    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms`);
    await expect(page.getByAltText("Capa de Suíte")).toBeVisible();
  });

  test("FOTO-08: checklist marca Foto em cada quarto", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Checklist ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte");

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}`);
    const step = page.getByRole("link", { name: "Foto em cada quarto" });
    await expect(step).toBeVisible();
    await expect(step).toHaveClass(/text-muted-foreground/);

    expect((await registerRoomImage(hotelId, roomId, token, 1)).ok).toBe(true);
    await page.reload();
    await expect(page.getByRole("link", { name: "Foto em cada quarto" })).toHaveClass(/text-success/);
  });

  test("FOTO-09: admin mostra a foto do quarto sem controles", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Admin ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte Admin");
    expect((await uploadRoomPng(hotelId, roomId, token)).ok).toBe(true);

    const admin = await apiPost<{ accessToken: string }>("/admin/auth/login", {
      email: "admin@revoar.com.br",
      password: "revoar123",
    });
    if (!admin.ok) throw new Error(admin.message);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_admin_token", value);
    }, admin.data.accessToken);
    await page.goto(`${ADMIN}/hotels/${hotelId}`);

    const room = page.getByRole("listitem").filter({ hasText: "Suíte Admin" });
    await expect(room.getByRole("img", { name: "Capa da suíte" })).toBeVisible();
    await expect(room.getByRole("button")).toHaveCount(0);
  });
});
