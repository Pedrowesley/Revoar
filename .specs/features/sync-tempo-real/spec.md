# Sync de dados sem F5 — Admin + Extranet (Release 0.0, Fase 7)

**Feature ID:** `sync-tempo-real`  
**Scope:** Medium  
**Status:** Implemented (Jul/2026)  
**Decisão:** AD-009 em `.specs/STATE.md`  
**Validação:** `.specs/features/sync-tempo-real/validation.md`  
**Dev guide:** `DEVELOPMENT.md` § "Sincronização de dados sem F5 (Fase 7)"

---

## Problem Statement

Na Release 0.0 original (fases 0–6), admin e extranet carregavam dados com `useEffect` + `fetch` pontual. Depois de aprovar um parceiro ou hotel, a outra tela só atualizava com **F5**. Isso quebra o fluxo de moderação: o parceiro `PENDING` fica olhando um dashboard estático; o admin não vê hotel recém-enviado sem recarregar.

## Goals

- [x] Status de parceiro/hotel atualiza nas duas UIs sem refresh manual
- [x] Dashboard admin reflete filas pendentes sem recarregar
- [x] Push quase em tempo real (SSE) com **polling como fallback**
- [x] Indicador visível de “quando os dados foram atualizados”
- [x] Base reutilizável para RF-028 (confirmação assíncrona na Release 0.5)

## Out of Scope

| Feature | Reason |
|---------|--------|
| WebSocket bidirecional | Adiado — AD-009; necessário só com chat/reserva interativa (Release 0.5) |
| Redis Pub/Sub multi-instância | EventBus in-process basta em single instance; escala na Release 0.1+ |
| Notificação in-app (toast/badge persistente) | P2 — invalidate + LastUpdated cobrem o MVP |
| E-mail em tempo real | Já existe via `NotificationsService` (Fase 6); canal separado |
| Site público / busca | Release 0.1 |

---

## Assumptions

| Assumption | Chosen default | Confirmed? |
|------------|----------------|------------|
| SSE + polling é suficiente para filas de moderação | Sim — volume baixo na 0.0 | y |
| EventSource nativo não envia JWT | `fetch` + stream + `Authorization: Bearer` | y |
| Polling só quando o dado está “em espera” | 30s; pausa com aba oculta | y |
| WebSocket só quando houver canal bidirecional | Release 0.5 | y |

---

## User Stories

### P1: Parceiro vê aprovação sem F5 ⭐

**User Story:** Como parceiro `PENDING`, quero que o dashboard passe a “conta ativa” assim que a Revoar aprovar — sem eu recarregar a página.

**Acceptance Criteria:**

1. WHEN parceiro está em `/dashboard` com status `PENDING` THEN system SHALL poll `GET /extranet/auth/me` a cada 30s **somente se a aba estiver visível**
2. WHEN admin aprova o parceiro THEN API SHALL emitir `partner.approved` no canal do `partnerId`
3. WHEN extranet recebe o evento SSE THEN SHALL invalidar a query de perfil e refletir `ACTIVE` sem F5
4. WHEN SSE cair THEN system SHALL reconectar em ~3s e o polling SHALL continuar como fallback
5. WHEN aba está oculta THEN polling SHALL pausar

**Independent Test:** duas abas (admin + extranet) → approve → dashboard extranet atualiza.

---

### P1: Admin vê hotel enviado sem F5 ⭐

**User Story:** Como operador Revoar, quero que a fila `IN_REVIEW` e o dashboard incrementem quando um parceiro submete um hotel — sem F5.

**Acceptance Criteria:**

1. WHEN admin está em `/dashboard`, `/hotels/pending` ou `/partners/pending` THEN system SHALL poll as filas/stats a cada 30s (aba visível)
2. WHEN parceiro submete hotel THEN API SHALL emitir `hotel.submitted` para admins
3. WHEN admin recebe o evento THEN SHALL invalidar stats + filas + detalhe do hotel
4. WHEN admin aprova/rejeita THEN extranet do parceiro SHALL atualizar status do hotel sem F5

**Independent Test:** submit na extranet → fila admin atualiza; approve/reject → detalhe/lista do parceiro atualiza.

---

### P1: Operador confia no dado na tela ⭐

**User Story:** Como operador ou parceiro, quero ver há quanto tempo a tela foi atualizada para saber se estou olhando dado fresco.

**Acceptance Criteria:**

1. WHEN a query correspondente tiver `dataUpdatedAt` THEN UI SHALL exibir “Atualizado há Xs” (`LastUpdated`)
2. Telas: dashboard admin, filas pending, detalhe hotel admin, dashboard extranet (PENDING), lista/detalhe hotel em revisão

---

### P2: Stats leves no dashboard

**User Story:** Como gestor Revoar, quero que o dashboard faça polling de **contadores** e não da lista completa.

**Acceptance Criteria:**

1. WHEN admin abre dashboard THEN `GET /admin/stats` retorna `{ pendingPartners, pendingHotels }`
2. WHEN polling do dashboard THEN SHALL usar esse endpoint (não as listas completas)

---

## Edge Cases

- WHEN token expira no meio do SSE THEN stream fecha; reconexão falha até novo login
- WHEN duas instâncias da API (futuro) THEN EventEmitter in-process **não** entrega cross-instance — usar Redis Pub/Sub
- WHEN EventSource nativo THEN não usar (não envia header `Authorization`)
- WHEN hotel `ACTIVE`/`DRAFT` THEN polling do detalhe/lista SHALL desligar

---

## Requirement Traceability

| ID | Story | Status | Evidência |
|----|-------|--------|-----------|
| SYNC-UI-01 | Cache + refetch on focus | Implemented | `apps/*/src/app/providers.tsx` — TanStack Query v5 |
| SYNC-POLL-01 | Polling condicional 30s | Implemented | `apps/*/src/lib/query.ts` |
| SYNC-STATS-01 | `GET /admin/stats` | Implemented | admin stats controller |
| SYNC-SSE-01 | Streams JWT + reconnect | Implemented | `*/notifications/stream` + `use-revoar-events.ts` |
| SYNC-EVT-01 | Tipos + EventBus | Implemented | `packages/shared/src/events.ts`, `EventBusService` |
| SYNC-UX-01 | LastUpdated | Implemented | `apps/*/src/components/last-updated.tsx` |
| SYNC-INV-01 | Invalidate após mutate | Implemented | hooks approve/reject/submit |

---

## Success Criteria

- [x] Aprovar parceiro em uma aba atualiza a extranet na outra sem F5
- [x] Submit de hotel atualiza fila admin sem F5
- [x] Aprovar/rejeitar hotel atualiza extranet sem F5
- [x] Aba oculta não gera tráfego de polling
- [x] SSE cai → polling cobre; SSE volta → invalidate imediato

## Relação com o Master Plan

O Master Plan (`docs/03-requisitos`) prevê **RF-028** (polling/SSE na confirmação de reserva, Release 0.5). Esta feature **adianta a fundação** no monólito atual (`EventBusService` + contrato `RevoarEvent`) para o fluxo de moderação da 0.0. Não substitui RF-028.
