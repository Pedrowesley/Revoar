# Ajuste de hotel ativo Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/ajuste-hotel-ativo/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Guidelines found: none - strong defaults applied. O repo só tem Playwright (`npm run test:e2e`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Correção na API | e2e | AJUS-01, AJUS-03 e as bordas de status | `e2e/hotel-correction.spec.ts` | `npx playwright test e2e/hotel-correction.spec.ts` |
| Ficha do parceiro | e2e | Botão, confirmação, rascunho editável e histórico | `e2e/hotel-correction.spec.ts` | `npx playwright test e2e/hotel-correction.spec.ts` |
| Revisão do admin | e2e | Reenvio, fila, aprovação e rejeição | `e2e/hotel-correction.spec.ts` | `npx playwright test e2e/hotel-correction.spec.ts` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tipo de um app | `npx tsc --noEmit -p apps/api/tsconfig.json` |
| Full | e2e | `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test e2e/hotel-correction.spec.ts` |
| Build | Fechamento da fase | `npx tsc --noEmit -p apps/api/tsconfig.json && npx tsc --noEmit -p apps/extranet/tsconfig.json && npx tsc --noEmit -p apps/admin/tsconfig.json && PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test e2e/hotel-correction.spec.ts` |

---

## Execution Plan

### Phase 1: Correção do hotel ativo

```
T1 → T2 → T3
```

---

## Task Breakdown

### T1: Endpoint de correção

**What**: `POST /extranet/hotels/:id/correction` só a partir de ACTIVE, grava DRAFT e o histórico.
**Where**: `apps/api/src/extranet/hotels/hotels.service.ts`
**Depends on**: None
**Reuses**: `submitForReview`, `HotelStatusHistoryService`
**Requirement**: AJUS-01, AJUS-03

**Done when**:

- [x] Hotel ACTIVE passa a DRAFT e o histórico guarda ACTIVE → DRAFT com ator PARTNER
- [x] Outro status responde 422 com "Só um hotel ativo pode entrar em correção." e o status não muda
- [x] Sem novo envio, o hotel continua DRAFT
- [x] Aprovar um hotel fora de IN_REVIEW responde 422 com "Hotel não está em revisão."
- [x] Full gate passa
- [x] Test count: 3 tests pass

**Tests**: e2e
**Gate**: full

**Commit**: `feat(api): reopen an active hotel for correction`

---

### T2: Botão Corrigir ficha

**What**: Confirmação, botão só no hotel ativo e a linha de histórico na ficha.
**Where**: `apps/extranet/src/components/hotels/hotel-detail-header.tsx`
**Depends on**: T1
**Reuses**: `window.confirm` da exclusão do hotel
**Requirement**: AJUS-01, AJUS-02, AJUS-06

**Done when**:

- [x] O clique confirmado mostra o selo Rascunho e o formulário do quarto editável
- [x] A confirmação diz "A ficha sai do ar até a equipe Revoar aprovar de novo."
- [x] Cancelar a confirmação mantém Ativo
- [x] Rascunho, em análise, rejeitado e inativo não mostram o botão
- [x] A ficha mostra "Ativo → Rascunho (PARTNER)"
- [x] Full gate passa
- [x] Test count: 5 tests pass

**Tests**: e2e
**Gate**: full

**Commit**: `feat(extranet): let the partner correct an active hotel`

---

### T3: Nova revisão

**What**: O reenvio usa as regras atuais e o admin aprova ou rejeita sem tela nova.
**Where**: `e2e/hotel-correction.spec.ts`
**Depends on**: T2
**Reuses**: `submitForReview`, fila `/hotels/pending`
**Requirement**: AJUS-04, AJUS-05

**Done when**:

- [ ] Quarto sem foto responde 422 com "Cadastre ao menos 1 foto em: {nome}" e o status fica DRAFT
- [ ] O envio válido coloca o hotel na fila do admin
- [ ] Aprovar volta o status para ACTIVE
- [ ] Rejeitar grava o motivo e o parceiro vê esse texto
- [ ] Build gate passa
- [ ] Test count: 7 tests pass

**Tests**: e2e
**Gate**: build

**Commit**: `test(ajuste): cover correction review, approval and rejection`

---

## Phase Execution Map

```
Phase 1:  T1 ------→ T2 ------→ T3
```

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | start of T1 → T2 → T3 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Endpoint de correção | Correção na API | e2e | e2e | ✅ OK |
| T2: Botão Corrigir ficha | Ficha do parceiro | e2e | e2e | ✅ OK |
| T3: Nova revisão | Revisão do admin | e2e | e2e | ✅ OK |
