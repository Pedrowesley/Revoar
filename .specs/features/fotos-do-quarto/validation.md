# fotos-do-quarto validation

**Date**: 2026-10-25
**Spec**: `.specs/features/fotos-do-quarto/spec.md`
**Diff range**: `9183d88^..107d4b2`
**Verifier**: independent sub-agent (author ≠ verifier)
**Iteration**: 2

**Result**: PASS

Re-derived every acceptance criterion from `spec.md` against `e2e/room-photos.spec.ts` at `107d4b2`. The admin cover-only mutant was killed by FOTO-09.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `RoomImage` migration `add_room_images` is in the diff |
| T2 | ✅ Done | `MAX_ROOM_IMAGES` is 8 |
| T3 | ✅ Done | 9th photo and review block are asserted |
| T4 | ✅ Done | Create and edit gallery toasts are asserted |
| T5 | ✅ Done | Room list cover and checklist step are asserted |
| T6 | ✅ Done | Admin dossier lists every room photo, cover first, with no room controls |

---

## Spec-Anchored Acceptance Criteria

### P1: Parceiro ilustra o quarto

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o parceiro envia a primeira foto THEN gravá-la como capa e mostrar o toast "Foto principal enviada" com "Ela já é a capa do quarto." | Cover badge on the saved room, toast title and body exactly those strings | `e2e/room-photos.spec.ts:179` - `getByText("Principal", { exact: true })`; `:180` - `getByText("Foto principal enviada")`; `:181` - `getByText("Ela já é a capa do quarto.")` | ✅ PASS |
| WHEN o quarto já tem de 1 a 7 fotos e o envio termina THEN toast "Foto enviada" | Toast title "Foto enviada" after a room that already has a photo | `e2e/room-photos.spec.ts:314` seeds 1 image; `:325` - `getByText("Foto enviada")` | ✅ PASS |
| WHEN o quarto já tem 8 fotos e o parceiro escolhe outro arquivo THEN recusar e mostrar "Este quarto já tem 8 fotos." | That toast, and the room still has 8 photos | `e2e/room-photos.spec.ts:349` - `getByText("Este quarto já tem 8 fotos.")`; `:350` - `toHaveLength(8)` | ✅ PASS |
| IF a API receber a 9ª foto THEN 422 "Este quarto já tem 8 fotos." e não gravar | Status 422, that message, length stays 8 | `e2e/room-photos.spec.ts:154` - `toBe(422)`; `:155` - `toBe("Este quarto já tem 8 fotos.")`; `:157` - `toHaveLength(8)` | ✅ PASS |
| IF o arquivo passa de 5 MB THEN toast "Foto não enviada" com "Arquivo deve ter no máximo 5MB." | Both strings. The sentence also renders in the inline error, so the count is 2 | `e2e/room-photos.spec.ts:341` - `getByText("Foto não enviada")`; `:342` - `getByText("Arquivo deve ter no máximo 5MB.").toHaveCount(2)` | ✅ PASS |
| IF o arquivo não é JPG, PNG nem WebP THEN toast "Foto não enviada" com "Formato inválido. Use JPG, PNG ou WebP." | Both strings, same inline-plus-toast count | `e2e/room-photos.spec.ts:332` - `getByText("Foto não enviada")`; `:333` - `getByText("Formato inválido. Use JPG, PNG ou WebP.").toHaveCount(2)` | ✅ PASS |
| WHEN o parceiro marca outra foto como capa THEN só essa fica capa e toast "Foto principal definida" | One "Principal", on the card of "Segunda foto", plus that toast | `e2e/room-photos.spec.ts:202` - `getByText("Foto principal definida")`; `:203` - `toHaveCount(1)`; `:207` - `secondCard` contains "Principal" | ✅ PASS |
| WHEN o parceiro confirma "Excluir esta foto?" THEN remover a foto e toast "Foto excluída" | Dialog text, accept, toast, "Segunda foto" gone | `e2e/room-photos.spec.ts:222` - `dialog.message()` is "Excluir esta foto?"; `:225` - `getByText("Foto excluída")`; `:226` - img "Segunda foto" `toHaveCount(0)` | ✅ PASS |
| IF o parceiro cancela "Excluir esta foto?" THEN manter a foto | Dismiss, both images stay | `e2e/room-photos.spec.ts:213` - dialog is "Excluir esta foto?" then dismiss; `:217` img "Primeira foto"; `:218` img "Segunda foto" | ✅ PASS |
| WHEN a foto excluída era a capa e ainda existe outra THEN a próxima vira capa | Remaining photo is primary and is the other photo | `e2e/room-photos.spec.ts:227` - one "Principal"; `:230` - `isPrimary` true; `:231` - `id` equals `first.data.id` | ✅ PASS |
| Recusar envio, troca de capa e exclusão quando o hotel não está em rascunho nem rejeitado | IN_REVIEW rejects presign, register, primary and delete; the photo remains | `e2e/room-photos.spec.ts:370` - presign `toBe(422)`; `:375` register refused; `:383` primary `toBe(422)`; `:388` delete `toBe(422)`; `:390` - `toHaveLength(1)` | ✅ PASS |

### P1: Criar e editar o quarto com as fotos

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o parceiro abre "Adicionar" quarto THEN o seletor de fotos está no mesmo formulário dos dados | Create form at `/rooms/new` accepts a file together with nome, descrição, camas and Wi-Fi | `e2e/room-photos.spec.ts:169` through `:174` - room fields filled, then `input[type=file].setInputFiles` on that page | ✅ PASS |
| WHEN salva um quarto novo com 1 a 8 arquivos THEN criar, enviar, primeiro como capa, toast "Quarto criado", abrir a edição com as fotos | Toast, edit URL, cover badge | `e2e/room-photos.spec.ts:177` - `getByText("Quarto criado")`; `:178` - URL `/rooms/(?!new$)`; `:179` - "Principal" | ✅ PASS |
| IF escolhe mais de 8 arquivos ao criar THEN recusar antes de criar e toast "Escolha no máximo 8 fotos." | That toast, and the hotel still has 0 rooms | `e2e/room-photos.spec.ts:408` - `getByText("Escolha no máximo 8 fotos.")`; `:412` - `toHaveLength(0)` | ✅ PASS |
| IF o quarto é criado e o envio de uma foto falha THEN manter o quarto, toast "Foto não enviada", edição com as fotos que entraram | Room created, failure toast, edit URL, first image visible, second absent | `e2e/room-photos.spec.ts:437` - "Quarto criado"; `:438` - "Foto não enviada"; `:439` edit URL; `:440` img "primeira"; `:441` img "segunda" count 0 | ✅ PASS |
| WHEN abre a edição THEN listar fotos salvas com a capa primeiro e oferecer enviar, definir capa e excluir | "Adicionar foto", one cover, first card is the cover; set-cover and delete controls are used | `e2e/room-photos.spec.ts:197` - button "Adicionar foto"; `:198` - one "Principal"; `:199` - first grid card contains "Principal"; `:201` clicks "Definir principal"; `:216` clicks "Excluir foto" | ✅ PASS |
| WHEN salva nome, ocupação ou comodidades THEN manter as fotos e toast "Quarto salvo" | Name save keeps the photo and shows that toast | `e2e/room-photos.spec.ts:445` - `getByText("Quarto salvo")`; `:446` - img "primeira" visible | ✅ PASS |
| WHEN abre a lista de quartos THEN a capa de cada quarto, ou o ícone de prédio se não tem foto | Cover alt "Capa de {nome}" when a photo exists; no img and `lucide-building2` when it does not | `e2e/room-photos.spec.ts:234` - `getByAltText("Capa de Suíte")`; `:461` - `getByAltText("Capa de Sem capa")`; `:473` img count 0; `:474` - `svg.lucide-building2` | ✅ PASS |

### P1: Revisão cobra foto em cada quarto

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| IF algum quarto tem 0 fotos WHEN envia para revisão THEN 422 "Cadastre ao menos 1 foto em: {nomes}" na ordem de cadastro, separados por vírgula e espaço, e o status não muda | "Standard", then "Standard, Luxo"; status stays DRAFT | `e2e/room-photos.spec.ts:112` - `toBe(422)`; `:113` - `toBe("Cadastre ao menos 1 foto em: Standard")`; `:119` - `toBe("DRAFT")`; `:126` - `toBe("Cadastre ao menos 1 foto em: Standard, Luxo")` | ✅ PASS |
| WHEN todo quarto tem ao menos 1 foto e o hotel já cumpre quarto, foto e capa THEN status IN_REVIEW | Submit succeeds and status is IN_REVIEW | `e2e/room-photos.spec.ts:134` - `sent.ok` true; `:138` - `toBe("IN_REVIEW")` | ✅ PASS |
| WHILE existir quarto sem foto THEN checklist "Foto em cada quarto" pendente | Step label visible in the incomplete checklist style | `e2e/room-photos.spec.ts:246` - link "Foto em cada quarto"; `:248` - `toHaveClass(/text-muted-foreground/)` | ✅ PASS |
| WHILE todo quarto tem ao menos 1 foto THEN "Foto em cada quarto" concluído | Same step in the completed checklist style | `e2e/room-photos.spec.ts:252` - `toHaveClass(/text-success/)` | ✅ PASS |

The spec names the step and the two states. It does not name a CSS class. `HotelSetupChecklist` binds `text-success` when `done` and `text-muted-foreground` otherwise (`apps/extranet/src/components/hotels/hotel-setup-checklist.tsx:68`). The assertions target those two states. This is not a spec-precision gap.

### P1: Admin vê as fotos do quarto

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o admin abre o dossiê THEN listar, dentro de cada quarto, as fotos com a capa primeiro | Two images: alt "Foto antiga" first (promoted cover), "Capa da suíte" second | `e2e/room-photos.spec.ts:287` - `toHaveCount(2)`; `:288` - `nth(0)` alt "Foto antiga"; `:289` - `nth(1)` alt "Capa da suíte" | ✅ PASS |
| IF uma foto do quarto não carrega THEN ícone de prédio, sem texto | No img, building icon, empty text | `e2e/room-photos.spec.ts:305` - img count 0; `:306` - building icon visible; `:307` - `toHaveText("")` | ✅ PASS |
| IF o quarto não tem foto THEN o mesmo ícone, sem texto | No img, building icon, empty text | `e2e/room-photos.spec.ts:298` - img count 0; `:299` - building icon visible; `:300` - `toHaveText("")` | ✅ PASS |
| O dossiê não renderiza controle de enviar, definir capa ou excluir foto de quarto | No buttons inside the room card | `e2e/room-photos.spec.ts:274` - photographed room `getByRole("button").toHaveCount(0)`; `:301` - empty room button count 0 | ✅ PASS |

**Status**: ✅ All 26 ACs covered

---

## Edge Cases

- [x] Excluir a única foto deixa o quarto sem capa e o checklist volta a pendente. `e2e/room-photos.spec.ts:467` - "Principal" count 0; `:470` - checklist `text-muted-foreground`
- [x] Foto para quarto de outro hotel responde 404. `e2e/room-photos.spec.ts:487` - `toBe(404)`
- [x] Falha de storage mostra "Foto não enviada" e não grava. `e2e/room-photos.spec.ts:508` - `getByText("Foto não enviada")`; `:509` - `toHaveLength(0)`

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `apps/admin/src/app/hotels/[id]/page.tsx:349` | `room.images.map` became `room.images.slice(0, 1).map`, so the dossier rendered only the cover | ✅ Killed |

Playwright loads the live admin server on port 3001, so the mutant was written into the live file. Both the client chunk and the server bundle contained `room.images.slice(0, 1).map` before the test. `npx playwright test e2e/room-photos.spec.ts -g FOTO-09 --retries=0` failed at `e2e/room-photos.spec.ts:287`: expected 2 images, received 1. `git checkout -- apps/admin/src/app/hotels/[id]/page.tsx` ran immediately after. No stash. Landing files were not reverted. The restored source is `room.images.map`, and the served admin bundle no longer contains the slice.

**Sensor depth**: lightweight, one mutation, as set for this iteration
**Sensor**: 1 injected, 1 killed, 0 survived

---

## Interactive UAT Results

Not performed. This iteration is an automated re-verify. The pass rule was the spec-anchored check plus the FOTO-09 sensor.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Gallery, picker and admin thumbnails follow the hotel photo pattern |
| Surgical changes | ✅ Room photos, review block, checklist step, admin read-only gallery |
| No scope creep | ✅ No guest app, no drag reorder, no editable captions |
| Matches patterns | ✅ Presign, register, primary, delete, toasts and building placeholder |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ e2e, per the matrix. Schema and shared constants are build-gated |
| Every test maps to a spec requirement - no unclaimed tests | ✅ 11 tests map to FOTO-01..FOTO-12 or the three edge cases |
| Documented guidelines followed: none - strong defaults applied (`tasks.md`) | ✅ |

The three `expect` lines removed since `86564db` were replaced by stricter checks: named photos, a single cover, and the cover in the first card. Test count went from 0 to 6 to 11. Nothing was weakened or skipped.

---

## Gate Check

- **Gate command**: `npx tsc --noEmit -p apps/api/tsconfig.json && npx tsc --noEmit -p apps/extranet/tsconfig.json && npx tsc --noEmit -p apps/admin/tsconfig.json && PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test e2e/room-photos.spec.ts`
- **Result**: 11 passed, 0 failed, 0 skipped. `tsc` exit 0 on api, extranet and admin. Playwright exit 0.
- **Test count before feature** (`9183d88`, file absent): 0
- **Test count after feature** (`107d4b2`): 11
- **Delta**: +11
- **Skipped tests**: none
- **Failures**: none on the unmutated tree

---

## Fix Plans

None.

---

## Requirement Traceability

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| FOTO-01 | Verified | ✅ Verified |
| FOTO-02 | Verified | ✅ Verified |
| FOTO-03 | Verified | ✅ Verified |
| FOTO-04 | Verified | ✅ Verified |
| FOTO-05 | Verified | ✅ Verified |
| FOTO-06 | Verified | ✅ Verified |
| FOTO-07 | Verified | ✅ Verified |
| FOTO-08 | Verified | ✅ Verified |
| FOTO-09 | Verified | ✅ Verified |
| FOTO-10 | Verified | ✅ Verified |
| FOTO-11 | Verified | ✅ Verified |
| FOTO-12 | Verified | ✅ Verified |

`spec.md` was left unchanged. Its statuses were already Verified, and this pass did not need an edit.

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 26/26 ACs matched the spec outcome. 0 spec-precision gaps.
**Sensor**: 1/1 mutations killed
**Gate**: 11 passed, 0 failed, 0 skipped

**What works**: Room photos from 1 to 8, cover, delete, create and edit, the review list, the checklist, and the admin dossier with every photo, cover first, and no edit controls.

**Issues found**: none

**Next steps**: none. Clean pass, so no lesson was recorded.
