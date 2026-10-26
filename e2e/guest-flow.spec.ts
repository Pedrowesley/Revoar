import { expect, test } from "@playwright/test";
import { adminLogin, apiPost } from "./helpers/api";

const GUEST = "http://127.0.0.1:3003";

function iso(offset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function expectMobileShell(page: import("@playwright/test").Page, buttonName: string | RegExp) {
  const metrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
  const box = await page.getByRole("button", { name: buttonName }).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThan(600);
}

async function freeStay(altText: string, mode: "INSTANT" | "REQUEST") {
  for (let offset = 8; offset <= 34; offset += 1) {
    const checkIn = iso(offset);
    const checkOut = iso(offset + 2);
    const response = await fetch(
      `http://127.0.0.1:3002/guest/hotels/pousada-atlantico?city=Fortaleza&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
    );
    if (!response.ok) continue;
    const detail = (await response.json()) as {
      rooms: { images?: { altText: string | null }[]; rates: { bookingMode: string; freeUnits: number }[] }[];
    };
    const open = detail.rooms?.some(
      (room) =>
        room.images?.some((image) => image.altText === altText) &&
        room.rates.some((rate) => rate.bookingMode === mode && rate.freeUnits >= 1),
    );
    if (open) return { checkIn, checkOut };
  }
  throw new Error(`Nenhuma data livre para ${altText}`);
}

async function messagesFor(email: string) {
  const token = await adminLogin();
  const response = await fetch("http://127.0.0.1:3002/admin/notifications/outbox", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await response.text());
  const messages = (await response.json()) as { to: string; subject: string; html: string }[];
  return messages.filter((message) => message.to === email);
}

async function fillGuest(page: import("@playwright/test").Page, email: string, phone: string) {
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Camila");
  await page.getByRole("textbox", { name: "Sobrenome", exact: true }).fill("Nunes");
  await page.getByRole("textbox", { name: "E-mail" }).fill(email);
  await page.getByRole("textbox", { name: "Telefone" }).fill(phone);
  await page.getByRole("textbox", { name: "CPF" }).fill("10000000019");
  await page.getByRole("checkbox", { name: /meus dados/ }).check();
}

test.describe("área do hóspede no celular", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hóspede escolhe o quarto imediato e confirma o pagamento de teste", async ({ page }) => {
    const { checkIn, checkOut } = await freeStay("Quarto duplo com cama queen", "INSTANT");
    const email = `hospede-${Date.now()}@example.com`;

    await page.goto(GUEST);
    await page.getByLabel("Destino").fill("Fortaleza");
    await page.getByLabel("Check-in").fill(checkIn);
    await page.getByLabel("Check-out").fill(checkOut);
    await page.getByLabel("Adultos").fill("2");
    await page.getByLabel("Crianças").fill("0");
    await page.getByLabel("Quartos").fill("1");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page.getByRole("heading", { name: "Pousada Atlântico" })).toBeVisible();
    await page.getByRole("link", { name: /Pousada Atlântico/ }).click();
    const roomPhoto = page.getByRole("img", { name: "Quarto duplo com cama queen" });
    await expect(roomPhoto).toBeVisible();
    await expect.poll(async () => roomPhoto.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    await page.getByRole("button", { name: /Flexível com café/ }).click();
    await expectMobileShell(page, "Reservar");
    await page.getByRole("button", { name: "Reservar", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Seus dados" })).toBeVisible();
    await fillGuest(page, email, "85911112222");
    await expectMobileShell(page, "Continuar");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();

    await expect(page.getByText("Quase lá! Seu quarto está reservado temporariamente.")).toBeVisible();
    await page.getByRole("button", { name: "Mais 10 minutos" }).click();
    await expect(page.getByRole("button", { name: "Mais 10 minutos" })).toHaveCount(0);
    const code = (await page.getByText(/^REV-/).textContent())?.trim() ?? "";
    const again = await fetch(`http://127.0.0.1:3002/guest/bookings/${code}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    expect(again.status).toBe(400);
    await expectMobileShell(page, /Confirmar reserva/);
    await page.getByRole("button", { name: /Confirmar reserva/ }).click();
    const pix = page.getByText(/00020126revoar/);
    const firstPix = (await pix.textContent()) ?? "";
    await page.getByRole("button", { name: "Gerar outro PIX de teste" }).click();
    await expect(pix).not.toHaveText(firstPix);
    await page.getByRole("button", { name: "Confirmar pagamento de teste" }).click();
    await expect(page.getByText("Reserva confirmada.")).toBeVisible();
    await expect(page.getByText(/Voucher REV-/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Compartilhar no WhatsApp" })).toBeVisible();
    await page.getByRole("button", { name: "Cancelar reserva" }).click();
    await expect(page.getByText(/reembolso é integral/)).toBeVisible();
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(page.getByText("Reserva cancelada.")).toBeVisible();
  });

  test("a ficha mostra piscina e varanda e deixa reduzir os quartos", async ({ page }) => {
    let checkIn = "";
    let checkOut = "";
    for (let offset = 8; offset <= 34; offset += 1) {
      const start = iso(offset);
      const end = iso(offset + 2);
      const response = await fetch(
        `http://127.0.0.1:3002/guest/hotels/pousada-atlantico?city=Fortaleza&checkIn=${start}&checkOut=${end}&adults=2&children=0&rooms=2`,
      );
      if (!response.ok) continue;
      const detail = (await response.json()) as {
        hotel: { amenities?: string[] };
        rooms: { amenities?: string[]; rates: { bookingMode: string; maxQuantity: number }[] }[];
      };
      const pool = detail.hotel?.amenities?.includes("POOL");
      const balcony = detail.rooms?.some((room) => room.amenities?.includes("BALCONY"));
      const pair = detail.rooms?.some((room) => room.rates.some((rate) => rate.bookingMode === "INSTANT" && rate.maxQuantity >= 2));
      if (pool && balcony && pair) {
        checkIn = start;
        checkOut = end;
        break;
      }
    }
    if (!checkIn) throw new Error("Nenhuma data com piscina, varanda e dois quartos");

    await page.goto(
      `${GUEST}/hoteis/pousada-atlantico?city=Fortaleza&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=2`,
    );
    await expect(page.getByText("Piscina", { exact: true })).toBeVisible();
    await expect(page.getByText("Varanda", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Flexível com café/ }).click();
    await expect(page.getByText("2 quartos", { exact: true })).toBeVisible();
    const price = page.locator("p.text-base.font-bold");
    const full = (await price.textContent()) ?? "";
    await page.getByRole("button", { name: "Menos um quarto" }).click();
    await expect(page.getByText("1 quarto", { exact: true })).toBeVisible();
    await expect(price).not.toHaveText(full);
    await expect(page.getByRole("button", { name: "Mais um quarto" })).toBeEnabled();
  });

test("pedido sob consulta só cobra depois que o parceiro aceita", async ({ page }) => {
  let checkIn = "";
  let checkOut = "";
  for (let offset = 27; offset <= 36; offset += 1) {
    const start = iso(offset);
    const end = iso(offset + 2);
    const response = await fetch(
      `http://127.0.0.1:3002/guest/hotels/pousada-atlantico?city=Fortaleza&checkIn=${start}&checkOut=${end}&adults=2&children=0&rooms=1`,
    );
    if (!response.ok) continue;
    const detail = (await response.json()) as { rooms: { rates: { bookingMode: string; freeUnits: number }[] }[] };
    const open = detail.rooms?.some((room) => room.rates.some((rate) => rate.bookingMode === "REQUEST" && rate.freeUnits >= 1));
    if (open) {
      checkIn = start;
      checkOut = end;
      break;
    }
  }
  if (!checkIn) throw new Error("Nenhuma data sob consulta livre");
  const email = `pedido-${Date.now()}@example.com`;

    await page.goto(
      `${GUEST}/hoteis/pousada-atlantico?city=Fortaleza&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
    );
    await page.getByRole("button", { name: /Sob consulta/ }).click();
    await page.getByRole("button", { name: "Solicitar reserva", exact: true }).click();
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Ivo");
    await page.getByRole("textbox", { name: "Sobrenome", exact: true }).fill("Dias");
    await page.getByRole("textbox", { name: "E-mail" }).fill(email);
    await page.getByRole("textbox", { name: "Telefone" }).fill("85922223333");
    await page.getByRole("textbox", { name: "CPF" }).fill("10000000019");
    await page.getByRole("textbox", { name: "Mensagem ao hotel (opcional)" }).fill("Chegamos depois das 18h");
    await page.getByRole("checkbox", { name: /meus dados/ }).check();
    await page.getByRole("button", { name: "Enviar pedido" }).click();

    await expect(page.getByText("Pedido enviado. O hotel tem até 24 horas.")).toBeVisible();
    await expect.poll(async () => (await messagesFor(email)).some((message) => message.subject.startsWith("Pedido enviado"))).toBe(true);
    await expect(page.getByRole("button", { name: "Pagar com PIX" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Confirmar reserva/ })).toHaveCount(0);

    const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
      email: "parceiro@revoar.com.br",
      password: "revoar123",
    });
    if (!login.ok) throw new Error(login.message);
    const list = await fetch("http://127.0.0.1:3002/extranet/bookings", {
      headers: { Authorization: `Bearer ${login.data.accessToken}` },
    });
    const bookings = (await list.json()) as { id: string; guestEmail: string; status: string }[];
    const booking = bookings.find((item) => item.guestEmail === email && item.status === "REQUESTED");
    if (!booking) throw new Error("Pedido não apareceu para o parceiro");
    const decision = await fetch(`http://127.0.0.1:3002/extranet/bookings/${booking.id}/decision`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${login.data.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decision: "accept" }),
    });
    if (!decision.ok) throw new Error(await decision.text());
    await expect.poll(async () => (await messagesFor(email)).some((message) => message.subject.startsWith("O hotel aceitou"))).toBe(true);

    await expect(page.getByText("O hotel aceitou")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Confirmar reserva/ }).click();
    await page.getByRole("button", { name: "Confirmar pagamento de teste" }).click();
    await expect(page.getByText("Reserva confirmada.")).toBeVisible();
    await expect.poll(async () => (await messagesFor(email)).some((message) => message.subject.startsWith("Voucher"))).toBe(true);
  });

  test("o link do e-mail abre a confirmada em próximas e a recusa em canceladas", async ({ page }) => {
    let stay: { checkIn: string; checkOut: string; instant: { id: string; totalCents: number }; request: { id: string; totalCents: number } } | null = null;
    for (let offset = 8; offset <= 34; offset += 1) {
      const checkIn = iso(offset);
      const checkOut = iso(offset + 2);
      const response = await fetch(
        `http://127.0.0.1:3002/guest/hotels/pousada-atlantico?city=Fortaleza&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
      );
      if (!response.ok) continue;
      const detail = (await response.json()) as { rooms: { rates: { id: string; bookingMode: string; freeUnits: number; totalCents: number }[] }[] };
      const rates = detail.rooms.flatMap((room) => room.rates);
      const instant = rates.find((rate) => rate.bookingMode === "INSTANT" && rate.freeUnits >= 1);
      const request = rates.find((rate) => rate.bookingMode === "REQUEST" && rate.freeUnits >= 1);
      if (instant && request) {
        stay = { checkIn, checkOut, instant, request };
        break;
      }
    }
    if (!stay) throw new Error("Nenhuma data com reserva imediata e sob consulta");
    const email = `viagem-${Date.now()}@example.com`;

    async function book(ratePlanId: string, totalCents: number) {
      const response = await fetch("http://127.0.0.1:3002/guest/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratePlanId,
          checkIn: stay!.checkIn,
          checkOut: stay!.checkOut,
          adults: 2,
          children: 0,
          quantity: 1,
          firstName: "Lia",
          lastName: "Costa",
          email,
          phone: "85933334444",
          cpf: "10000000019",
          idempotencyKey: crypto.randomUUID(),
          expectedTotalCents: totalCents,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      return (await response.json()) as { code: string };
    }

    const instantBooking = await book(stay.instant.id, stay.instant.totalCents);
    const payment = await fetch(`http://127.0.0.1:3002/guest/bookings/${instantBooking.code}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, method: "PIX", installments: 1 }),
    });
    if (!payment.ok) throw new Error(await payment.text());
    const paid = (await payment.json()) as { payment: { id: string } };
    const confirmed = await fetch(`http://127.0.0.1:3002/guest/bookings/${instantBooking.code}/pay/${paid.payment.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!confirmed.ok) throw new Error(await confirmed.text());

    const requestBooking = await book(stay.request.id, stay.request.totalCents);
    await expect.poll(async () => (await messagesFor(email)).some((message) => message.html.includes(requestBooking.code) && message.subject.startsWith("Pedido enviado"))).toBe(true);
    const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
      email: "parceiro@revoar.com.br",
      password: "revoar123",
    });
    if (!login.ok) throw new Error(login.message);
    const list = await fetch("http://127.0.0.1:3002/extranet/bookings", {
      headers: { Authorization: `Bearer ${login.data.accessToken}` },
    });
    const bookings = (await list.json()) as { id: string; code: string; status: string }[];
    const pending = bookings.find((item) => item.code === requestBooking.code && item.status === "REQUESTED");
    if (!pending) throw new Error("Pedido não apareceu para o parceiro");
    const decision = await fetch(`http://127.0.0.1:3002/extranet/bookings/${pending.id}/decision`, {
      method: "POST",
      headers: { Authorization: `Bearer ${login.data.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "decline" }),
    });
    if (!decision.ok) throw new Error(await decision.text());

    const voucher = (await messagesFor(email)).find((message) => message.to === email && message.subject.startsWith(`Voucher ${instantBooking.code}`));
    const declined = (await messagesFor(email)).find((message) => message.html.includes("Nada foi cobrado") && message.html.includes(requestBooking.code));
    expect(voucher?.to).toBe(email);
    expect(declined).toBeTruthy();
    const href = voucher?.html.match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
    if (!href) throw new Error("O voucher não trouxe o link da viagem");

    await page.goto(href);
    await expect(page.getByRole("region", { name: "Próximas" }).getByText(instantBooking.code)).toBeVisible();
    await expect(page.getByRole("region", { name: "Canceladas" }).getByText(requestBooking.code)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("revoar.guest.trips"))).toBeNull();
  });
});

test("parceiro recusa com motivo dentro das 24 horas e o hóspede lê", async ({ page }) => {
  let checkIn = "";
  let checkOut = "";
  let rate: { id: string; totalCents: number } | null = null;
  for (let offset = 8; offset <= 36; offset += 1) {
    const start = iso(offset);
    const end = iso(offset + 2);
    const response = await fetch(
      `http://127.0.0.1:3002/guest/hotels/pousada-atlantico?city=Fortaleza&checkIn=${start}&checkOut=${end}&adults=2&children=0&rooms=1`,
    );
    if (!response.ok) continue;
    const detail = (await response.json()) as { rooms: { rates: { id: string; bookingMode: string; freeUnits: number; totalCents: number }[] }[] };
    const request = detail.rooms.flatMap((room) => room.rates).find((item) => item.bookingMode === "REQUEST" && item.freeUnits >= 1);
    if (request) {
      checkIn = start;
      checkOut = end;
      rate = request;
      break;
    }
  }
  if (!rate) throw new Error("Nenhuma data sob consulta livre");
  const email = `recusa-${Date.now()}@example.com`;
  const reason = "Sem vaga nesta data";
  const created = await fetch("http://127.0.0.1:3002/guest/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ratePlanId: rate.id,
      checkIn,
      checkOut,
      adults: 2,
      children: 0,
      quantity: 1,
      firstName: "Lia",
      lastName: "Costa",
      email,
      phone: "85933334444",
      cpf: "10000000019",
      idempotencyKey: crypto.randomUUID(),
      expectedTotalCents: rate.totalCents,
    }),
  });
  if (!created.ok) throw new Error(await created.text());
  const booking = (await created.json()) as { code: string };

  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(login.message);
  await page.addInitScript((value) => {
    localStorage.setItem("revoar_partner_token", value);
  }, login.data.accessToken);
  await page.goto("http://localhost:3000/reservations");
  const card = page.getByRole("article", { name: booking.code });
  await expect(card.getByText(/24 horas/)).toBeVisible();
  await card.getByLabel("Motivo da recusa (opcional)").fill(reason);
  await card.getByRole("button", { name: "Recusar" }).click();
  await expect(card.getByText("Recusada")).toBeVisible();

  await page.goto(`${GUEST}/reservas/${booking.code}?email=${encodeURIComponent(email)}`);
  await expect(page.getByText("O hotel recusou. Nada foi cobrado.")).toBeVisible();
  await expect(page.getByText(`Motivo da recusa: ${reason}`)).toBeVisible();
  await expect
    .poll(async () =>
      (await messagesFor(email)).some((message) => message.html.includes("Nada foi cobrado") && message.html.includes(reason)),
    )
    .toBe(true);
});

test("parceiro lê a confirmada sem aceitar nem recusar e o pedido continua com as duas ações", async ({ page }) => {
  let stay: {
    checkIn: string;
    checkOut: string;
    instant: { id: string; totalCents: number; roomName: string };
    request: { id: string; totalCents: number };
  } | null = null;
  for (let offset = 8; offset <= 36; offset += 1) {
    const checkIn = iso(offset);
    const checkOut = iso(offset + 2);
    const response = await fetch(
      `http://127.0.0.1:3002/guest/hotels/pousada-atlantico?city=Fortaleza&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
    );
    if (!response.ok) continue;
    const detail = (await response.json()) as {
      rooms: { name: string; rates: { id: string; bookingMode: string; freeUnits: number; totalCents: number }[] }[];
    };
    const instantRoom = detail.rooms.find((room) => room.rates.some((rate) => rate.bookingMode === "INSTANT" && rate.freeUnits >= 1));
    const requestRoom = detail.rooms.find((room) => room.rates.some((rate) => rate.bookingMode === "REQUEST" && rate.freeUnits >= 1));
    const instant = instantRoom?.rates.find((rate) => rate.bookingMode === "INSTANT" && rate.freeUnits >= 1);
    const request = requestRoom?.rates.find((rate) => rate.bookingMode === "REQUEST" && rate.freeUnits >= 1);
    if (instant && request && instantRoom) {
      stay = { checkIn, checkOut, instant: { ...instant, roomName: instantRoom.name }, request };
      break;
    }
  }
  if (!stay) throw new Error("Nenhuma data com reserva imediata e sob consulta");
  const email = `leitura-${Date.now()}@example.com`;

  async function book(ratePlanId: string, totalCents: number) {
    const response = await fetch("http://127.0.0.1:3002/guest/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ratePlanId,
        checkIn: stay!.checkIn,
        checkOut: stay!.checkOut,
        adults: 2,
        children: 0,
        quantity: 1,
        firstName: "Lia",
        lastName: "Costa",
        email,
        phone: "85933334444",
        cpf: "10000000019",
        idempotencyKey: crypto.randomUUID(),
        expectedTotalCents: totalCents,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as { code: string };
  }

  const instantBooking = await book(stay.instant.id, stay.instant.totalCents);
  const payment = await fetch(`http://127.0.0.1:3002/guest/bookings/${instantBooking.code}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, method: "PIX", installments: 1 }),
  });
  if (!payment.ok) throw new Error(await payment.text());
  const paid = (await payment.json()) as { payment: { id: string } };
  const confirmed = await fetch(`http://127.0.0.1:3002/guest/bookings/${instantBooking.code}/pay/${paid.payment.id}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!confirmed.ok) throw new Error(await confirmed.text());
  const requestBooking = await book(stay.request.id, stay.request.totalCents);

  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(login.message);
  await page.addInitScript((value) => {
    localStorage.setItem("revoar_partner_token", value);
  }, login.data.accessToken);
  await page.goto("http://localhost:3000/reservations");

  const confirmedCard = page.getByRole("region", { name: "Confirmadas" }).getByRole("article", { name: instantBooking.code });
  await expect(confirmedCard.getByText(instantBooking.code)).toBeVisible();
  await expect(confirmedCard.getByText(`Lia Costa · ${email}`)).toBeVisible();
  await expect(confirmedCard.getByText(stay.instant.roomName)).toBeVisible();
  await expect(confirmedCard.getByText(`${stay.checkIn} a ${stay.checkOut}`)).toBeVisible();
  await expect(confirmedCard.getByText((stay.instant.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))).toBeVisible();
  await expect(confirmedCard.getByText("Confirmada")).toBeVisible();
  await expect(confirmedCard.getByRole("button", { name: "Aceitar" })).toHaveCount(0);
  await expect(confirmedCard.getByRole("button", { name: "Recusar" })).toHaveCount(0);

  const requestCard = page.getByRole("region", { name: "Pedidos" }).getByRole("article", { name: requestBooking.code });
  await expect(requestCard.getByRole("button", { name: "Aceitar" })).toBeVisible();
  await expect(requestCard.getByRole("button", { name: "Recusar" })).toBeVisible();
});

test("pedido novo aparece na extranet sem atualizar a página", async ({ page }) => {
  let stay: { checkIn: string; checkOut: string; rate: { id: string; totalCents: number } } | null = null;
  for (let offset = 8; offset <= 36; offset += 1) {
    const checkIn = iso(offset);
    const checkOut = iso(offset + 2);
    const response = await fetch(
      `http://127.0.0.1:3002/guest/hotels/pousada-atlantico?city=Fortaleza&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
    );
    if (!response.ok) continue;
    const detail = (await response.json()) as { rooms: { rates: { id: string; bookingMode: string; freeUnits: number; totalCents: number }[] }[] };
    const rate = detail.rooms.flatMap((room) => room.rates).find((item) => item.bookingMode === "REQUEST" && item.freeUnits >= 1);
    if (rate) {
      stay = { checkIn, checkOut, rate };
      break;
    }
  }
  if (!stay) throw new Error("Nenhuma data sob consulta livre");

  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(login.message);
  await page.addInitScript((value) => {
    localStorage.setItem("revoar_partner_token", value);
  }, login.data.accessToken);

  const stream = page.waitForResponse(
    (response) => response.url().includes("/extranet/notifications/stream") && response.ok(),
    { timeout: 20_000 },
  );
  await page.goto("http://localhost:3000/reservations");
  await expect(page.getByRole("heading", { name: "Reservas" })).toBeVisible();
  await stream;
  await page.evaluate(() => {
    (window as Window & { __revoarStay?: boolean }).__revoarStay = true;
  });

  const email = `ao-vivo-${Date.now()}@example.com`;
  const created = await fetch("http://127.0.0.1:3002/guest/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ratePlanId: stay.rate.id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      adults: 2,
      children: 0,
      quantity: 1,
      firstName: "Lia",
      lastName: "Costa",
      email,
      phone: "85933334444",
      cpf: "10000000019",
      idempotencyKey: crypto.randomUUID(),
      expectedTotalCents: stay.rate.totalCents,
    }),
  });
  if (!created.ok) throw new Error(await created.text());
  const booking = (await created.json()) as { code: string };

  const card = page.getByRole("region", { name: "Pedidos" }).getByRole("article", { name: booking.code });
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: "Aceitar" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Recusar" })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __revoarStay?: boolean }).__revoarStay)).toBe(true);
  expect(page.url()).toContain("/reservations");
});

test("parceiro abre o calendário com o aviso de bloqueio", async ({ page }) => {
  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(login.message);
  const response = await fetch("http://127.0.0.1:3002/extranet/hotels", {
    headers: { Authorization: `Bearer ${login.data.accessToken}` },
  });
  const hotels = (await response.json()) as { id: string; name: string }[];
  const hotel = hotels.find((item) => item.name === "Pousada Atlântico");
  if (!hotel) throw new Error("Pousada de teste não encontrada");

  await page.addInitScript((value) => {
    localStorage.setItem("revoar_partner_token", value);
  }, login.data.accessToken);
  await page.goto(`http://127.0.0.1:3000/hotels/${hotel.id}/availability`);
  await expect(page.getByText("Alugou fora do Revoar? Bloqueie essas noites.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como o hóspede fecha" })).toBeVisible();
});
