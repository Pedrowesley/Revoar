# Landing pública Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/landing-publica/design.md`  
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: none - strong defaults applied. O repo só tem Playwright (`playwright.config.ts`, `e2e/*.spec.ts`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Componentes da landing | none | - (build gate only; comportamento coberto pela rota) | `apps/extranet/src/components/landing/*.tsx` | build gate only |
| Rota `/` da extranet | e2e | Todos os ACs LAND-01..06: happy path, sessão ativa e porta do hóspede sem navegação | `e2e/landing.spec.ts` | `npx playwright test e2e/landing.spec.ts` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Não há testes unitários no repo | `npx tsc --noEmit -p apps/extranet/tsconfig.json` |
| Full | Após task com e2e | `npx tsc --noEmit -p apps/extranet/tsconfig.json && npx playwright test e2e/landing.spec.ts` |
| Build | Tasks sem testes e fim de fase | `npx tsc --noEmit -p apps/extranet/tsconfig.json` (a extranet não tem config de ESLint) |

---

## Execution Plan

### Phase 1: Componentes e rota

```
T1 → T2 → T3 → T4 → T5
```

---

## Task Breakdown

### T1: CTA do hero ciente da sessão

**What**: Client component com "Cadastrar hotel" e "Já tenho conta" sem token e "Ir para o painel" com token.
**Where**: `apps/extranet/src/components/landing/hero-cta.tsx`
**Depends on**: None
**Reuses**: `getToken` e `AUTH_CHANGE_EVENT` de `apps/extranet/src/lib/auth.ts`
**Requirement**: LAND-02, LAND-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Lê o token no effect e escuta `AUTH_CHANGE_EVENT` e `storage`
- [x] Build gate passa

**Tests**: none
**Gate**: build

---

### T2: Hero da landing

**What**: Título, linha do processo, CTA e porta "Área do hóspede" desabilitada com "Em breve".
**Where**: `apps/extranet/src/components/landing/landing-hero.tsx`
**Depends on**: T1
**Reuses**: `PageShell` como referência de largura
**Requirement**: LAND-01, LAND-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Porta do hóspede é `<button type="button" disabled>`
- [x] Build gate passa

**Tests**: none
**Gate**: build

---

### T3: Prévia clicável do hóspede

**What**: Abas Buscar, Reservar, Pagar e Avaliar com painel animado e selo "Em breve" fixo.
**Where**: `apps/extranet/src/components/landing/guest-preview.tsx`
**Depends on**: T2
**Reuses**: `Surface`
**Requirement**: LAND-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `role="tablist"`, `role="tab"` com `aria-selected` e `role="tabpanel"`
- [x] Nenhum controle submete ou navega
- [x] Build gate passa

**Tests**: none
**Gate**: build

---

### T4: Passos e grade de capacidades

**What**: Três passos reais e grade assimétrica com o que existe e o que vem "Em breve".
**Where**: `apps/extranet/src/components/landing/landing-sections.tsx`
**Depends on**: T3
**Reuses**: `Surface`
**Requirement**: LAND-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Busca, Reserva, Pagamento e Avaliação com "Em breve"
- [x] Nenhum link do admin
- [x] Build gate passa

**Tests**: none
**Gate**: build

---

### T5: Home da extranet vira a landing

**What**: `page.tsx` compõe hero, prévia e seções; e2e cobre LAND-01..06.
**Where**: `apps/extranet/src/app/page.tsx`
**Depends on**: T4
**Reuses**: componentes de T1–T4
**Requirement**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06

**Tools**:

- MCP: `cursor-ide-browser`
- Skill: NONE

**Done when**:

- [x] `e2e/landing.spec.ts` cobre cada AC da spec
- [x] Full gate passa (9 testes)
- [x] Conferido no browser em 390px e desktop

**Tests**: e2e
**Gate**: full
