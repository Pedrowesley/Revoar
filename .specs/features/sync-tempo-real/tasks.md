# Tasks — Sync de dados sem F5 (Fase 7)

**Estimativa:** ~2–3 dias  
**Status:** ✅ Concluída (Jul/2026)  
**Spec:** `spec.md` · **Design:** `design.md` · **Validação:** `validation.md`

---

## Fase 7.0 — Fundação frontend ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T7.1 | Instalar `@tanstack/react-query` em admin e extranet | SYNC-UI-01 | ✅ |
| T7.2 | `QueryClientProvider` com refetch on focus / reconnect, `staleTime` 10s | SYNC-UI-01 | ✅ |
| T7.3 | Query keys + helpers de `refetchInterval` (pausa aba oculta) | SYNC-POLL-01 | ✅ |

## Fase 7.1 — Hooks e páginas ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T7.4 | Hooks admin: stats, pending partners/hotels, hotel, mutations | SYNC-INV-01 | ✅ |
| T7.5 | Hooks extranet: profile, hotels, hotel, submit | SYNC-INV-01 | ✅ |
| T7.6 | Migrar dashboard, filas, lista/detalhe de `useEffect` → `useQuery` | SYNC-POLL-01 | ✅ |
| T7.7 | Componente `LastUpdated` nas telas críticas | SYNC-UX-01 | ✅ |

## Fase 7.2 — API stats + eventos ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T7.8 | `GET /admin/stats` (counts Prisma) | SYNC-STATS-01 | ✅ |
| T7.9 | `RevoarEvent` em `@revoar/shared` | SYNC-EVT-01 | ✅ |
| T7.10 | `EventBusService` + `EventsModule` | SYNC-EVT-01 | ✅ |
| T7.11 | Emitir em approve/reject parceiro, approve/reject hotel, submit | SYNC-EVT-01 | ✅ |

## Fase 7.3 — SSE ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T7.12 | `GET /admin/notifications/stream` (Admin JWT) | SYNC-SSE-01 | ✅ |
| T7.13 | `GET /extranet/notifications/stream` (Partner JWT, filtro `partnerId`) | SYNC-SSE-01 | ✅ |
| T7.14 | Hooks `useAdminRevoarEvents` / `usePartnerRevoarEvents` + reconnect 3s | SYNC-SSE-01 | ✅ |
| T7.15 | `RevoarEventsListener` nos providers | SYNC-SSE-01 | ✅ |

## Fase 7.4 — Docs + DX (esta entrega) ✅

| # | Task | Status |
|---|------|--------|
| T7.16 | Seção Fase 7 em `DEVELOPMENT.md` | ✅ |
| T7.17 | Spec / design / tasks / validation desta feature | ✅ |
| T7.18 | Addendum em `RELEASE-0.0.md` + `STATE.md` + README + Master Plan | ✅ |

## Não feito (débito consciente)

| # | Task | Motivo |
|---|------|--------|
| T7.19 | E2E Playwright duas origens (admin + extranet) | Débito — ver `validation.md` |
| T7.20 | Redis Pub/Sub no EventBus | Só quando houver >1 instância API |
| T7.21 | Heartbeat SSE | Só se proxy de staging fechar o stream |

---

## Dependências

```
T7.1–T7.3 → T7.4–T7.7
T7.8–T7.11 → T7.12–T7.15
T7.16–T7.18 (docs, paralelo)
```

---

## Definition of Done

- [x] Approve/reject/submit atualiza a outra UI sem F5
- [x] Polling pausa com aba oculta
- [x] SSE com JWT + fallback polling
- [x] Time documentado (spec + RELEASE + STATE + DEVELOPMENT + Master Plan)
- [ ] E2E automatizado do sync (débito T7.19)
