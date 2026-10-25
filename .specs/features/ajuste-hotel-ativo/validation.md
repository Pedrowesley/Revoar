# Ajuste de hotel ativo Validation

**Date**: 2026-10-25
**Spec**: `.specs/features/ajuste-hotel-ativo/spec.md`
**Diff range**: `fe7cbdc^..95dacd2`
**Verifier**: independent sub-agent (author ≠ verifier)
**Iteration**: re-verify 2
**Result**: PASS

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `POST /extranet/hotels/:id/correction` moves ACTIVE to DRAFT and records PARTNER history. Non-ACTIVE returns 422 and leaves the status unchanged. |
| T2 | ✅ Done | "Corrigir ficha" is only on ACTIVE. Confirm text, cancel, Rascunho, editable room, history line, and photo controls are asserted. |
| T3 | ✅ Done | Resubmit uses the current photo rule, the hotel returns to the admin queue, approval restores ACTIVE, and rejection shows the reason. |

---

## Spec-Anchored Acceptance Criteria

### P1: Parceiro abre a ficha publicada para corrigir

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o parceiro aciona "Corrigir ficha" em um hotel ACTIVE THEN the system SHALL mudar o status para DRAFT, SHALL gravar no histórico ACTIVE → DRAFT com o ator PARTNER e SHALL mostrar a ficha editável | Status `DRAFT`; history `ACTIVE → DRAFT` with actor `PARTNER`; the form is editable and the badge reads Rascunho | `e2e/hotel-correction.spec.ts:101` - `expect(correction.data.status).toBe("DRAFT")`; `e2e/hotel-correction.spec.ts:105` - `fromStatus: "ACTIVE"`; `e2e/hotel-correction.spec.ts:106` - `toStatus: "DRAFT"`; `e2e/hotel-correction.spec.ts:107` - `actorType: "PARTNER"`; `e2e/hotel-correction.spec.ts:178` - `expect(page.getByText("Rascunho", { exact: true })).toBeVisible()`; `e2e/hotel-correction.spec.ts:179` - `expect(page.getByLabel("Nome do hotel")).toBeEnabled()`; `e2e/hotel-correction.spec.ts:180` - `expect(page.getByText("Ativo → Rascunho (PARTNER)")).toBeVisible()` | ✅ PASS |
| WHILE o hotel está em DRAFT por essa correção the system SHALL permitir editar dados, quartos e fotos com as mesmas regras do rascunho | Hotel data, the room form, room photos, and hotel photos stay editable on the correction draft | `e2e/hotel-correction.spec.ts:179` - `expect(page.getByLabel("Nome do hotel")).toBeEnabled()`; `e2e/hotel-correction.spec.ts:185` - `expect(page.getByLabel("Nome do quarto")).toBeEnabled()`; `e2e/hotel-correction.spec.ts:186` - `expect(page.getByRole("button", { name: "Salvar alterações" })).toBeEnabled()`; `e2e/hotel-correction.spec.ts:187` - `expect(page.getByRole("button", { name: "Adicionar foto" })).toBeEnabled()` on the room edit page; `e2e/hotel-correction.spec.ts:190` - `expect(page.getByRole("button", { name: "Adicionar foto" })).toBeEnabled()` on `/hotels/:id/photos` | ✅ PASS |
| IF o parceiro aciona "Corrigir ficha" e o hotel não está ACTIVE THEN the system SHALL responder 422 com "Só um hotel ativo pode entrar em correção." e SHALL NOT mudar o status | HTTP 422, that exact message, and the previous status remains | `e2e/hotel-correction.spec.ts:123` - `expect(draft.status).toBe(422)`; `e2e/hotel-correction.spec.ts:124` - `expect(draft.message).toBe("Só um hotel ativo pode entrar em correção.")`; `e2e/hotel-correction.spec.ts:126` - status stays `"DRAFT"`; `e2e/hotel-correction.spec.ts:134` - `expect(inReview.status).toBe(422)`; `e2e/hotel-correction.spec.ts:135` - same message; `e2e/hotel-correction.spec.ts:137` - status stays `"IN_REVIEW"` | ✅ PASS |
| The system SHALL NOT oferecer "Corrigir ficha" em rascunho, em análise, rejeitado ou inativo | The button is absent on DRAFT, IN_REVIEW, REJECTED, and INACTIVE | `e2e/hotel-correction.spec.ts:201` - `toHaveCount(0)` on DRAFT; `e2e/hotel-correction.spec.ts:206` - `toHaveCount(0)` on IN_REVIEW; `e2e/hotel-correction.spec.ts:215` - `toHaveCount(0)` on REJECTED; `e2e/hotel-correction.spec.ts:232` - `toHaveCount(0)` on INACTIVE | ✅ PASS |

### P1: A correção passa por nova revisão

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o parceiro envia a correção e a ficha cumpre as regras atuais de revisão THEN the system SHALL mudar o status para IN_REVIEW e SHALL mostrar o hotel na fila do admin | Submit succeeds and the hotel appears on the admin pending queue, which lists only `IN_REVIEW` | `e2e/hotel-correction.spec.ts:266` - `expect(...submit...).ok).toBe(true)`; `e2e/hotel-correction.spec.ts:276` - `page.goto(.../hotels/pending)`; `e2e/hotel-correction.spec.ts:277` - `expect(page.getByText(name)).toBeVisible()` | ✅ PASS |
| IF a correção falha uma regra atual, como quarto sem foto THEN the system SHALL responder 422 com a mensagem dessa regra e SHALL manter DRAFT | HTTP 422, message `Cadastre ao menos 1 foto em: Sem foto`, status stays `DRAFT` | `e2e/hotel-correction.spec.ts:255` - `expect(submit.status).toBe(422)`; `e2e/hotel-correction.spec.ts:256` - `expect(submit.message).toBe("Cadastre ao menos 1 foto em: Sem foto")`; `e2e/hotel-correction.spec.ts:258` - `expect(...status).toBe("DRAFT")` | ✅ PASS |
| WHEN o admin aprova THEN the system SHALL mudar o status para ACTIVE | Status becomes `ACTIVE` | `e2e/hotel-correction.spec.ts:280` - `getByRole("button", { name: "Aprovar" }).click()`; `e2e/hotel-correction.spec.ts:282` - `expect(...status).toBe("ACTIVE")` | ✅ PASS |
| WHEN o admin rejeita com um motivo THEN the system SHALL mudar o status para REJECTED e SHALL mostrar esse motivo ao parceiro | Partner sees the Rejeitado badge and the exact reason | `e2e/hotel-correction.spec.ts:289` - fill `"O CEP da ficha está errado."`; `e2e/hotel-correction.spec.ts:298` - `expect(partnerPage.getByText("Rejeitado", { exact: true })).toBeVisible()`; `e2e/hotel-correction.spec.ts:299` - `expect(partnerPage.getByText("O CEP da ficha está errado.")).toBeVisible()` | ✅ PASS |
| WHEN o parceiro abre o dossiê THEN the system SHALL mostrar a linha de histórico ACTIVE → DRAFT | Partner dossier shows `Ativo → Rascunho (PARTNER)` | `e2e/hotel-correction.spec.ts:180` - `expect(page.getByText("Ativo → Rascunho (PARTNER)")).toBeVisible()` | ✅ PASS |

**Status**: ✅ All ACs covered

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `apps/extranet/src/components/rooms/room-photo-gallery.tsx:43` and `apps/extranet/src/components/photos/photo-gallery.tsx:47` | Forced `readOnly = true` as the first statement of both galleries, so "Adicionar foto" is not rendered on a correction draft | ✅ Killed |

**Sensor depth**: lightweight (1 mutation, this iteration)
**Result**: 1/1 killed - PASS

The live client bundles for `/hotels/[id]/rooms/[roomId]` and `/hotels/[id]/photos` both contained `readOnly = true` before the run. `npx playwright test e2e/hotel-correction.spec.ts -g "AJUS-01 e AJUS-02"` failed at `e2e/hotel-correction.spec.ts:187`: `getByRole('button', { name: 'Adicionar foto' })` was not found. Restored with `git checkout --` of only those two files. Porcelain after restore matched the pre-sensor baseline.

---

## Interactive UAT Results (if performed)

Not performed. This pass is the automated re-verify.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns | ✅ |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ |
| Every test maps to a spec requirement - no unclaimed tests | ✅ |
| Documented guidelines followed: none - strong defaults applied (`.specs/features/ajuste-hotel-ativo/tasks.md`) | ✅ |

Product surface in the diff: `hotels.controller.ts` adds the correction route, `hotels.service.ts` adds `requestCorrection`, `hotel-detail-header.tsx` adds the ACTIVE-only button and history line, and `hotel.ts` types `statusHistory`. `e2e/room-photos.spec.ts` changes inside `fe7cbdc^..95dacd2` belong to the fotos commits, not this feature. The seven tests in `e2e/hotel-correction.spec.ts` map to the criteria above, the two edge cases, or T2's confirm/cancel done-when checks (`e2e/hotel-correction.spec.ts:166` and `e2e/hotel-correction.spec.ts:170`).

---

## Edge Cases

- [x] WHEN o parceiro pede correção e não envia THEN the system SHALL manter o hotel em DRAFT — `e2e/hotel-correction.spec.ts:113` - `expect(stayed.status).toBe("DRAFT")` with no submit
- [x] IF o admin tenta aprovar um hotel que não está IN_REVIEW THEN the system SHALL recusar, como já faz hoje — `e2e/hotel-correction.spec.ts:149` - `expect(approve.status).toBe(422)`; `e2e/hotel-correction.spec.ts:150` - `expect(approve.message).toBe("Hotel não está em revisão.")`; `e2e/hotel-correction.spec.ts:152` - status stays `"DRAFT"`

---

## Gate Check

- **Gate command**: `npx tsc --noEmit -p apps/api/tsconfig.json && npx tsc --noEmit -p apps/extranet/tsconfig.json && npx tsc --noEmit -p apps/admin/tsconfig.json && PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test e2e/hotel-correction.spec.ts`
- **Result**: 7 passed, 0 failed, 0 skipped. Typecheck of api, extranet, and admin exited 0.
- **Test count before feature**: 0 (`e2e/hotel-correction.spec.ts` absent at `fe7cbdc^`)
- **Test count after feature**: 7
- **Delta**: +7
- **Skipped tests**: none
- **Failures**: none
- **Integrity**: `95dacd2` adds the two "Adicionar foto" enabled assertions. No assertion in this file was weakened, and no test in this file was removed.

---

## Fix Plans (if issues found)

None.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AJUS-01 | Verified | ✅ Verified |
| AJUS-02 | Verified | ✅ Verified |
| AJUS-03 | Verified | ✅ Verified |
| AJUS-04 | Verified | ✅ Verified |
| AJUS-05 | Verified | ✅ Verified |
| AJUS-06 | Verified | ✅ Verified |

Spec statuses were already Verified. This pass did not edit `spec.md`.

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 9/9 ACs matched spec outcome
**Sensor**: 1/1 mutations killed
**Gate**: 7 passed, 0 failed, 0 skipped

**What works**: An active hotel returns to an editable draft with PARTNER history. Data, rooms, and photos stay editable. Non-active hotels cannot enter correction, and the button is hidden off ACTIVE. Resubmit uses the current room-photo rule, the admin queue shows the hotel, approval restores ACTIVE, and rejection shows the reason.

**Issues found**: none

**Next steps**: none. Clean PASS, no lesson recorded.
