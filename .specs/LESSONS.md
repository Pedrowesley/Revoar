# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - When asserting a link must be absent, match every host and port form of the target (localhost, 127.0.0.1, env URL), not one literal prefix or label
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: landing-publica
- evidence: e2e/landing.spec.ts:123 (M7) (e2e)
- last seen: 2026-10-24T23:32:30Z

### L-002 - When a spec states relative placement (above/below), assert it with bounding boxes, not just visibility
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: landing-publica
- evidence: e2e/landing.spec.ts:35 (M8) (e2e)
- last seen: 2026-10-24T23:32:30Z

### L-003 - Assert the toast title and the body string the spec names, not the title alone.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: e2e/room-photos.spec.ts:152 (M5) (e2e)
- last seen: 2026-10-25T03:59:17Z

### L-004 - After deleting the cover, assert which photo is primary, not only the delete toast or that some image remains.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: apps/api/src/extranet/hotels/room-images.service.ts:111 (M6) (e2e)
- last seen: 2026-10-25T03:59:17Z

### L-005 - Assert the on-screen limit refusal as well as the API status and message.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: FOTO-03 (e2e)
- last seen: 2026-10-25T03:59:17Z

### L-006 - Assert file type and size refusals with the spec exact toast text, not only the happy-path upload.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: FOTO-04 (e2e)
- last seen: 2026-10-25T03:59:17Z

### L-007 - Assert upload, cover change, and delete are refused when the parent is not editable, not only the draft path.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `api` · harmful: 0
- features: fotos-do-quarto
- evidence: FOTO-06 (api)
- last seen: 2026-10-25T03:59:17Z

### L-008 - Assert the success status transition, not only the error that blocks it.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `api` · harmful: 0
- features: fotos-do-quarto
- evidence: FOTO-07 (api)
- last seen: 2026-10-25T03:59:17Z

### L-009 - Assert the title and the body of a compound toast on the action that should show that pair.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: e2e/room-photos.spec.ts:334 (e2e)
- last seen: 2026-10-25T04:24:44Z

### L-010 - Assert the named placeholder icon and that the placeholder itself contains no text.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: e2e/room-photos.spec.ts:300 (e2e) (+1 more)
- last seen: 2026-10-25T04:24:44Z

### L-011 - When a spec lists every item with one ordered first, assert the full set and that order, not only the first item.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: apps/admin/src/app/hotels/[id]/page.tsx:349 (e2e)
- last seen: 2026-10-25T13:26:36Z

### L-012 - When a spec lists every item with one ordered first, assert the full set and that order, not only the first item.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: fotos-do-quarto
- evidence: e2e/room-photos.spec.ts:286 (e2e)
- last seen: 2026-10-25T13:26:36Z

### L-013 - When a spec allows editing several surfaces, assert each surface, not only the first form that becomes enabled.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: ajuste-hotel-ativo
- evidence: AJUS-02 (e2e)
- last seen: 2026-10-25T16:01:49Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
