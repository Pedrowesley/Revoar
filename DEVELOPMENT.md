# Revoar — Monorepo

Plataforma de turismo. Release 0.0: Extranet + Admin + API.

## Estrutura

```
apps/
  extranet/   → Parceiro cadastra hotéis (porta 3000)
  admin/      → Revoar aprova cadastros (porta 3001)
  api/        → NestJS REST API (porta 3002)
packages/
  database/   → Prisma + PostgreSQL
  shared/     → Zod schemas, tipos
```

## Setup local

```bash
# 1. Variáveis de ambiente
cp .env.example .env
cp apps/extranet/.env.local.example apps/extranet/.env.local
cp apps/admin/.env.local.example apps/admin/.env.local

# 2. Subir banco e storage local
docker compose up -d

# 3. Instalar dependências
npm install

# 4. Prisma
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Desenvolvimento
npm run dev
```

## URLs

| App | URL |
|-----|-----|
| Extranet | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API health | http://localhost:3002/health |

## Admin moderação (Fase 5)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/admin/auth/login` | POST | Login operador |
| `/admin/auth/me` | GET | Perfil admin |
| `/admin/partners/pending` | GET | Fila parceiros PENDING |
| `/admin/partners/:id/approve` | PATCH | → ACTIVE |
| `/admin/hotels/pending` | GET | Fila IN_REVIEW |
| `/admin/hotels/:id` | GET | Preview completo |
| `/admin/hotels/:id/approve` | PATCH | → ACTIVE + histórico |
| `/admin/hotels/:id/reject` | PATCH | → DRAFT + motivo |

Credencial seed admin: `admin@revoar.com.br` / `revoar123`

Páginas admin: `/login`, `/dashboard`, `/partners/pending`, `/hotels/pending`, `/hotels/[id]`.

## Data fetching (TanStack Query — AD-009)

Ambas as apps usam `@tanstack/react-query` com transport `apiFetch` (sem mudar contratos REST).

| Default | Valor |
|---------|--------|
| `staleTime` | 10s |
| `refetchOnWindowFocus` | true |
| Retry | limitado (padrão TQ) |

| Área | Polling | Invalidação |
|------|---------|-------------|
| Admin dashboard + filas pendentes | 15s | após approve partner/hotel |
| Admin preview hotel (`IN_REVIEW`) | 15s enquanto em revisão | após approve/reject → filas |
| Extranet dashboard (parceiro `PENDING`) | 30s | — |
| Lista/detalhe hotel (`IN_REVIEW`) | 30s | após PATCH/DELETE/submit/CRUD rooms/images |

**Não usar WebSockets/SSE** para extranet/admin nesta fase. SSE/poll de pagamento fica no Master Plan (app viajante).

Provider: `components/providers/query-provider.tsx` envolvido no `layout.tsx` de cada app.

## Auth parceiro (Fase 1)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/extranet/auth/signup` | POST | Cadastro PJ + usuário |
| `/extranet/auth/login` | POST | Login |
| `/extranet/auth/me` | GET | Perfil (Bearer token) |

Fluxo na extranet: `/signup` ou `/login` → token em `localStorage` → `/dashboard`.

Header autenticado: Painel · Hotéis · Sair (some Entrar/Cadastrar após login).

## Hotéis parceiro (Fase 2)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/extranet/hotels` | GET | Listar hotéis (`?status=DRAFT`) |
| `/extranet/hotels` | POST | Criar hotel (DRAFT + slug) |
| `/extranet/hotels/:id` | GET | Detalhe |
| `/extranet/hotels/:id` | PATCH | Editar (DRAFT/REJECTED) |
| `/extranet/hotels/:id` | DELETE | Excluir (apenas DRAFT) |

Páginas extranet: `/hotels`, `/hotels/new`, `/hotels/[id]` (Dados), `/hotels/[id]/rooms`, `/hotels/[id]/photos`.  
Nav do hotel em steps + checklist de progresso. CEP via ViaCEP no cliente.

## Quartos parceiro (Fase 3)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/extranet/hotels/:id/rooms` | GET | Listar quartos |
| `/extranet/hotels/:id/rooms` | POST | Criar quarto |
| `/extranet/hotels/:id/rooms/:roomId` | PATCH | Editar quarto |
| `/extranet/hotels/:id/rooms/:roomId` | DELETE | Excluir quarto |
| `/extranet/hotels/:id/submit` | POST | Enviar para revisão (≥1 quarto) |

Páginas: `/hotels/[id]/rooms`, `/hotels/[id]/rooms/new`, `/hotels/[id]/rooms/[roomId]`.

## Fotos + Submit (Fase 4)

Requer LocalStack (`docker compose up -d`). O bucket S3 é criado automaticamente na inicialização da API.

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/extranet/hotels/:id/images` | GET | Listar fotos |
| `/extranet/hotels/:id/images/presign` | POST | URL assinada para upload |
| `/extranet/hotels/:id/images` | POST | Registrar foto após upload |
| `/extranet/hotels/:id/images/:imageId/primary` | PATCH | Definir foto principal |
| `/extranet/hotels/:id/images/:imageId` | DELETE | Excluir foto |
| `/extranet/hotels/:id/submit` | POST | DRAFT → IN_REVIEW (validação completa) |

Submit exige: parceiro ACTIVE, ≥1 quarto, ≥1 foto com principal, endereço e descrição completos.

Hotéis `IN_REVIEW`: edição parcial (descrição, telefone, horários). Nome e endereço bloqueados.

Página: `/hotels/[id]/photos`.

## Testes E2E (Fase 6)

Pré-requisitos: `docker compose up -d`, migrate + seed.

```bash
npm install
npx playwright install chromium
npm run test:e2e          # headless
npm run test:e2e:ui       # interface visual
bash scripts/e2e.sh       # script completo com setup
```

Cenários:
- `e2e/full-flow.spec.ts` — signup → hotel → quartos → fotos → submit → admin aprova
- `e2e/pending-partner-submit.spec.ts` — parceiro PENDING não consegue submit (422)

## E-mail (Fase 6)

Sem `RESEND_API_KEY`, a API loga e-mails no console (`[email stub]`).
Com Resend configurado, envia notificações de signup, aprovação de parceiro e hotel.

## Staging Docker (Fase 6)

```bash
cp .env.example .env
npm run db:generate && npm run db:migrate && npm run db:seed
npm run staging:up
# Extranet :3000 | Admin :3001 | API :3002
npm run staging:down
```

## Credenciais seed

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin Revoar | admin@revoar.com.br | revoar123 |
| Parceiro | parceiro@revoar.com.br | revoar123 |

## Documentação

| Documento | Conteúdo |
|-----------|------------|
| `RELEASE-0.0.md` | Entrega consolidada Release 0.0 |
| `.specs/STATE.md` | Decisões + handoff (leia primeiro) |
| `.specs/features/admin-cadastro-parceiros/` | Spec, design, tasks, validation do cadastro |
| `.specs/features/sync-tempo-real/` | Spec, design, tasks, validation do sync (Fase 7) |
| `docs/` | Master Plan (11 fases) + addendums de implementação |

## Sincronização de dados sem F5 (Fase 7)

Spec: `.specs/features/sync-tempo-real/`. Decisão **AD-009**.

Admin e extranet já usam TanStack Query (polling + `refetchOnWindowFocus`). A Fase 7 adiciona **SSE** por cima, sem trocar o REST.

| Camada | Onde |
|--------|------|
| QueryProvider + listener SSE | `apps/*/src/components/providers/query-provider.tsx` |
| Query keys | `apps/*/src/lib/query-keys.ts` |
| SSE hooks | `apps/*/src/hooks/use-revoar-events.ts` |
| Eventos | `packages/shared/src/events.ts` + `EventBusService` |

| Endpoint | Auth | Descrição |
|----------|------|-----------|
| `GET /admin/stats` | Admin JWT | `{ pendingPartners, pendingHotels }` |
| `GET /admin/notifications/stream` | Admin JWT | SSE de moderação |
| `GET /extranet/notifications/stream` | Partner JWT | SSE filtrado por `partnerId` |

Tipos: `partner.approved`, `hotel.submitted`, `hotel.approved`, `hotel.rejected`.  
O browser usa `fetch` + stream (não `EventSource`, que não envia JWT). Se o SSE cair, reconecta em 3s e o polling continua.

**Produção multi-instância:** `EventBusService` é in-process. Trocar por Redis Pub/Sub quando a API tiver mais de uma instância.

## UI shell (AD-010)

- Tipografia: Plus Jakarta Sans (`next/font`)
- Tokens: primary `#0E7490`, surface branca, background `#F4F7FB`
- Layout: `AppHeader`, `PageShell`, `PageHeader`, `Surface`, `Alert`, `EmptyState`, `Skeleton`
