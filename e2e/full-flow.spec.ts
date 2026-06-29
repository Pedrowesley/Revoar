import { expect, test } from "@playwright/test";
import { formatCnpj, generateValidCnpjDigits } from "./helpers/cnpj";
import { adminLogin, registerTestImage } from "./helpers/api";

test("fluxo completo: signup → hotel → quartos → fotos → submit → admin aprova", async ({
  page,
  context,
}) => {
  const uniqueId = Date.now().toString();
  const cnpjDigits = generateValidCnpjDigits();
  const email = `e2e-flow-${uniqueId}@test.revoar.com.br`;
  const password = "revoar123";

  // 1. Signup na extranet
  await page.goto("http://localhost:3000/signup");
  await page.getByLabel("Razão social *").fill(`Flow Hotel ${uniqueId} Ltda`);
  await page.getByLabel("Nome fantasia").fill(`Flow ${uniqueId}`);
  await page.getByLabel("CNPJ *").fill(formatCnpj(cnpjDigits));
  await page.getByLabel("Responsável legal *").fill("Responsável E2E");
  await page.getByLabel("Seu nome (login) *").fill("Operador Flow");
  await page.getByLabel("E-mail *").fill(email);
  await page.getByLabel("Telefone *").fill("(11) 98888-7777");
  await page.getByLabel("Senha *").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // 2. Admin aprova parceiro
  const adminPage = await context.newPage();
  await adminPage.goto("http://localhost:3001/login");
  await adminPage.getByLabel("E-mail").fill("admin@revoar.com.br");
  await adminPage.getByLabel("Senha").fill("revoar123");
  await adminPage.getByRole("button", { name: "Entrar" }).click();
  await expect(adminPage).toHaveURL(/\/dashboard/);

  await adminPage.goto("http://localhost:3001/partners/pending");
  await expect(adminPage.getByText(`Flow Hotel ${uniqueId} Ltda`)).toBeVisible();
  await adminPage
    .locator("li")
    .filter({ hasText: `Flow Hotel ${uniqueId} Ltda` })
    .getByRole("button", { name: "Aprovar" })
    .click();
  await expect(adminPage.getByText(`Flow Hotel ${uniqueId} Ltda`)).not.toBeVisible({
    timeout: 10_000,
  });

  // 3. Parceiro cadastra hotel
  await page.goto("http://localhost:3000/hotels/new");
  await page.getByLabel("Nome do hotel *").fill(`Hotel Flow ${uniqueId}`);
  await page.getByLabel("Descrição *").fill(
    "Hotel criado no teste E2E com descrição completa para validação do fluxo.",
  );
  await page.getByLabel("Telefone do hotel *").fill("(11) 3222-1100");
  await page.getByLabel("CEP *").fill("01310-100");
  await page.getByLabel("Endereço *").fill("Av. Paulista, 1000");
  await page.getByLabel("Cidade *").fill("São Paulo");
  await page.getByLabel("UF *").selectOption("SP");
  await page.getByRole("button", { name: "Criar hotel" }).click();
  await expect(page).toHaveURL(/\/hotels\/.+/);

  const hotelUrl = page.url();
  const hotelId = hotelUrl.split("/hotels/")[1]?.split("/")[0] ?? "";

  // 4. Cadastra quarto
  await page.goto(`${hotelUrl}/rooms/new`);
  await page.getByLabel("Nome do quarto *").fill("Quarto E2E Standard");
  await page.getByLabel("Descrição *").fill("Quarto confortável criado no teste automatizado E2E.");
  await page.getByLabel("Adultos máx. *").fill("2");
  await page.getByLabel("Crianças máx. *").fill("0");
  await page.getByLabel("Ocupação máx. *").fill("2");
  await page.getByLabel("Configuração de camas *").fill("1 cama queen");
  await page.getByRole("button", { name: "Wi-Fi" }).click();
  await page.getByRole("button", { name: "Ar-condicionado" }).click();
  await page.getByRole("button", { name: "Criar quarto" }).click();
  await expect(page).toHaveURL(/\/rooms\/.+/);

  // 5. Registra foto via API (evita dependência de upload S3 no browser)
  const partnerToken = await page.evaluate(() => localStorage.getItem("revoar_partner_token"));
  expect(partnerToken).toBeTruthy();
  const image = await registerTestImage(hotelId, partnerToken!);
  expect(image.ok).toBeTruthy();

  // 6. Submit para revisão
  await page.goto(`${hotelUrl}/photos`);
  await page.reload();
  await page.getByRole("button", { name: "Enviar para revisão" }).click();
  await expect(page.getByText("Em análise")).toBeVisible({ timeout: 15_000 });

  // 7. Admin aprova hotel
  await adminPage.goto("http://localhost:3001/hotels/pending");
  await expect(adminPage.getByText(`Hotel Flow ${uniqueId}`)).toBeVisible();
  await adminPage.getByText(`Hotel Flow ${uniqueId}`).click();
  await adminPage.getByRole("button", { name: "Aprovar" }).click();
  await expect(adminPage).toHaveURL(/\/hotels\/pending/);

  // Verifica status ACTIVE via API admin
  const adminToken = await adminLogin();
  const detail = await fetch(`http://localhost:3002/admin/hotels/${hotelId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const hotel = await detail.json();
  expect(hotel.status).toBe("ACTIVE");

  await adminPage.close();
});
