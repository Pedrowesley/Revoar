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

async function uploadRoomPng(hotelId: string, roomId: string, token: string, altText = "Capa da suíte") {
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
  return apiPost<{ id: string; isPrimary: boolean }>(`/extranet/hotels/${hotelId}/rooms/${roomId}/images`, {
    url: presign.data.publicUrl,
    altText,
  }, token);
}

async function listRoomImages(hotelId: string, roomId: string, token: string) {
  const response = await fetch(`http://localhost:3002/extranet/hotels/${hotelId}/rooms/${roomId}/images`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ id: string; isPrimary: boolean; altText: string | null }[]>;
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

    const luxoId = await createRoom(token, hotelId, "Luxo");
    const listed = await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token);
    expect(listed.ok).toBe(false);
    if (!listed.ok) {
      expect(listed.status).toBe(422);
      expect(listed.message).toBe("Cadastre ao menos 1 foto em: Standard, Luxo");
    }

    const standard = rooms.find((room) => room.name === "Standard");
    if (!standard) throw new Error("Standard não encontrado");
    expect((await registerRoomImage(hotelId, standard.id, token, 2)).ok).toBe(true);
    expect((await registerRoomImage(hotelId, luxoId, token, 3)).ok).toBe(true);
    const sent = await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token);
    expect(sent.ok).toBe(true);
    const reviewed = await fetch(`http://localhost:3002/extranet/hotels/${hotelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => response.json() as Promise<{ status: string }>);
    expect(reviewed.status).toBe("IN_REVIEW");
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
    expect(await listRoomImages(hotelId, roomId, token)).toHaveLength(8);
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
    await expect(page.getByText("Ela já é a capa do quarto.")).toBeVisible();
  });

  test("FOTO-05 e FOTO-12: edição troca a capa, exclui e a lista mostra a capa", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Editar ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte");
    const first = await uploadRoomPng(hotelId, roomId, token, "Primeira foto");
    const second = await uploadRoomPng(hotelId, roomId, token, "Segunda foto");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms/${roomId}`);
    await expect(page.getByRole("button", { name: "Adicionar foto" })).toBeVisible();
    await expect(page.getByText("Principal", { exact: true })).toHaveCount(1);
    await expect(page.locator("div.mt-4.grid > div").first()).toContainText("Principal");

    await page.getByRole("button", { name: "Definir principal" }).click();
    await expect(page.getByText("Foto principal definida")).toBeVisible();
    await expect(page.getByText("Principal", { exact: true })).toHaveCount(1);
    const secondCard = page.locator("div.mt-4.grid > div").filter({
      has: page.getByRole("img", { name: "Segunda foto" }),
    });
    await expect(secondCard).toContainText("Principal");

    const cover = page.locator("div.mt-4.grid > div").filter({
      has: page.getByText("Principal", { exact: true }),
    });
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Excluir esta foto?");
      await dialog.dismiss();
    });
    await cover.getByRole("button", { name: "Excluir foto" }).click();
    await expect(page.getByRole("img", { name: "Primeira foto" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Segunda foto" })).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Excluir esta foto?");
      await dialog.accept();
    });
    await cover.getByRole("button", { name: "Excluir foto" }).click();
    await expect(page.getByText("Foto excluída")).toBeVisible();
    await expect(page.getByRole("img", { name: "Segunda foto" })).toHaveCount(0);
    await expect(page.getByText("Principal", { exact: true })).toHaveCount(1);
    const remaining = await listRoomImages(hotelId, roomId, token);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.isPrimary).toBe(true);
    if (first.ok) expect(remaining[0]?.id).toBe(first.data.id);

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

    const older = await uploadRoomPng(hotelId, roomId, token, "Foto antiga");
    expect(older.ok).toBe(true);
    if (older.ok) {
      const promoted = await fetch(
        `http://localhost:3002/extranet/hotels/${hotelId}/rooms/${roomId}/images/${older.data.id}/primary`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
      );
      expect(promoted.ok).toBe(true);
    }
    await page.reload();
    await expect(room.getByRole("img").first()).toHaveAttribute("alt", "Foto antiga");

    await createRoom(token, hotelId, "Quarto vazio");
    const brokenId = await createRoom(token, hotelId, "Foto quebrada");
    expect((await registerRoomImage(hotelId, brokenId, token, 1)).ok).toBe(true);
    await page.reload();

    const empty = page.getByRole("listitem").filter({ hasText: "Quarto vazio" });
    const emptyMark = empty.locator("[aria-hidden]").filter({ has: page.locator("svg.lucide-building2") });
    await expect(empty.getByRole("img")).toHaveCount(0);
    await expect(emptyMark).toBeVisible();
    await expect(emptyMark).toHaveText("");
    await expect(empty.getByRole("button")).toHaveCount(0);

    const broken = page.getByRole("listitem").filter({ hasText: "Foto quebrada" });
    const brokenMark = broken.locator("[aria-hidden]").filter({ has: page.locator("svg.lucide-building2") });
    await expect(broken.getByRole("img")).toHaveCount(0);
    await expect(brokenMark).toBeVisible();
    await expect(brokenMark).toHaveText("");
  });

  test("FOTO-02, FOTO-03 e FOTO-04: a galeria avisa envio, limite, tipo e tamanho", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Avisos ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte");
    expect((await registerRoomImage(hotelId, roomId, token, 1)).ok).toBe(true);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms/${roomId}`);

    const input = page.locator("input[type=file]");
    const photo = join(tmpdir(), `revoar-extra-${Date.now()}.png`);
    writeFileSync(photo, PNG);
    await input.setInputFiles(photo);
    await expect(page.getByText("Foto enviada")).toBeVisible();

    await input.setInputFiles({
      name: "nota.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("nao e imagem"),
    });
    await expect(page.getByText("Foto não enviada")).toBeVisible();
    await expect(page.getByText("Formato inválido. Use JPG, PNG ou WebP.")).toHaveCount(2);

    await page.reload();
    await page.locator("input[type=file]").setInputFiles({
      name: "grande.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 1),
    });
    await expect(page.getByText("Foto não enviada")).toBeVisible();
    await expect(page.getByText("Arquivo deve ter no máximo 5MB.")).toHaveCount(2);

    for (let index = 3; index <= 8; index += 1) {
      expect((await registerRoomImage(hotelId, roomId, token, index)).ok).toBe(true);
    }
    await page.reload();
    await page.getByRole("button", { name: "Adicionar foto" }).click();
    await expect(page.getByText("Este quarto já tem 8 fotos.")).toBeVisible();
    expect(await listRoomImages(hotelId, roomId, token)).toHaveLength(8);
  });

  test("FOTO-06: hotel em análise recusa envio, capa e exclusão", async () => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Fechado ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte");
    const image = await uploadRoomPng(hotelId, roomId, token, "Foto fechada");
    expect(image.ok).toBe(true);
    expect((await registerTestImage(hotelId, token)).ok).toBe(true);
    expect((await apiPost(`/extranet/hotels/${hotelId}/submit`, {}, token)).ok).toBe(true);

    const locked = "Hotel não pode ser editado neste status. Aguarde a conclusão da revisão.";
    const presign = await apiPost(`/extranet/hotels/${hotelId}/rooms/${roomId}/images/presign`, {
      contentType: "image/png",
      fileSize: PNG.length,
      fileName: "extra.png",
    }, token);
    expect(presign.ok).toBe(false);
    if (!presign.ok) {
      expect(presign.status).toBe(422);
      expect(presign.message).toBe(locked);
    }

    const extra = await registerRoomImage(hotelId, roomId, token, 2);
    expect(extra.ok).toBe(false);
    if (!extra.ok) expect(extra.message).toBe(locked);

    if (!image.ok) return;
    const primary = await fetch(
      `http://localhost:3002/extranet/hotels/${hotelId}/rooms/${roomId}/images/${image.data.id}/primary`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
    );
    expect(primary.status).toBe(422);
    const removed = await fetch(
      `http://localhost:3002/extranet/hotels/${hotelId}/rooms/${roomId}/images/${image.data.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
    expect(removed.status).toBe(422);
    const still = await listRoomImages(hotelId, roomId, token);
    expect(still).toHaveLength(1);
  });

  test("FOTO-10 e FOTO-11: limite ao criar, falha parcial e quarto salvo", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Criar Limite ${Date.now()}`);
    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms/new`);

    await page.locator("input[type=file]").setInputFiles(
      Array.from({ length: 9 }, (_, index) => ({
        name: `foto-${index}.png`,
        mimeType: "image/png",
        buffer: PNG,
      })),
    );
    await expect(page.getByText("Escolha no máximo 8 fotos.")).toBeVisible();
    const roomsBefore = await fetch(`http://localhost:3002/extranet/hotels/${hotelId}/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => response.json() as Promise<{ id: string }[]>);
    expect(roomsBefore).toHaveLength(0);

    let uploads = 0;
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() === "PUT" && request.url().includes("/rooms/")) {
        uploads += 1;
        if (uploads > 1) {
          await route.fulfill({ status: 500, body: "fail" });
          return;
        }
      }
      await route.continue();
    });

    await page.getByLabel("Nome do quarto").fill("Suíte parcial");
    await page.getByLabel("Descrição").fill("Quarto com descrição completa para o teste.");
    await page.getByLabel("Configuração de camas").fill("1 cama queen");
    await page.getByRole("button", { name: "Wi-Fi" }).click();
    await page.locator("input[type=file]").setInputFiles([
      { name: "primeira.png", mimeType: "image/png", buffer: PNG },
      { name: "segunda.png", mimeType: "image/png", buffer: PNG },
    ]);
    await page.getByRole("button", { name: "Criar quarto" }).click();

    await expect(page.getByText("Quarto criado")).toBeVisible();
    await expect(page.getByText("Foto não enviada")).toBeVisible();
    await expect(page).toHaveURL(/\/rooms\/(?!new$)[^/]+$/);
    await expect(page.getByRole("img", { name: "primeira" })).toBeVisible();
    await expect(page.getByRole("img", { name: "segunda" })).toHaveCount(0);

    await page.getByLabel("Nome do quarto").fill("Suíte parcial salva");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Quarto salvo")).toBeVisible();
    await expect(page.getByRole("img", { name: "primeira" })).toBeVisible();
  });

  test("FOTO-12: quarto sem foto mostra o ícone e excluir a única foto desfaz o checklist", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Icone ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Sem capa");
    const image = await uploadRoomPng(hotelId, roomId, token, "Única foto");
    expect(image.ok).toBe(true);

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms`);
    const row = page.getByRole("listitem").filter({ hasText: "Sem capa" });
    await expect(row.getByAltText("Capa de Sem capa")).toBeVisible();

    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms/${roomId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir foto" }).click();
    await expect(page.getByText("Foto excluída")).toBeVisible();
    await expect(page.getByText("Principal", { exact: true })).toHaveCount(0);

    await page.goto(`${EXTRANET}/hotels/${hotelId}`);
    await expect(page.getByRole("link", { name: "Foto em cada quarto" })).toHaveClass(/text-muted-foreground/);
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms`);
    const empty = page.getByRole("listitem").filter({ hasText: "Sem capa" });
    await expect(empty.getByRole("img")).toHaveCount(0);
    await expect(empty.locator("svg.lucide-building2")).toBeVisible();
  });

  test("foto de outro hotel responde 404 e falha de storage não grava", async ({ page }) => {
    const token = await partnerToken();
    const hotelId = await createHotel(token, `Hotel Dono ${Date.now()}`);
    const otherId = await createHotel(token, `Hotel Outro ${Date.now()}`);
    const roomId = await createRoom(token, hotelId, "Suíte");
    const missing = await apiPost(`/extranet/hotels/${otherId}/rooms/${roomId}/images`, {
      url: `http://localhost:4566/revoar-hotel-images/hotels/${otherId}/rooms/${roomId}/x.jpg`,
    }, token);
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.status).toBe(404);
      expect(missing.message).toBe("Quarto não encontrado");
    }

    await page.addInitScript((value) => {
      localStorage.setItem("revoar_partner_token", value);
    }, token);
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() === "PUT" && request.url().includes("/rooms/")) {
        await route.fulfill({ status: 500, body: "fail" });
        return;
      }
      await route.continue();
    });
    await page.goto(`${EXTRANET}/hotels/${hotelId}/rooms/${roomId}`);
    await page.locator("input[type=file]").setInputFiles({
      name: "falha.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByText("Foto não enviada")).toBeVisible();
    expect(await listRoomImages(hotelId, roomId, token)).toHaveLength(0);
  });
});
