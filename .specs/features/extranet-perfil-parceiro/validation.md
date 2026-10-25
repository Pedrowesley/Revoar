# extranet-perfil-parceiro Validation

**Date**: 2026-10-25
**Iteration**: 2
**Spec**: `.specs/features/extranet-perfil-parceiro/spec.md`
**Diff range**: `683c1db^..52beece` (`git log --oneline -15` confirms `52beece` at the tip and `683c1db` inside the range)
**Verifier**: independent sub-agent (author ≠ verifier)

**Result**: PASS

16 of 16 acceptance criteria match a spec outcome at a `file:line`. The full gate passed. Three live mutants were killed. The sensor files were restored. `spec.md` was not edited.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `avatarUrl`, `logoUrl`, `detailsConfirmedAt` with `@map` |
| T2 | ✅ Done | `updatePartnerProfileSchema` is `.strict()` at `packages/shared/src/schemas/profile.schema.ts:13` |
| T3 | ✅ Done | `partner.profile.updated` is in the event union |
| T4 | ✅ Done | Presign key stays under `partners/{partnerId}/` |
| T5 | ✅ Done | Update, presign, confirm, and the admin event |
| T6 | ✅ Done | Partner JWT routes; admin token receives 401 |
| T7 | ✅ Done | `GET /extranet/auth/me` returns the three new fields |
| T8 | ✅ Done | Unknown id returns 404; pending rows include `detailsConfirmed` |
| T9 | ✅ Done | Partner token on `GET /admin/partners/:id` receives 401 |
| T10 | ✅ Done | Four sections; fiscal fields have no inputs |
| T11 | ✅ Done | Meu perfil and Sair |
| T12 | ✅ Done | Dashboard card links to `/profile` |
| T13 | ✅ Done | Admin sheet has no inputs and no Confirmar |
| T14 | ✅ Done | Pending row shows Não confirmou and links the name |
| T15 | ✅ Done | Hotel dossier links the partner name |
| T16 | ✅ Done | Open sheet refreshes on `partner.profile.updated` |
| T17 | ✅ Done | `e2e/partner-profile.spec.ts` covers PROF-01 through PROF-10 |

No task is blocked. Every done box in `tasks.md` is checked.

---

## Spec-Anchored Acceptance Criteria

### P1: Parceiro revisa e confirma a própria ficha

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o parceiro autenticado abre `/profile` THEN mostrar nome, e-mail, avatar, razão social, CNPJ, nome fantasia, logo, telefone, responsável e o estado de confirmação | Those ten facts are visible, including the exact text "Ainda não confirmou" | `e2e/partner-profile.spec.ts:309` - `getByText("Fila E2E", { exact: true })`; `:310` - email; `:311` - avatar `toHaveAttribute("src", pendingAvatar)`; `:312` - razão social; `:314` - `CNPJ ${formatCnpj(...)}`; `:315` - nome fantasia exact; `:316` - logo `src`; `:317` - `Telefone: ${formatPhone("11999990000")}`; `:318` - `Responsável: Fila E2E`; `:319` - `getByText("Ainda não confirmou")` | ✅ PASS |
| WHEN o parceiro salva nome, nome fantasia, telefone ou responsável THEN persistir só esses campos e gravar `detailsConfirmedAt` nulo | Saved values match, fiscal fields stay, `detailsConfirmedAt` is null | `e2e/partner-profile.spec.ts:143` - `saved.data.name` `toBe(nextName)`; `:144` - `tradeName`; `:145` - `phone`; `:146` - `contactName`; `:147` - `detailsConfirmedAt` `toBeNull()`; `:148` - `legalName` unchanged; `:149` - `email` unchanged; `:150` - `cnpj` unchanged; `:153`–`:159` reread the same values, including `detailsConfirmedAt` `toBeNull()` | ✅ PASS |
| Recusar alteração de e-mail, razão social e CNPJ com HTTP 400 | HTTP 400, and the other fields in that body are not written | `e2e/partner-profile.spec.ts:108` - `blocked.ok` `toBe(false)`; `:109` - `blocked.status` `toBe(400)`; `:110` - phone stays `me.body.partner.phone`. The body sends `cnpj`. E-mail and razão social are unknown keys on the same `.strict()` object; removing `.strict()` made this assertion fail | ✅ PASS |
| WHEN envia avatar ou logo JPG, PNG ou WebP de até 5MB THEN gravar a URL no parceiro, fora das fotos de hotel, e zerar `detailsConfirmedAt` | URL stored on the partner, key under `partners/{id}/` and not `hotels/`, confirmation null | `e2e/partner-profile.spec.ts:157` - `avatarUrl` `toBe(avatarUrl)`; `:158` - `logoUrl` `toBe(logoUrl)`; `:159` - `detailsConfirmedAt` `toBeNull()`; `:193` - key `startsWith(partners/${partnerId}/avatar/)`; `:194` - `includes("hotels/")` `toBe(false)`; `:195` - `endsWith(".png")`. Presign is PNG at 1200 bytes | ✅ PASS |
| IF o arquivo não é JPG, PNG ou WebP ou passa de 5MB THEN HTTP 400 e manter a URL anterior | HTTP 400, the exact refusal strings, previous URLs unchanged | `e2e/partner-profile.spec.ts:169` - `gif.status` `toBe(400)`; `:170` - `gif.message` `toBe("Formato inválido. Use JPG, PNG ou WebP.")`; `:179` - `huge.status` `toBe(400)`; `:180` - `huge.message` `toBe("Arquivo deve ter no máximo 5MB")`; `:183` - `avatarUrl` `toBe(avatarUrl)`; `:184` - `logoUrl` `toBe(logoUrl)` | ✅ PASS |
| WHEN nome, telefone, responsável, avatar e logo estão preenchidos e o parceiro confirma THEN gravar `detailsConfirmedAt` com o instante atual | A confirmation timestamp, shown as "Confirmou em …" | `e2e/partner-profile.spec.ts:213` - `detailsConfirmedAt` `toEqual(expect.any(String))`; `:257` - `getByText(/Confirmou em/)` | ✅ PASS |
| IF falta nome, telefone, responsável, avatar ou logo THEN HTTP 422 e a lista dos campos ausentes | HTTP 422 and the missing names. This signup is missing the two photos | `e2e/partner-profile.spec.ts:102` - `early.status` `toBe(422)`; `:105` - `toEqual(expect.arrayContaining(["avatarUrl", "logoUrl"]))` | ✅ PASS |
| WHILE está em `/profile` THEN oferecer Pessoal, Empresa, Contato e Revisar, e o header oferecer Meu perfil e Sair | Four section links, Meu perfil, and Sair | `e2e/partner-profile.spec.ts:234` - link "Meu perfil"; `:236` - "Pessoal"; `:237` - "Empresa"; `:238` - "Contato"; `:239` - "Revisar"; `:259` - button "Sair" `toBeVisible()` | ✅ PASS |

### P1: Admin lê a mesma ficha

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| WHEN o admin abre `/partners/[id]` THEN mostrar avatar, logo, nome, e-mail, razão social, CNPJ, nome fantasia, telefone, responsável, status e a data ou "Ainda não confirmou" | That sheet, including the exact unconfirmed text and `Status: PENDING` | `e2e/partner-profile.spec.ts:335` - `getByText("Ainda não confirmou")`; `:336` - avatar `src`; `:337` - logo `src`; `:338` - `Fila E2E` exact; `:339` - email; `:340` - razão social; `:341` - `CNPJ: ${formatCnpj(...)}`; `:342` - `Nome fantasia: Pendente ${unique}`; `:343` - telefone; `:344` - `Responsável: Fila E2E`; `:345` - `Status: PENDING` | ✅ PASS |
| A tela do admin não renderiza inputs nem botão de confirmar | Input count 0 and no Confirmar button | `e2e/partner-profile.spec.ts:350` - `locator("input")` `toHaveCount(0)`; `:351` - button "Confirmar" `toHaveCount(0)` | ✅ PASS |
| WHEN o admin está em `/partners/pending` THEN cada linha mostra "Confirmou" ou "Não confirmou" | The unconfirmed row shows the exact label "Não confirmou" | `e2e/partner-profile.spec.ts:328` - `row.getByText("Não confirmou")` | ✅ PASS |
| WHEN o admin abre um hotel THEN o nome do parceiro linka para `/partners/[id]` | href is `/partners/{partnerId}` | `e2e/partner-profile.spec.ts:360` - link `me.body.partner.legalName` `toHaveAttribute("href", /partners/${partnerId})` | ✅ PASS |
| IF o id não existe THEN HTTP 404 | 404 | `e2e/partner-profile.spec.ts:281` - `missing.status` `toBe(404)` | ✅ PASS |
| IF o token não é de admin THEN HTTP 401 | 401 | `e2e/partner-profile.spec.ts:276` - partner token on `/admin/partners/${partnerId}` `toBe(401)` | ✅ PASS |
| WHEN o parceiro confirma ou altera dados ou foto THEN emitir `partner.profile.updated` e a ficha aberta atualizar sem F5 | Open sheet shows the new responsável, and the SSE payload names that partner | `e2e/partner-profile.spec.ts:349` - `getByText("Responsável: Resp Ao Vivo")` with no reload; `:377` - stream text `includes("partner.profile.updated")`; `:388` - `payload` `toContain("partnerId":"${partnerId}")` | ✅ PASS |
| WHEN o admin aprova na ficha de um parceiro PENDING THEN a mesma transição da fila | Status becomes ACTIVE and Aprovar leaves | `e2e/partner-profile.spec.ts:353` - `getByText("ACTIVE")`; `:354` - button "Aprovar" `toHaveCount(0)` | ✅ PASS |

**Status**: ✅ All ACs covered (16/16)

---

## Edge Cases

- [x] Body with `cnpj` returns HTTP 400 and does not write `phone`. `e2e/partner-profile.spec.ts:109` and `:110`. `legalName`, `email`, and `status` are unknown keys on the same `.strict()` object. The sensor proved that dropping `.strict()` turns this request into a success.
- [x] A photo URL outside `partners/{partnerId}/` returns HTTP 400 and does not write `phone`. `e2e/partner-profile.spec.ts:119` and `:120`.
- [x] `detailsConfirmedAt` null shows "Ainda não confirmou" on the extranet (`e2e/partner-profile.spec.ts:319`) and on the admin (`e2e/partner-profile.spec.ts:335`).
- [x] Presign for another `partnerId` returns HTTP 403. `e2e/partner-profile.spec.ts:204`.

---

## Discrimination Sensor

Live tree, one file at a time. Playwright hits localhost, so a scratch worktree cannot see the fault. Baseline `git status --porcelain` was recorded before the first edit. Restore was `git checkout --` of that file only. No stash. Landing files were not touched.

The API loads `@revoar/shared` from `dist`. After the schema edit, `npm run build -w @revoar/shared` ran, then the live Nest process logged `Nest application successfully started`. After the schema restore, shared was rebuilt and `dist` again has `.strict()` on `updatePartnerProfileSchema`.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `packages/shared/src/schemas/profile.schema.ts:13` | Removed `.strict()` from `updatePartnerProfileSchema` | ✅ Killed. `e2e/partner-profile.spec.ts:108` - `expect(blocked.ok).toBe(false)` received `true` |
| 2 | `apps/api/src/extranet/profile/partner-profile.service.ts:13` | Dropped `avatarUrl` from `REQUIRED_FIELDS` | ✅ Killed. `e2e/partner-profile.spec.ts:105` - `expect(missing).toEqual(expect.arrayContaining(["avatarUrl", "logoUrl"]))` received `["logoUrl"]` |
| 3 | `apps/admin/src/app/partners/[id]/page.tsx:80` | Added an `<input>` on the sheet | ✅ Killed. `e2e/partner-profile.spec.ts:350` - `locator("input")` `toHaveCount(0)` received `1` |

**Sensor depth**: lightweight (the three faults named for this iteration)
**Result**: 3/3 killed - PASS

After restore, `REQUIRED_FIELDS` is `["name", "phone", "contactName", "avatarUrl", "logoUrl"]` at `apps/api/src/extranet/profile/partner-profile.service.ts:13`. The admin sheet has no `<input>`. A confirmation run of the same spec passed, 2 tests.

---

## Interactive UAT Results (if performed)

Not performed. This pass is the independent automated verifier. No human session was opened.

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
| Documented guidelines followed: `package.json` script `test:e2e` and the coverage matrix in `tasks.md`. No separate testing guide | ✅ |

Spot-check of PROF-01 to PROF-05: the first test asserts 422 with the missing photo names, HTTP 400 for `cnpj` and for a foreign photo URL, the exact GIF and 5MB messages, a PNG key outside `hotels/`, and a confirmation timestamp. The second test asserts the four sections, Sair, the full admin sheet, "Não confirmou", 401, 404, the live responsável update, and ACTIVE after Aprovar.

---

## Gate Check

- **Gate command**: `npm run test:e2e -- e2e/partner-profile.spec.ts` (run as `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test e2e/partner-profile.spec.ts`)
- **Result**: 2 passed, 0 failed, 0 skipped
- **Test count before feature**: `e2e/partner-profile.spec.ts` does not exist at `683c1db^` (0). The e2e suite at that commit has 29 tests.
- **Test count after feature**: 2 tests in `e2e/partner-profile.spec.ts`. The working-tree suite has 34 tests. The other three new tests belong to later features inside the same commit range (`password-reset`, `moderation-email`, `admin-directory`).
- **Delta**: +2 tests for this feature. No decrease. `52beece` adds assertions on top of `802e88a`. None were weakened.
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans (if issues found)

None.

---

## Requirement Traceability Update

`spec.md` was not edited. Statuses there are already Verified. This iteration agrees.

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| PROF-01 | Verified | ✅ Verified |
| PROF-02 | Verified | ✅ Verified |
| PROF-03 | Verified | ✅ Verified |
| PROF-04 | Verified | ✅ Verified |
| PROF-05 | Verified | ✅ Verified |
| PROF-06 | Verified | ✅ Verified |
| PROF-07 | Verified | ✅ Verified |
| PROF-08 | Verified | ✅ Verified |
| PROF-09 | Verified | ✅ Verified |
| PROF-10 | Verified | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 16/16 ACs matched spec outcome
**Sensor**: 3/3 mutations killed
**Gate**: 2 passed, 0 failed, 0 skipped

**What works**: The partner sheet shows every required fact, refuses fiscal edits and bad photos with the spec status and the spec strings, confirms when the five fields are present, and the admin sheet stays read-only, labels the pending row "Não confirmou", and updates the open responsável without a reload.

**Issues found**: none

**Next steps**: none for this feature
