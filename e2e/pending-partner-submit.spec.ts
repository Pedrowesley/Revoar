import { expect, test } from "@playwright/test";
import { formatCnpj, generateValidCnpjDigits } from "./helpers/cnpj";
import { apiPost, partnerSignup, registerTestImage } from "./helpers/api";

test("parceiro PENDING não consegue enviar hotel para revisão", async () => {
  const uniqueId = Date.now().toString();
  const cnpjDigits = generateValidCnpjDigits();

  const signup = await partnerSignup(uniqueId, cnpjDigits);
  expect(signup.ok).toBeTruthy();
  if (!signup.ok) return;

  expect(signup.data.partner.status).toBe("PENDING");
  const token = signup.data.accessToken;

  const hotel = await apiPost<{ id: string }>(
    "/extranet/hotels",
    {
      name: `Hotel Pending ${uniqueId}`,
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
  expect(hotel.ok).toBeTruthy();
  if (!hotel.ok) return;

  const room = await apiPost(
    `/extranet/hotels/${hotel.data.id}/rooms`,
    {
      name: "Standard E2E",
      description: "Quarto padrão para teste automatizado.",
      maxAdults: 2,
      maxChildren: 0,
      maxOccupancy: 2,
      bedConfiguration: "1 cama queen",
      amenities: ["WIFI", "AC"],
    },
    token,
  );
  expect(room.ok).toBeTruthy();

  const image = await registerTestImage(hotel.data.id, token);
  expect(image.ok).toBeTruthy();

  const submit = await apiPost(`/extranet/hotels/${hotel.data.id}/submit`, {}, token);
  expect(submit.ok).toBeFalsy();
  if (!submit.ok) {
    expect(submit.status).toBe(422);
    expect(submit.message).toMatch(/aprovada/i);
  }
});
