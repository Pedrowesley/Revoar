import { expect, test } from "@playwright/test";
import { adminLogin, apiPatch, apiPost, registerTestImage } from "./helpers/api";

const API = "http://localhost:3002";

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

test("moderação grava destinatário e assunto dos e-mails", async () => {
  const admin = await adminLogin();
  const unique = `${Date.now()}`;
  const email = `mail-${unique}@test.revoar.com.br`;
  const legalName = `Mail ${unique} Ltda`;
  const signup = await apiPost<{ accessToken: string; partner: { id: string } }>("/extranet/auth/signup", {
    legalName,
    cnpj: cnpjDigits(),
    email,
    phone: "11999990000",
    contactName: "Mail E2E",
    password: "revoar123",
    name: "Mail E2E",
  });
  expect(signup.ok).toBe(true);
  if (!signup.ok) return;
  const token = signup.data.accessToken;

  const denied = await fetch(`${API}/admin/notifications/outbox`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(denied.status).toBe(401);

  const read = async () => {
    const response = await fetch(`${API}/admin/notifications/outbox`, {
      headers: { Authorization: `Bearer ${admin}` },
    });
    expect(response.status).toBe(200);
    return response.json() as Promise<{ to: string; subject: string; html: string }[]>;
  };

  expect((await read()).some((message) => message.to === email && message.subject === "Cadastro recebido — Revoar")).toBe(
    true,
  );

  const approved = await apiPatch(`/admin/partners/${signup.data.partner.id}/approve`, undefined, admin);
  expect(approved.ok).toBe(true);
  expect((await read()).some((message) => message.to === email && message.subject === "Conta aprovada — Revoar")).toBe(
    true,
  );

  const hotelName = `Mail Hotel ${unique}`;
  const hotel = await apiPost<{ id: string }>(
    "/extranet/hotels",
    {
      name: hotelName,
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
  expect(hotel.ok).toBe(true);
  if (!hotel.ok) return;
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
  expect(room.ok).toBe(true);
  if (!room.ok) return;
  expect((await registerTestImage(hotel.data.id, token)).ok).toBe(true);
  expect(
    (
      await apiPost(
        `/extranet/hotels/${hotel.data.id}/rooms/${room.data.id}/images`,
        {
          url: `http://localhost:4566/revoar-hotel-images/hotels/${hotel.data.id}/rooms/${room.data.id}/e2e.jpg`,
        },
        token,
      )
    ).ok,
  ).toBe(true);
  expect((await apiPost(`/extranet/hotels/${hotel.data.id}/submit`, {}, token)).ok).toBe(true);
  expect((await apiPatch(`/admin/hotels/${hotel.data.id}/approve`, undefined, admin)).ok).toBe(true);
  expect(
    (await read()).some((message) => message.to === email && message.subject === `Hotel aprovado: ${hotelName}`),
  ).toBe(true);

  const secondName = `Mail Rejeitado ${unique}`;
  const second = await apiPost<{ id: string }>(
    "/extranet/hotels",
    {
      name: secondName,
      description: "Hotel de teste E2E com descrição completa para validação.",
      addressLine: "Rua Teste, 200",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      phone: "(11) 3333-4444",
      checkInTime: "14:00",
      checkOutTime: "12:00",
    },
    token,
  );
  expect(second.ok).toBe(true);
  if (!second.ok) return;
  const secondRoom = await apiPost<{ id: string }>(
    `/extranet/hotels/${second.data.id}/rooms`,
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
  expect(secondRoom.ok).toBe(true);
  if (!secondRoom.ok) return;
  expect((await registerTestImage(second.data.id, token)).ok).toBe(true);
  expect(
    (
      await apiPost(
        `/extranet/hotels/${second.data.id}/rooms/${secondRoom.data.id}/images`,
        {
          url: `http://localhost:4566/revoar-hotel-images/hotels/${second.data.id}/rooms/${secondRoom.data.id}/e2e.jpg`,
        },
        token,
      )
    ).ok,
  ).toBe(true);
  expect((await apiPost(`/extranet/hotels/${second.data.id}/submit`, {}, token)).ok).toBe(true);
  const reason = "O CEP da ficha está errado.";
  expect((await apiPatch(`/admin/hotels/${second.data.id}/reject`, { reason }, admin)).ok).toBe(true);
  const rejected = (await read()).find(
    (message) => message.to === email && message.subject === `Hotel precisa de ajustes: ${secondName}`,
  );
  expect(rejected?.html).toContain(reason);

  expect((await apiPatch(`/admin/partners/${signup.data.partner.id}/suspend`, undefined, admin)).ok).toBe(true);
  expect((await read()).some((message) => message.to === email && message.subject === "Conta suspensa — Revoar")).toBe(
    true,
  );
});
