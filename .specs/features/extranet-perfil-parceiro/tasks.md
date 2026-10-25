# Perfil do parceiro — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/extranet-perfil-parceiro/design.md`  
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `package.json` script `test:e2e` (Playwright) and `build`. Nenhum runner unitário (sem Vitest/Jest).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Prisma schema | none | build gate only | `packages/database/prisma/schema.prisma` | `npm run db:generate && npm run build` |
| Shared Zod / event type | none | build gate only | `packages/shared/src/**` | `npm run build -w @revoar/shared` |
| API routes | e2e | Cada rota da spec: feliz, 400, 401, 403, 404, 422 | `e2e/partner-profile.spec.ts` | `npm run test:e2e` |
| Extranet e admin UI | e2e | Menu, seções, fila "Confirmou", ficha sem inputs, sync | `e2e/partner-profile.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Não há suíte unitária | `npm run build -w @revoar/shared` |
| Full | Rotas e telas | `npm run test:e2e -- e2e/partner-profile.spec.ts` |
| Build | Schema, fase fechada | `npm run db:generate && npm run build` |

---

## Execution Plan

Fases em ordem. As setas abaixo são o grafo inteiro; cada `Depends on` tem a mesma aresta.

### Phase 1: Foundation

Schema, contrato e presign.

### Phase 2: API

Escrita do parceiro e leitura do admin.

### Phase 3: UI

Extranet, admin e o spec Playwright.

```
T1 -> T2
T1 -> T3
T1 -> T4
T1 -> T7
T2 -> T5
T3 -> T5
T4 -> T5
T5 -> T6
T1 -> T8
T3 -> T8
T8 -> T9
T6 -> T10
T7 -> T10
T10 -> T11
T10 -> T12
T9 -> T13
T9 -> T14
T13 -> T15
T3 -> T16
T8 -> T16
T11 -> T17
T12 -> T17
T14 -> T17
T15 -> T17
T16 -> T17
```

---

## Task Breakdown

### T1: Colunas do perfil no Prisma

**What**: Adicionar `avatarUrl`, `logoUrl` e `detailsConfirmedAt` e a migration.
**Where**: `packages/database/prisma/schema.prisma`
**Depends on**: None
**Reuses**: models `Partner` e `PartnerUser`
**Requirement**: PROF-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] As três colunas existem com os `@map` do design
- [x] `npm run db:generate` passa

**Tests**: none
**Gate**: build

---

### T2: Schemas Zod do perfil

**What**: Contratos de update, confirm e presign, com body estrito.
**Where**: `packages/shared/src/schemas/profile.schema.ts`
**Depends on**: T1
**Reuses**: `packages/shared/src/schemas/image.schema.ts`
**Requirement**: PROF-02, PROF-03, PROF-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Exportado em `packages/shared/src/index.ts`
- [x] `legalName`, `cnpj`, `email` e `status` não passam no update

**Tests**: none
**Gate**: build

---

### T3: Evento partner.profile.updated

**What**: Incluir o tipo no union `RevoarEvent`.
**Where**: `packages/shared/src/events.ts`
**Depends on**: T1
**Reuses**: os eventos `partner.approved` e `hotel.submitted`
**Requirement**: PROF-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O union aceita `{ type: "partner.profile.updated"; partnerId: string }`

**Tests**: none
**Gate**: build

---

### T4: Presign de avatar e logo

**What**: Método de upload com prefixo `partners/{partnerId}/avatar|logo`.
**Where**: `apps/api/src/storage/s3.service.ts`
**Depends on**: T1
**Reuses**: `createPresignedUpload`
**Requirement**: PROF-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A chave não cai em `hotels/`
- [x] JPG, PNG e WebP seguem o mapa de extensão já existente

**Tests**: none
**Gate**: build

---

### T5: Serviço de escrita do perfil

**What**: `update`, `presign` e `confirm`, zerando `detailsConfirmedAt` em toda alteração.
**Where**: `apps/api/src/extranet/profile/partner-profile.service.ts`
**Depends on**: T2, T3, T4
**Reuses**: `PrismaService`, `S3Service`, `EventBusService`
**Requirement**: PROF-02, PROF-04, PROF-05, PROF-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Update grava só nome, nome fantasia, telefone, responsável e URLs com o prefixo do próprio `partnerId`
- [x] URL fora do prefixo responde 400 e não grava
- [x] Confirm sem os cinco campos responde 422 `{ missing }`
- [x] Confirm e update emitem `partner.profile.updated` para admins

**Tests**: e2e
**Gate**: full

---

### T6: Rotas HTTP do perfil

**What**: Controller autenticado com o JWT do parceiro.
**Where**: `apps/api/src/extranet/profile/partner-profile.controller.ts`
**Depends on**: T5
**Reuses**: guard de `extranet/auth`
**Requirement**: PROF-02, PROF-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `PATCH /extranet/profile`, `POST /extranet/profile/avatar/presign`, `POST /extranet/profile/logo/presign`, `POST /extranet/profile/confirm`
- [x] Token de admin recebe 401

**Tests**: e2e
**Gate**: full

---

### T7: GET /extranet/auth/me com a ficha

**What**: Incluir avatar, logo e `detailsConfirmedAt` na resposta de `getProfile`.
**Where**: `apps/api/src/extranet/auth/partner-auth.service.ts`
**Depends on**: T1
**Reuses**: `getProfile` atual
**Requirement**: PROF-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O JSON do me traz os três campos novos
- [x] Tipo `PartnerProfile` em `apps/extranet/src/lib/api.ts` acompanha o JSON

**Tests**: e2e
**Gate**: full

---

### T8: Leitura admin do parceiro

**What**: `getById` completo e `detailsConfirmed` na lista de pendentes.
**Where**: `apps/api/src/admin/partners/admin-partners.service.ts`
**Depends on**: T1, T3
**Reuses**: `listPending` e `approve`
**Requirement**: PROF-07, PROF-08, PROF-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 404 quando o id não existe
- [x] A lista pendente inclui `detailsConfirmed`
- [x] `approve` existente não muda de regra

**Tests**: e2e
**Gate**: full

---

### T9: GET /admin/partners/:id

**What**: Rota de dossiê depois da rota estática `pending`.
**Where**: `apps/api/src/admin/partners/admin-partners.controller.ts`
**Depends on**: T8
**Reuses**: `AdminJwtAuthGuard`
**Requirement**: PROF-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `GET /admin/partners/pending` continua a lista
- [x] Token de parceiro recebe 401

**Tests**: e2e
**Gate**: full

---

### T10: Página /profile

**What**: Faixa de identidade, quatro seções e o passo Revisar.
**Where**: `apps/extranet/src/app/profile/page.tsx`
**Depends on**: T6, T7
**Reuses**: `PageShell`, `Surface`, `Input`, `Button`
**Requirement**: PROF-01, PROF-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Seções Pessoal, Empresa, Contato e Revisar
- [x] E-mail, razão social e CNPJ sem input
- [x] Confirmar desabilitado até o checkbox e os campos exigidos

**Tests**: e2e
**Gate**: full

---

### T11: Menu Meu perfil no header

**What**: Avatar ou inicial abre Meu perfil e Sair.
**Where**: `apps/extranet/src/components/layout/app-header.tsx`
**Depends on**: T10
**Reuses**: `getToken` e o botão Sair atual
**Requirement**: PROF-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Logado vê o menu; deslogado não
- [x] Meu perfil navega para `/profile`

**Tests**: e2e
**Gate**: full

---

### T12: Atalho no painel

**What**: O cartão Dados da empresa aponta para `/profile`.
**Where**: `apps/extranet/src/app/dashboard/page.tsx`
**Depends on**: T10
**Reuses**: o `Surface` de dados da empresa
**Requirement**: PROF-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O cartão é um link para `/profile`

**Tests**: e2e
**Gate**: full

---

### T13: Ficha somente leitura do admin

**What**: Página `/partners/[id]` espelhando a ficha, com aprovar se PENDING.
**Where**: `apps/admin/src/app/partners/[id]/page.tsx`
**Depends on**: T9
**Reuses**: `PageShell`, `Surface`, `approve` já usado na fila
**Requirement**: PROF-07, PROF-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem inputs e sem botão Confirmar
- [x] Mostra "Ainda não confirmou" ou a data
- [x] Aprovar só aparece quando status é PENDING

**Tests**: e2e
**Gate**: full

---

### T14: Sinal na fila de pendentes

**What**: Cada linha mostra Confirmou ou Não confirmou e linka o nome à ficha.
**Where**: `apps/admin/src/app/partners/pending/page.tsx`
**Depends on**: T9
**Reuses**: a lista atual
**Requirement**: PROF-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O texto usa `detailsConfirmed`
- [x] O nome navega para `/partners/[id]`
- [x] O botão Aprovar da fila permanece

**Tests**: e2e
**Gate**: full

---

### T15: Link do parceiro no hotel

**What**: O nome do parceiro no detalhe do hotel abre a ficha.
**Where**: `apps/admin/src/app/hotels/[id]/page.tsx`
**Depends on**: T13
**Reuses**: o bloco que já imprime `partner.legalName`
**Requirement**: PROF-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O nome é um link para `/partners/{partnerId}`

**Tests**: e2e
**Gate**: full

---

### T16: Invalidar a ficha no evento

**What**: `partner.profile.updated` recarrega a fila e o dossiê aberto.
**Where**: `apps/admin/src/hooks/use-revoar-events.ts`
**Depends on**: T3, T8
**Reuses**: `useAdminRevoarEvents`
**Requirement**: PROF-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A query `['admin','partners', partnerId]` é invalidada
- [x] A fila pendente também

**Tests**: e2e
**Gate**: full

---

### T17: Playwright da ficha

**What**: Cobrir os critérios PROF-01 a PROF-10 no fluxo de duas origens.
**Where**: `e2e/partner-profile.spec.ts`
**Depends on**: T11, T12, T14, T15, T16
**Reuses**: `e2e/full-flow.spec.ts` e `e2e/helpers`
**Requirement**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08, PROF-09, PROF-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Parceiro edita, confirma e vê a data
- [x] Body com CNPJ recebe 400
- [x] Admin lê a ficha, vê Confirmou na fila, e token de parceiro em `/admin/partners/:id` recebe 401
- [x] `npm run test:e2e -- e2e/partner-profile.spec.ts` passa

**Tests**: e2e
**Gate**: full

---

## Diagram-Definition Cross-Check

| Edge | Depends on | Diagram |
| ---- | ---------- | ------- |
| T1 → T2, T3, T4, T7, T8 | sim | sim |
| T2 → T5, T3 → T5, T4 → T5 | sim | sim |
| T5 → T6 | sim | sim |
| T3 → T8, T8 → T9 | sim | sim |
| T6 → T10, T7 → T10 | sim | sim |
| T10 → T11, T10 → T12 | sim | sim |
| T9 → T13, T9 → T14, T13 → T15 | sim | sim |
| T3 → T16, T8 → T16 | sim | sim |
| T11, T12, T14, T15, T16 → T17 | sim | sim |

## Test Co-location Validation

| Task | Layer | Tests field | Matrix |
| ---- | ----- | ----------- | ------ |
| T1–T4 | schema / shared / S3 helper | none | none |
| T5–T17 | API, UI, e2e | e2e | e2e |

## Granularity Check

Cada `Where` cita um arquivo. T7 menciona o tipo da extranet no critério de pronto; o arquivo da tarefa continua `partner-auth.service.ts`. O export do Zod em `index.ts` fica no critério de T2, não numa segunda tarefa.
