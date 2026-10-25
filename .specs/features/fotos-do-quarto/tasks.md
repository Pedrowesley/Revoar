# Fotos do quarto Tasks

**Design**: `.specs/features/fotos-do-quarto/design.md`  
**Status**: Done

## Test Coverage Matrix

> Guidelines found: none - strong defaults applied. O repo só tem Playwright.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Schema | none | build gate | `packages/database/prisma/schema.prisma` | `npm run db:generate` |
| API de fotos do quarto | e2e | Limite, revisão e leitura no admin | `e2e/room-photos.spec.ts` | `npx playwright test e2e/room-photos.spec.ts` |
| Telas criar, editar, lista e checklist | e2e | CRUD da foto e o passo do checklist | `e2e/room-photos.spec.ts` | `npx playwright test e2e/room-photos.spec.ts` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tipo de um app | `npx tsc --noEmit -p apps/api/tsconfig.json` |
| Full | e2e | `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test e2e/room-photos.spec.ts` |
| Build | Schema e fechamento | `npm run db:generate && npx tsc --noEmit -p apps/api/tsconfig.json && npx tsc --noEmit -p apps/extranet/tsconfig.json && npx tsc --noEmit -p apps/admin/tsconfig.json` |

## Execution Plan

### Phase 1: Fotos do quarto

```
T1 → T2 → T3 → T4 → T5 → T6
```

## Task Breakdown

### T1: Tabela da foto do quarto

**What**: Modelo `RoomImage` com cascata a partir do quarto.
**Where**: `packages/database/prisma/schema.prisma`
**Depends on**: None
**Reuses**: `HotelImage`
**Requirement**: FOTO-01

**Done when**:

- [x] A migration `add_room_images` aplica
- [x] Build gate passa

**Tests**: none
**Gate**: build

---

### T2: Teto de 8 fotos

**What**: Constantes do limite e das mensagens no pacote compartilhado.
**Where**: `packages/shared/src/schemas/image.schema.ts`
**Depends on**: T1
**Reuses**: `MAX_IMAGE_SIZE_BYTES`
**Requirement**: FOTO-03, FOTO-04

**Done when**:

- [x] `MAX_ROOM_IMAGES` é 8
- [x] Build gate passa

**Tests**: none
**Gate**: build

---

### T3: API da galeria e da revisão

**What**: Presign, registro, capa, exclusão, capa na lista e bloqueio da revisão.
**Where**: `apps/api/src/extranet/hotels/room-images.service.ts`
**Depends on**: T2
**Reuses**: `ImagesService`
**Requirement**: FOTO-01, FOTO-02, FOTO-03, FOTO-05, FOTO-06, FOTO-07

**Done when**:

- [x] A 9ª foto responde 422 com "Este quarto já tem 8 fotos."
- [x] A revisão responde 422 com "Cadastre ao menos 1 foto em: {nomes}"
- [x] Full gate passa

**Tests**: e2e
**Gate**: full

---

### T4: Criar e editar com a galeria

**What**: Seletor no criar, galeria no editar, toasts de sucesso e erro.
**Where**: `apps/extranet/src/components/rooms/room-photo-gallery.tsx`
**Depends on**: T3
**Reuses**: `photo-gallery.tsx`
**Requirement**: FOTO-01, FOTO-02, FOTO-04, FOTO-05, FOTO-10, FOTO-11

**Done when**:

- [x] Criar com foto abre a edição com a capa
- [x] Editar define capa e exclui com confirmação
- [x] Full gate passa

**Tests**: e2e
**Gate**: full

---

### T5: Lista e checklist

**What**: Capa na lista de quartos e passo "Foto em cada quarto".
**Where**: `apps/extranet/src/app/hotels/[id]/rooms/page.tsx`
**Depends on**: T4
**Reuses**: `HotelSetupChecklist`
**Requirement**: FOTO-08, FOTO-12

**Done when**:

- [x] A lista mostra a capa
- [x] O passo fica pendente sem foto e concluído com foto
- [x] Full gate passa

**Tests**: e2e
**Gate**: full

---

### T6: Galeria no admin

**What**: Fotos dentro do card do quarto, só leitura, com ícone se a imagem falhar.
**Where**: `apps/admin/src/app/hotels/[id]/page.tsx`
**Depends on**: T5
**Reuses**: `PhotoPlaceholder`
**Requirement**: FOTO-09

**Done when**:

- [x] O dossiê mostra a foto e nenhum botão no card do quarto
- [x] Full gate passa

**Tests**: e2e
**Gate**: full
