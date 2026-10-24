# Validation — Release 0.0 (extranet-cadastro-parceiros)

**Data:** 2026-06-27  
**Verdict:** **PASS (condicional)** — requisitos P1 de software atendidos; DoD de negócio e deploy staging pendentes  
**Diff range:** Implementação completa fases 0–6 (monorepo inicial → E2E + CI)  
**Addendum:** Fase 7 (sync) validada em `.specs/features/sync-tempo-real/validation.md`  
**Verifier:** Revisão pós-implementação (handoff documental; author = implementador)

---

## Resumo

A Release 0.0 entrega o fluxo software end-to-end: parceiro cadastra-se, admin aprova parceiro, parceiro cadastra hotel/quartos/fotos, envia para revisão, admin aprova hotel → `ACTIVE`. E2E Playwright cobre o caminho feliz e o bloqueio de parceiro `PENDING` no submit.

Gaps documentados não bloqueiam o código local nem CI, mas impedem considerar o release **100% fechado para produção/negócio**.

---

## Verificação por Acceptance Criteria

| Req ID | AC resumido | Evidência | Resultado |
|--------|-------------|-----------|-----------|
| EXT-AUTH-01 | Signup PJ + login + PENDING não submit | `e2e/full-flow.spec.ts`, `e2e/pending-partner-submit.spec.ts`; `partner-auth.service.ts` | ✅ PASS |
| EXT-HOTEL-01 | CRUD hotel DRAFT, ViaCEP, slug | `apps/api/src/extranet/hotels/`; UI `/hotels/new` | ✅ PASS |
| EXT-ROOM-01 | Quartos completos + validação ocupação | `packages/shared` schemas; submit 422 sem quarto | ✅ PASS |
| EXT-PHOTO-01 | Upload S3 presign, principal única | `apps/api/src/storage/`; submit 422 sem foto | ✅ PASS |
| EXT-REVIEW-01 | Submit DRAFT→IN_REVIEW, rejeição→DRAFT | `hotels.service.ts` submit + admin reject | ✅ PASS |
| EXT-LIST-01 | Meus hotéis + filtro status | `/hotels` extranet | ✅ PASS |
| ADM-AUTH-01 | Login admin separado | `admin-auth` module; JWT distinto | ✅ PASS |
| ADM-APPROVE-01 | Aprovar/rejeitar parceiro e hotel | E2E full-flow; `HotelStatusHistory` | ✅ PASS |
| ADM-DASH-01 | Dashboard contadores + filas (P2) | `/dashboard` com pending counts | ✅ PASS (escopo mínimo P2) |

### Edge cases

| Caso | Esperado | Evidência | Resultado |
|------|----------|-----------|-----------|
| CNPJ duplicado | 409 | signup service + E2E implícito | ✅ PASS |
| Slug colisão | sufixo `-2`, `-3` | slug generator na API | ✅ PASS |
| Partner SUSPENDED login | 403 | `partner-auth.service.ts` | ✅ PASS (código) |
| Esqueci senha | e-mail reset P2 | — | ⏭️ SKIP (P2) |
| Upload falha retry | sem duplicar | — | ⚠️ Não testado E2E |

---

## Discrimination sensor (E2E)

Testes E2E devem falhar se comportamentos críticos forem removidos:

| Mutação hipotética | Teste que deveria falhar | Coberto? |
|--------------------|--------------------------|----------|
| Remover gate submit sem quarto | `pending-partner-submit` / submit validation | ✅ Parcial |
| Remover aprovação admin antes de submit | `full-flow.spec.ts` | ✅ |
| Parceiro PENDING consegue submit | `pending-partner-submit.spec.ts` | ✅ |
| Submit sem foto passa | `full-flow.spec.ts` (exige fotos) | ✅ |

**Gap sensor:** não há teste E2E para rejeição de hotel com motivo visível ao parceiro.

---

## Gates executados

| Gate | Comando / artefato | Resultado |
|------|-------------------|-----------|
| Build monorepo | `npm run build` | ✅ (verificado na implementação) |
| E2E local | `npm run test:e2e` | ✅ specs existem; CI configurado |
| CI | `.github/workflows/e2e.yml` | ✅ workflow presente |
| Migrations | `npm run db:migrate` | ✅ |
| Seed | `npm run db:seed` | ✅ |

---

## Gaps e débitos (ranked)

1. **Deploy staging público** — Docker staging local only; sem URL para sócios
2. **≥ 10 hotéis piloto** — meta operacional, não automatizada
3. **E-mail produção** — stub sem `RESEND_API_KEY`
4. **Reset senha** — P2 não implementado
5. **E2E rejeição hotel** — cenário não coberto
6. **Testes unitários** — ausentes (design mencionava Vitest)
7. **Fotos de quarto** — fora do escopo P1 confirmado

---

## Success Criteria (spec.md)

| Critério | Status |
|----------|--------|
| Parceiro cadastra hotel + quartos + fotos + submit em sessão | ✅ E2E full-flow |
| Admin aprova em poucos cliques | ✅ UI filas + E2E |
| Zero hotel ACTIVE sem quarto/foto/endereço | ✅ Validação submit |
| Dados de quarto prontos para Release 0.1 | ✅ Schema + UI completos |

---

## Conclusão

**PASS condicional** para entrega de software Release 0.0.  
Recomenda-se tratar itens 1–3 como trabalho operacional/infra antes de demo com sócios externos.

**Próximo passo de produto:** Release 0.1 — nova spec em `.specs/features/`.

**Addendum Jul/2026:** a Fase 7 (sync sem F5) não altera os ACs desta validação. Veredito próprio: `.specs/features/sync-tempo-real/validation.md` (PASS condicional — falta E2E duas origens).
