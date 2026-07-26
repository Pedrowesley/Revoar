# Revoar — Project State

> **Para agentes Cursor:** leia este arquivo primeiro, depois `RELEASE-0.0.md` e `.specs/features/admin-cadastro-parceiros/spec.md`.

---

## Handoff

| Campo | Valor |
|-------|-------|
| **Feature ativa** | `extranet-cadastro-parceiros` (Release 0.0) |
| **Fase atual** | Release 0.0 — **implementação concluída** + UI moderna + TanStack Query |
| **Próximo passo** | Release 0.1 — busca pública read-only (+ spec nova) |
| **Última atualização** | 2026-07-26 |
| **Git** | `main` em `github.com/Pedrowesley/Revoar`; evolução UI/data-fetch em branches `cursor/*` |

### O que já existe no disco

| Área | Local | Status |
|------|-------|--------|
| Master Plan (11 fases) | `docs/00-analise-de-mercado/` … `docs/10-diagramas/` | ✅ Completo |
| Edição Sócios v2.0 | Fases 0, 1, 2, 8, 9 em `docs/` | ✅ |
| Monorepo apps | `apps/extranet`, `apps/admin`, `apps/api` | ✅ |
| Packages | `packages/database`, `packages/shared` | ✅ |
| Spec Release 0.0 | `.specs/features/admin-cadastro-parceiros/` | ✅ Atualizada |
| Entrega consolidada | `RELEASE-0.0.md` | ✅ |
| Validação | `.specs/features/.../validation.md` | ✅ |
| Dev guide | `DEVELOPMENT.md` | ✅ |
| E2E + CI | `e2e/`, `.github/workflows/e2e.yml` | ✅ |
| PDF export | `scripts/export-pdfs.mjs` (`npm run pdf`) | ✅ Script; PDFs não commitados |
| Staging Docker | `docker-compose.staging.yml` | ✅ Local only |

### O que NÃO está feito

- Deploy staging em URL pública para sócios
- ≥ 10 hotéis piloto (operação manual)
- Release 0.1 (site público, busca)
- Reset de senha, fotos de quarto, multi-usuário por parceiro

### Ordem de leitura (Cursor / novo dev)

1. `.specs/STATE.md` ← você está aqui
2. `RELEASE-0.0.md`
3. `.specs/features/admin-cadastro-parceiros/spec.md`
4. `.specs/features/admin-cadastro-parceiros/validation.md`
5. `DEVELOPMENT.md`
6. `.specs/features/admin-cadastro-parceiros/design.md`
7. `docs/09-roadmap/fase-09-roadmap.md` (se precisar contexto produto)

### Comandos essenciais

```bash
docker compose up -d
npm install && npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev          # extranet :3000, admin :3001, api :3002
npm run build
npm run test:e2e
```

**Seed:** admin@revoar.com.br / revoar123 · parceiro@revoar.com.br / revoar123

---

## Decisions

| ID | Decisão | Status | Data |
|----|---------|--------|------|
| AD-001 | **Inventário first:** cadastro de parceiros + hotéis antes do site público | active | 2026-06 |
| AD-002 | **Stack MVP:** monorepo — Next.js 15 + NestJS + Prisma + PostgreSQL | active | 2026-06 |
| AD-003 | **Anfitrião = Parceiro hoteleiro PJ** (CNPJ obrigatório) | active | 2026-06 |
| AD-004 | ~~Admin interno primeiro~~ | superseded by AD-007 | 2026-06 |
| AD-005 | Hotéis cadastrados manualmente têm `supplier_type = DIRECT` | active | 2026-06 |
| AD-006 | Release 0.0 → inventário cadastrado → Release 0.1 busca pública | active | 2026-06 |
| AD-007 | **Extranet self-service:** parceiro cadastra hotel, quartos e fotos; Revoar aprova via admin interno | active | 2026-06 |
| AD-008 | **Quartos no P1:** cadastro completo de room types com dados necessários para o viajante | active | 2026-06 |
| AD-009 | **TanStack Query + polling** para filas/status (admin 15s, parceiro 30s condicional); `refetchOnWindowFocus` + invalidação pós-mutação. **Sem WebSockets/SSE** nesta fase (SSE reservado a PIX/booking no Master Plan) | active | 2026-07 |
| AD-010 | **UI shell moderno** extranet/admin: header autenticado, Plus Jakarta Sans, tokens `#0E7490`, componentes `PageShell`/`Surface`/`Skeleton`/`EmptyState`/`Alert`, checklist de progresso do hotel | active | 2026-07 |

---

## Roadmap revisado

```
Release 0.0  Extranet MVP   → ✅ código entregue (Jun/2026)
Release 0.1  Foundation    → Busca pública read-only + Hotelbeds sandbox
Release 0.5  Beta            → Reserva + pagamento
Release 1.0  GA              → Lançamento 5 destinos
```

---

## Specs

| Feature | Spec | Design | Tasks | Validation | Status |
|---------|------|--------|-------|------------|--------|
| extranet-cadastro-parceiros | ✅ | ✅ | ✅ | ✅ | Release 0.0 — software complete (+ UI/RQ Jul/2026) |
