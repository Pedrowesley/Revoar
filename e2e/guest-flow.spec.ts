import { expect, test } from "@playwright/test";
import { apiPost } from "./helpers/api";

const GUEST = "http://127.0.0.1:3003";

function iso(offset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

test("hóspede escolhe o quarto imediato e confirma o pagamento de teste", async ({ page }) => {
  const checkIn = iso(20);
  const checkOut = iso(23);
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
  await page.getByRole("button", { name: /Flexível com café/ }).click();
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Camila");
  await page.getByRole("textbox", { name: "Sobrenome" }).fill("Nunes");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Telefone").fill("85911112222");
  await page.getByPlaceholder("CPF").fill("10000000019");
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();

  await expect(page.getByText("Quarto segurado")).toBeVisible();
  await page.getByRole("button", { name: "Pagar com PIX" }).click();
  await page.getByRole("button", { name: "Confirmar pagamento de teste" }).click();
  await expect(page.getByText("Reserva confirmada.")).toBeVisible();
  await expect(page.getByText(/Voucher REV-/)).toBeVisible();
});

test("pedido sob consulta só cobra depois que o parceiro aceita", async ({ page }) => {
  const checkIn = iso(24);
  const checkOut = iso(26);
  const email = `pedido-${Date.now()}@example.com`;

  await page.goto(
    `${GUEST}/hoteis/pousada-atlantico?city=Fortaleza&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`,
  );
  await page.getByRole("button", { name: /Sob consulta/ }).click();
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Ivo");
  await page.getByRole("textbox", { name: "Sobrenome" }).fill("Dias");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Telefone").fill("85922223333");
  await page.getByPlaceholder("CPF").fill("10000000019");
  await page.getByPlaceholder("Mensagem ao hotel (opcional)").fill("Chegamos depois das 18h");
  await page.getByRole("button", { name: "Enviar pedido" }).click();

  await expect(page.getByText("Pedido enviado")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pagar com PIX" })).toHaveCount(0);

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

  await expect(page.getByText("O hotel aceitou")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Pagar com PIX" }).click();
  await page.getByRole("button", { name: "Confirmar pagamento de teste" }).click();
  await expect(page.getByText("Reserva confirmada.")).toBeVisible();
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
