# Validação — landing-publica

## Validation: landing-publica - FAIL ❌

**Data**: 2026-10-24
**Spec**: `.specs/features/landing-publica/spec.md`
**Diff range**: `18edc74~1..8d683c4` (18edc74 docs spec, 79134e2 hero cta, 44b502c hero, 845b24e guest preview, 29a6c6a sections, 8d683c4 page + e2e)
**Verificador**: sub-agente independente (autor ≠ verificador)

Motivo do FAIL: dois mutantes sobreviveram ao sensor (link do admin com host alternativo e linha do processo acima do CTA). Os testes passam e cobrem os ACs, mas não discriminam esses dois comportamentos.

---

## Conclusão das tasks

| Task | Status | Observações |
| ---- | ------ | ----------- |
| T1 CTA do hero ciente da sessão | ✅ Feita | `hero-cta.tsx` lê o token no effect e escuta `AUTH_CHANGE_EVENT` e `storage` |
| T2 Hero da landing | ✅ Feita | Porta do hóspede é `<button type="button" disabled>` (`landing-hero.tsx:23-33`) |
| T3 Prévia clicável do hóspede | ✅ Feita | `role="tablist"`/`tab`/`tabpanel`, nenhum controle navega |
| T4 Passos e grade | ✅ Feita | Quatro itens "Em breve", sem link do admin no código |
| T5 Home vira a landing | ✅ Feita | `page.tsx` compõe as três seções; e2e com 9 testes |

---

## Critérios de aceite ancorados na spec

| Critério (WHEN X THEN Y) | Resultado definido na spec | `file:line` + asserção | Resultado |
| ------------------------ | -------------------------- | ---------------------- | --------- |
| LAND-01.1 WHEN abre `/` THEN título | "Publique seu hotel. O hóspede vai reservar aqui." | `e2e/landing.spec.ts:32-34` - `expect(page.getByRole("heading", { level: 1 })).toHaveText("Publique seu hotel. O hóspede vai reservar aqui.")` | ✅ PASS (texto idêntico ao da spec) |
| LAND-01.2 WHEN abre `/` THEN linha **abaixo do CTA** | "Cadastro, revisão da equipe Revoar e hotel no ar." abaixo do CTA | `e2e/landing.spec.ts:35` - `expect(hero(page).getByText("Cadastro, revisão da equipe Revoar e hotel no ar.")).toBeVisible()` | ⚠️ Parcial: o texto bate exatamente, mas a posição "abaixo do CTA" não é verificada (mutante M8 sobreviveu) |
| LAND-02.1 "Cadastrar hotel" sem sessão | navega para `/signup` | `e2e/landing.spec.ts:40-41` - `click()` + `expect(page).toHaveURL(\`${EXTRANET}/signup\`)` | ✅ PASS |
| LAND-02.2 "Já tenho conta" sem sessão | navega para `/login` | `e2e/landing.spec.ts:46-47` - `click()` + `expect(page).toHaveURL(\`${EXTRANET}/login\`)` | ✅ PASS |
| LAND-03 com sessão | "Ir para o painel" → `/dashboard`; sem "Cadastrar hotel" no hero | `e2e/landing.spec.ts:54` - `toHaveAttribute("href", "/dashboard")`; `:55` - `getByRole("link", { name: "Cadastrar hotel" })).toHaveCount(0)`; `:57-58` - `toHaveURL(\`${EXTRANET}/dashboard\`)` | ✅ PASS (sessão real via login da API, `:11-27`) |
| LAND-04 "Área do hóspede" | botão desabilitado com "Em breve"; URL fica em `/` | `e2e/landing.spec.ts:76` - `expect(guest).toBeDisabled()`; `:77` - `toContainText("Em breve")`; `:78-79` - `click({ force: true })` + `toHaveURL(\`${EXTRANET}/\`)` | ✅ PASS |
| LAND-05.1 abas e seleção inicial | Buscar, Reservar, Pagar, Avaliar; Buscar selecionada | `e2e/landing.spec.ts:86` - `toHaveText(["Buscar", "Reservar", "Pagar", "Avaliar"])`; `:87` - `tab "Buscar"` `toHaveAttribute("aria-selected", "true")` | ✅ PASS (ordem e texto exatos) |
| LAND-05.2 aciona aba | aba selecionada, painel dela visível, URL `/` | `e2e/landing.spec.ts:98-103` - `aria-selected="true"`, `getByRole("tab", { selected: true })).toHaveCount(1)`, `getByRole("tabpanel")).toContainText(heading)`, `toHaveURL(\`${EXTRANET}/\`)` | ✅ PASS |
| LAND-05.3 WHILE qualquer aba | selo "Em breve" na prévia | `e2e/landing.spec.ts:102` - `expect(preview.getByText("Em breve")).toBeVisible()` (dentro do laço das quatro abas) | ✅ PASS |
| LAND-06.1 passos | "Cadastre seu hotel", "Configure os quartos", "Envie para revisão" | `e2e/landing.spec.ts:110-112` - `getByRole("heading", { level: 3, name: step })).toBeVisible()` | ✅ PASS (match por substring do Playwright; aceitável) |
| LAND-06.2 grade | "Busca", "Reserva", "Pagamento", "Avaliação", cada um com "Em breve" | `e2e/landing.spec.ts:114-121` - card por `heading level 3, exact: true` → `toHaveCount(1)` + `toContainText("Em breve")` | ✅ PASS |
| LAND-06.3 sem link do admin | nenhum link para o admin | `e2e/landing.spec.ts:123` - `page.locator(\`a[href^="${ADMIN}"]\`)).toHaveCount(0)`; `:124` - `getByRole("link", { name: /admin/i })).toHaveCount(0)` | ⚠️ Parcial: só pega `http://localhost:3001` ou texto "admin"; `http://127.0.0.1:3001` com outro texto passa (mutante M7 sobreviveu) |

**Status**: ⚠️ Todos os ACs têm evidência `file:line`; dois têm asserção mais fraca que a spec (LAND-01.2 posição, LAND-06.3 forma do link).

---

## Casos de borda

- [x] Token some → hero volta a "Cadastrar hotel": `e2e/landing.spec.ts:61-70` - remove `revoar_partner_token`, dispara `revoar-auth-change` (mesmos valores de `apps/extranet/src/lib/auth.ts:1-2`) e `expect(hero(page).getByRole("link", { name: "Cadastrar hotel" })).toBeVisible()`. Mutante M5 morto.
- [x] 390px → CTAs visíveis sem rolagem horizontal: `e2e/landing.spec.ts:127-137` - `setViewportSize({ width: 390, height: 844 })`, `toBeInViewport()` em "Cadastrar hotel" e "Já tenho conta", `expect(scrollWidth - clientWidth).toBe(0)`.

---

## Sensor de discriminação

Execução: por instrução do orquestrador, as mutações foram aplicadas na árvore real, uma de cada vez, porque o dev server do Next em :3000 só serve essa árvore. Depois de cada edição: espera de 4s para o hot reload, `npx playwright test e2e/landing.spec.ts --retries=0`, restauração com `git checkout -- <arquivo>`, e `git status --short` conferido. A linha de base era só `?? apps/admin/tsconfig.tsbuildinfo` e `?? apps/extranet/tsconfig.tsbuildinfo`, e ficou idêntica depois de cada mutação. Nada em `apps/` ou `e2e/` ficou alterado.

| # | Arquivo:linha | Mutação | Teste que pegou | Morto? |
| - | ------------- | ------- | --------------- | ------ |
| M1 | `apps/extranet/src/components/landing/hero-cta.tsx:38` | `href="/signup"` → `href="/cadastro"` | LAND-02 /signup (`toHaveURL`) | ✅ Morto |
| M2 | `apps/extranet/src/components/landing/landing-hero.tsx:23-33` | Porta do hóspede `<button disabled>` → `<a href="/signup">` habilitado | LAND-04 (`toBeDisabled`) | ✅ Morto |
| M3 | `apps/extranet/src/components/landing/guest-preview.tsx:185` | Selo da prévia "Em breve" → "Disponível" | LAND-05 (`preview.getByText("Em breve")`) | ✅ Morto |
| M4 | `apps/extranet/src/components/landing/hero-cta.tsx:17` | `sync` ignora o token (`setAuthed(false)`) | LAND-03 e LAND-03 edge | ✅ Morto |
| M5 | `apps/extranet/src/components/landing/hero-cta.tsx:19` | Remove o listener de `AUTH_CHANGE_EVENT` | LAND-03 edge (token removido) | ✅ Morto |
| M6 | `apps/extranet/src/components/landing/guest-preview.tsx:209` | `onClick` da aba vira no-op | LAND-05 (`aria-selected`) | ✅ Morto |
| M7 | `apps/extranet/src/components/landing/landing-sections.tsx:180` | Adiciona `<a href="http://127.0.0.1:3001/login">Equipe Revoar</a>` no CTA final (confirmado no HTML de `/` via curl) | nenhum (9/9 passaram) | ❌ Sobreviveu → Fix 1 |
| M8 | `apps/extranet/src/components/landing/landing-hero.tsx:36-38` | Linha "Cadastro, revisão da equipe Revoar e hotel no ar." movida para cima do CTA | nenhum (9/9 passaram) | ❌ Sobreviveu → Fix 2 |
| M9 | `apps/extranet/src/components/landing/landing-sections.tsx:159-161` | Selo da grade vira "Disponível" só em "Pagamento" | LAND-06 (`toContainText("Em breve")`) | ✅ Morto |

Uma tentativa anterior a M2, que trocava `<button>` por `<a>` sem fechar a tag certa, quebrou a compilação. Ela foi descartada e não conta no sensor.

**Profundidade**: leve, ampliada (9 mutações válidas; a feature não é P0).
**Sensor**: 7/9 mortos, 2 sobreviveram → FAIL ❌

---

## Qualidade de código

| Princípio | Status |
| --------- | ------ |
| Código mínimo | ✅ Componentes sem abstração supérflua; `PANELS`/`TABS` são dados estáticos |
| Mudanças cirúrgicas | ✅ O diff toca só `apps/extranet/src/app/page.tsx`, `apps/extranet/src/components/landing/*`, `e2e/landing.spec.ts` e `.specs/` |
| Sem API, admin ou rota nova | ✅ `git diff --name-only 18edc74~1..8d683c4 -- apps/api apps/admin` vazio; nenhum `route.ts` |
| Sem valores arbitrários do Tailwind | ✅ `rg -- '-\['` nos arquivos novos: 0 ocorrências |
| Sem link do admin na página | ✅ No código: `rg -i '3001\|admin'` nos componentes e na page: 0 ocorrências. ⚠️ O teste não protege variantes (M7) |
| Sem número de prova social | ✅ Nenhum contador de hotéis ou empresas |
| Segue os padrões (AD-010, tokens, `Surface`, `getToken`/`AUTH_CHANGE_EVENT`) | ✅ |
| Asserções batem com o valor da spec | ⚠️ LAND-01.2 (posição) e LAND-06.3 (forma do link) mais fracas que a spec |
| Cobertura por camada (rota e2e: caminho feliz, sessão, porta do hóspede, bordas) | ✅ |
| Todo teste mapeia a um AC ou caso de borda | ✅ 9 testes, todos nomeados por LAND-0x ou "Edge" |
| Guidelines documentadas | nenhuma; padrões fortes aplicados |

Observação: `design.md` fala em estado `null` no primeiro render; `hero-cta.tsx:14` usa `false`. O efeito é o mesmo (servidor e cliente começam como visitante) e nenhum AC depende disso.

---

## Gate

- **Comando**: `npx tsc --noEmit -p apps/extranet/tsconfig.json && npx playwright test e2e/landing.spec.ts` (Node 20)
- **tsc**: exit 0
- **Playwright**: 9 passaram, 0 falharam, 0 pulados (9.4s)
- **Testes da landing antes da feature**: 0
- **Testes da landing depois da feature**: 9
- **Delta**: +9. Nenhuma outra spec e2e foi alterada no diff.
- **Pulados**: nenhum
- **Falhas**: nenhuma

---

## Planos de correção

### Fix 1: teste de "sem link do admin" só pega uma forma do URL

- **Causa**: `e2e/landing.spec.ts:123-124` procura só `a[href^="http://localhost:3001"]` e links cujo nome contém "admin". Um link para `http://127.0.0.1:3001` (host usado pelo próprio repo, ver commit 37224c3) com texto como "Equipe Revoar" passa.
- **Task de correção**: em `e2e/landing.spec.ts`, coletar todos os `href` de `a` na página e afirmar que nenhum aponta para a porta `:3001` nem contém `/admin` (por exemplo `expect(page.locator('a[href*=":3001"]')).toHaveCount(0)`, ou afirmar que todo `href` é relativo ou da origem da extranet).
- **Verificar**: reaplicar M7; o teste LAND-06 deve falhar.
- **Prioridade**: Major (regra explícita de "Out of Scope" e de Stakeholders: o admin não deve aparecer)

### Fix 2: posição "abaixo do CTA" não é afirmada

- **Causa**: `e2e/landing.spec.ts:35` afirma só que o texto está visível dentro do hero.
- **Task de correção**: no teste LAND-01, comparar `boundingBox()` da linha do processo com o de "Cadastrar hotel" e afirmar `linha.y >= cta.y + cta.height`.
- **Verificar**: reaplicar M8; o teste LAND-01 deve falhar.
- **Prioridade**: Minor

---

## Rastreabilidade (proposta; `spec.md` não foi editado pelo verificador)

| Requisito | Status anterior | Novo status |
| --------- | --------------- | ----------- |
| LAND-01 | Implemented | ❌ Needs Fix (asserção de posição, Fix 2) |
| LAND-02 | Implemented | ✅ Verified |
| LAND-03 | Implemented | ✅ Verified |
| LAND-04 | Implemented | ✅ Verified |
| LAND-05 | Implemented | ✅ Verified |
| LAND-06 | Implemented | ❌ Needs Fix (asserção do admin, Fix 1) |

---

## Resumo

**Geral**: ❌ Não pronto. O comportamento implementado está correto, mas dois testes precisam ser reforçados.

**Checagem ancorada na spec**: 10/12 critérios batem exatamente com a spec; 2 asserções são mais fracas que ela (LAND-01.2, LAND-06.3)
**Sensor**: 7/9 mutações mortas
**Gate**: 9 passaram, tsc limpo

**O que funciona**: headline e linha do processo com texto exato; CTAs de visitante para `/signup` e `/login`; CTA com sessão para `/dashboard` e volta ao estado de visitante quando o token some; porta do hóspede desabilitada com "Em breve"; abas da prévia com seleção única, painel próprio e selo fixo; passos e grade com "Em breve"; 390px sem rolagem horizontal; sem valores arbitrários; diff restrito à extranet.

**Problemas**: Fix 1 (teste do admin frágil), Fix 2 (posição da linha do processo não testada).

**Próximos passos**: mandar Fix 1 e Fix 2 para um implementador e depois verificar de novo (iteração 1 de 3).
