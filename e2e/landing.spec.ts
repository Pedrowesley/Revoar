import { expect, test, type Page } from "@playwright/test";
import { apiPost } from "./helpers/api";

const EXTRANET = "http://localhost:3000";
function hero(page: Page) {
  return page.locator("section").filter({ has: page.getByRole("heading", { level: 1 }) });
}

async function partnerToken() {
  const login = await apiPost<{ accessToken: string }>("/extranet/auth/login", {
    email: "parceiro@revoar.com.br",
    password: "revoar123",
  });
  if (!login.ok) throw new Error(`Login do parceiro falhou: ${login.message}`);
  return login.data.accessToken;
}

async function openWithSession(page: Page) {
  const token = await partnerToken();
  await page.addInitScript((value) => {
    localStorage.setItem("revoar_partner_token", value);
  }, token);
  await page.goto(`${EXTRANET}/`);
}

test.describe("Landing pública da extranet", () => {
  test("LAND-01: mostra a headline e a linha do processo", async ({ page }) => {
    await page.goto(`${EXTRANET}/`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Encontre um lugar para ficar e reserve.",
    );
    const processLine = hero(page).getByText("Cadastro, revisão da equipe Revoar e hotel no ar.");
    await expect(processLine).toBeVisible();

    const cta = await hero(page).getByRole("link", { name: "Cadastrar hotel" }).boundingBox();
    const line = await processLine.boundingBox();
    expect(cta && line && line.y >= cta.y + cta.height).toBe(true);
  });

  test("LAND-02: Cadastrar hotel leva a /signup", async ({ page }) => {
    await page.goto(`${EXTRANET}/`);
    await hero(page).getByRole("link", { name: "Cadastrar hotel" }).click();
    await expect(page).toHaveURL(`${EXTRANET}/signup`);
  });

  test("LAND-02: Já tenho conta leva a /login", async ({ page }) => {
    await page.goto(`${EXTRANET}/`);
    await hero(page).getByRole("link", { name: "Já tenho conta" }).click();
    await expect(page).toHaveURL(`${EXTRANET}/login`);
  });

  test("LAND-03: com sessão o hero mostra Ir para o painel", async ({ page }) => {
    await openWithSession(page);

    const panel = hero(page).getByRole("link", { name: "Ir para o painel" });
    await expect(panel).toHaveAttribute("href", "/dashboard");
    await expect(hero(page).getByRole("link", { name: "Cadastrar hotel" })).toHaveCount(0);

    await panel.click();
    await expect(page).toHaveURL(`${EXTRANET}/dashboard`);
  });

  test("LAND-03 edge: sem token o hero volta a Cadastrar hotel", async ({ page }) => {
    await openWithSession(page);
    await expect(hero(page).getByRole("link", { name: "Ir para o painel" })).toBeVisible();

    await page.evaluate(() => {
      localStorage.removeItem("revoar_partner_token");
      window.dispatchEvent(new Event("revoar-auth-change"));
    });
    await expect(hero(page).getByRole("link", { name: "Cadastrar hotel" })).toBeVisible();
  });

  test("LAND-04: Área do hóspede está desabilitada e não navega", async ({ page }) => {
    await page.goto(`${EXTRANET}/`);
    const guest = page.getByRole("button", { name: /Área do hóspede/ });

    await expect(guest).toBeDisabled();
    await expect(guest).toContainText("Em breve");
    await guest.click({ force: true });
    await expect(page).toHaveURL(`${EXTRANET}/`);
  });

  test("LAND-05: as abas da prévia trocam o painel e mantêm Em breve", async ({ page }) => {
    await page.goto(`${EXTRANET}/`);
    const tabs = page.getByRole("tablist", { name: "Prévia do app do hóspede" });
    const preview = tabs.locator("..");

    await expect(tabs.getByRole("tab")).toHaveText(["Buscar", "Reservar", "Pagar", "Avaliar"]);
    await expect(tabs.getByRole("tab", { name: "Buscar" })).toHaveAttribute("aria-selected", "true");

    const panels = [
      { tab: "Buscar", heading: "Busca por destino e datas" },
      { tab: "Reservar", heading: "Escolha do quarto" },
      { tab: "Pagar", heading: "Pagamento na Revoar" },
      { tab: "Avaliar", heading: "Avaliação depois da estadia" },
    ];

    for (const { tab, heading } of panels) {
      await tabs.getByRole("tab", { name: tab }).click();
      await expect(tabs.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
      await expect(tabs.getByRole("tab", { selected: true })).toHaveCount(1);
      await expect(page.getByRole("tabpanel")).toContainText(heading);
      await expect(preview.getByText("Em breve")).toBeVisible();
      await expect(page).toHaveURL(`${EXTRANET}/`);
    }
  });

  test("LAND-06: passos, grade com Em breve e nenhum link do admin", async ({ page }) => {
    await page.goto(`${EXTRANET}/`);

    for (const step of ["Cadastre seu hotel", "Configure os quartos", "Envie para revisão"]) {
      await expect(page.getByRole("heading", { level: 3, name: step })).toBeVisible();
    }

    const grid = page.getByRole("region", { name: "O que já funciona e o que vem" });
    for (const item of ["Busca", "Reserva", "Pagamento", "Avaliação"]) {
      const card = grid.locator("article").filter({
        has: page.getByRole("heading", { level: 3, name: item, exact: true }),
      });
      await expect(card).toHaveCount(1);
      await expect(card).toContainText("Em breve");
    }

    const hrefs = await page.locator("a[href]").evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(new URL(href).origin).toBe(EXTRANET);
      expect(href).not.toContain(":3001");
    }
    await expect(page.getByRole("link", { name: /admin/i })).toHaveCount(0);
  });

  test("Edge: em 390px os CTAs ficam visíveis sem rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${EXTRANET}/`);

    await expect(hero(page).getByRole("link", { name: "Cadastrar hotel" })).toBeInViewport();
    await expect(hero(page).getByRole("link", { name: "Já tenho conta" })).toBeInViewport();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
