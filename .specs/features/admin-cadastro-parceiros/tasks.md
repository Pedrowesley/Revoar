# Tasks — Extranet Cadastro Parceiros (Release 0.0)

**Estimativa original:** 6–8 semanas  
**Status:** ✅ Fases 0–6 concluídas (Jun/2026)  
**Validação:** `validation.md` · **Entrega:** `../../../RELEASE-0.0.md`

---

## Fase 0 — Setup ✅

| # | Task | Verificação | Status |
|---|------|-------------|--------|
| T0.1 | Monorepo: `apps/extranet`, `apps/admin`, `apps/api`, `packages/*` | `npm run build` OK | ✅ |
| T0.2 | Docker Compose: PostgreSQL + LocalStack S3 | Healthcheck OK | ✅ |
| T0.3 | Prisma schema completo | migrate OK | ✅ |
| T0.4 | Seed: 1 admin + 1 partner ACTIVE + 1 hotel exemplo | seed OK | ✅ |
| T0.5 | NestJS: modules auth, partners, hotels, rooms, images | `/health` 200 | ✅ |
| T0.6 | UI base extranet e admin (Tailwind) | localhost OK | ✅ |

---

## Fase 1 — Auth parceiro ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T1.1 | `POST /extranet/auth/signup` | EXT-AUTH-01 | ✅ |
| T1.2 | `POST /extranet/auth/login` — JWT partner | EXT-AUTH-01 | ✅ |
| T1.3 | Extranet UI: `/signup`, `/login` | EXT-AUTH-01 | ✅ |
| T1.4 | PartnerJwtGuard — isolamento por partnerId | EXT-AUTH-01 | ✅ |

---

## Fase 2 — Hotel parceiro ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T2.1 | CRUD hotel API extranet | EXT-HOTEL-01 | ✅ |
| T2.2 | UI wizard hotel (dados + endereço) | EXT-HOTEL-01 | ✅ |
| T2.3 | UI `/hotels` listagem "Meus hotéis" | EXT-LIST-01 | ✅ |

---

## Fase 3 — Quartos completos ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T3.1 | CRUD RoomType API — campos completos + amenities | EXT-ROOM-01 | ✅ |
| T3.2 | UI tab Quartos no hotel | EXT-ROOM-01 | ✅ |
| T3.3 | Validação: submit bloqueado sem ≥1 quarto | EXT-ROOM-01 | ✅ |
| T3.4 | Reordenar quartos (sortOrder) | — | ⏭️ P2 skip |

---

## Fase 4 — Fotos + Submit ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T4.1 | S3 presign + register HotelImage | EXT-PHOTO-01 | ✅ |
| T4.2 | UI galeria + foto principal | EXT-PHOTO-01 | ✅ |
| T4.3 | `POST .../submit` — validações completas | EXT-REVIEW-01 | ✅ |
| T4.4 | Bloqueio edição campos críticos em IN_REVIEW | EXT-REVIEW-01 | ✅ |

---

## Fase 5 — Admin moderação ✅

| # | Task | Reqs | Status |
|---|------|------|--------|
| T5.1 | Admin auth login | ADM-AUTH-01 | ✅ |
| T5.2 | Aprovar/rejeitar Partner PENDING | ADM-APPROVE-01 | ✅ |
| T5.3 | Aprovar/rejeitar Hotel IN_REVIEW | ADM-APPROVE-01 | ✅ |
| T5.4 | Admin UI: filas + preview hotel/quartos/fotos | ADM-APPROVE-01 | ✅ |
| T5.5 | HotelStatusHistory em transições | ADM-APPROVE-01 | ✅ |

---

## Fase 6 — Qualidade + Deploy ⚠️ parcial

| # | Task | Verificação | Status |
|---|------|-------------|--------|
| T6.1 | E2E: signup → hotel → quartos → fotos → submit → admin approve | Passa CI | ✅ |
| T6.2 | E2E: parceiro PENDING não consegue submit | Passa | ✅ |
| T6.3 | Notificações e-mail (Resend) | E-mail real staging | ⚠️ Stub (console sem API key) |
| T6.4 | Deploy staging acessível para sócios | URLs públicas | ❌ Docker local only |
| T6.5 | README + DEVELOPMENT onboarding | Novo dev < 30 min | ✅ |

---

## Dependências

```
T0.* → T1.* → T2.* → T3.* → T4.* → T5.* → T6.*
```

---

## Definition of Done — Release 0.0

### Software (entregue)

- [x] Parceiro se cadastra na extranet e cadastra hotel + quartos + fotos
- [x] Parceiro envia para revisão; admin aprova → ACTIVE
- [x] Quartos com descrição, camas, amenities — prontos para exibição ao viajante
- [x] E2E + CI cobrindo fluxo principal
- [x] Documentação de handoff (`RELEASE-0.0.md`, `validation.md`, STATE atualizado)

### Negócio / operação (pendente)

- [ ] ≥ 10 hotéis piloto cadastrados via extranet
- [ ] Deploy staging acessível para sócios (URL pública)
- [ ] E-mail transacional em ambiente staging real

---

## Próximo passo imediato

**Release 0.1** — criar nova spec em `.specs/features/` para busca pública read-only.  
Ver `.specs/STATE.md` e `docs/09-roadmap/fase-09-roadmap.md`.
