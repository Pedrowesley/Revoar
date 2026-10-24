# Validation — Sync de dados sem F5 (Fase 7)

**Data:** 2026-07-04  
**Verdict:** **PASS (condicional)** — comportamento implementado e builds OK; sem E2E dedicado do stream  
**Feature:** `sync-tempo-real`  
**Verifier:** Revisão pós-implementação (handoff documental)

---

## Resumo

A Fase 7 cobre o gap de UX da Release 0.0: filas e status deixam de depender de F5. TanStack Query + polling condicional + SSE estão no código de admin, extranet e API. O contrato de eventos vive em `@revoar/shared`.

O veredito é condicional porque **não há teste E2E de duas origens** (admin aprova → extranet atualiza). Regressão de sync hoje só se pega em teste manual ou se o REST quebrar.

---

## Verificação por requisito

| Req ID | AC resumido | Evidência | Resultado |
|--------|-------------|-----------|-----------|
| SYNC-UI-01 | QueryClient + refetch on focus | `apps/admin/src/app/providers.tsx`, `apps/extranet/src/app/providers.tsx` | ✅ PASS (código) |
| SYNC-POLL-01 | Poll 30s só PENDING/IN_REVIEW; pausa aba oculta | `apps/*/src/lib/query.ts` | ✅ PASS (código) |
| SYNC-STATS-01 | `GET /admin/stats` counts | controller/serviço admin stats | ✅ PASS (código) |
| SYNC-SSE-01 | Streams JWT + reconnect 3s | `*-notifications.controller.ts`, `use-revoar-events.ts` | ✅ PASS (código) |
| SYNC-EVT-01 | 4 tipos + emit nos 3 fluxos | `packages/shared/src/events.ts`, services admin/extranet | ✅ PASS (código) |
| SYNC-UX-01 | LastUpdated nas telas críticas | componentes + páginas listadas no design | ✅ PASS (código) |
| SYNC-INV-01 | Mutations invalidam queries | hooks approve/reject/submit | ✅ PASS (código) |

---

## Gates

| Gate | Comando / artefato | Resultado |
|------|-------------------|-----------|
| Build shared + database + api | `npm run build -w @revoar/shared -w @revoar/database -w @revoar/api` | ✅ na implementação |
| Build admin + extranet | `npm run build -w @revoar/admin -w @revoar/extranet` | ✅ na implementação |
| E2E sync (duas origens) | — | ❌ não existe |
| E2E fluxo 0.0 (não quebra) | `e2e/full-flow.spec.ts` | ✅ inalterado (REST igual) |

---

## Como validar manualmente (time)

Pré-requisito: `npm run dev` (extranet :3000, admin :3001, API :3002).

1. Aba A — extranet com parceiro **novo** `PENDING` em `/dashboard`.
2. Aba B — admin `admin@revoar.com.br` / `revoar123` em `/partners/pending`.
3. Aprovar o parceiro na aba B.
4. **Esperado:** aba A troca para conta ativa sem F5; “Atualizado há Xs” mexe.
5. Na extranet, submeter um hotel `DRAFT` completo → `IN_REVIEW`.
6. **Esperado:** `/hotels/pending` e dashboard admin incrementam sem F5.
7. Aprovar ou rejeitar o hotel no admin.
8. **Esperado:** lista/detalhe na extranet mudam de status sem F5.
9. Trocar de aba do browser por >30s e voltar — refetch on focus deve atualizar.

Fallback: DevTools → Network → bloquear `/notifications/stream` → o poll de 30s ainda atualiza.

---

## Discrimination sensor

| Mutação hipotética | O que deveria falhar | Coberto? |
|--------------------|----------------------|----------|
| Remover emit no approve | Extranet não atualiza até o poll (30s) | ⚠️ só manual |
| Quebrar JWT no SSE | Stream 401; poll continua | ⚠️ só manual |
| Polling sem pause em aba oculta | Tráfego com tab hidden | ❌ sem teste |
| Stats retornar lista completa | Dashboard pesado | ❌ sem teste de contrato |

---

## Gaps e débitos (ranked)

1. **E2E duas origens** — único gap que impede PASS limpo (T7.19)
2. **EventBus in-process** — documentado; bloqueia horizontal scale da API
3. **Heartbeat SSE** — sem ping; risco em proxy de staging
4. **Toasts in-app** — P2, não bloqueia

---

## Conclusão

**PASS condicional.** Código e contrato estão no repo e o fluxo manual fecha o DoD de produto. Antes de demo com sócios, rodar o roteiro da seção “Como validar manualmente”.

**Não bloqueia** Release 0.1 (busca pública). Recomenda-se T7.19 no mesmo sprint em que o time for tocar E2E.
