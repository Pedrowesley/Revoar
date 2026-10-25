# Revoar — Project State

> **Para agentes Cursor:** leia este arquivo primeiro, depois `docs/12-jornada-completa/fase-12-jornada-completa.md` e `docs/11-area-do-cliente/fase-11-area-do-cliente.md`.

---

## Handoff

| Campo | Valor |
|-------|-------|
| **Feature ativa** | Fase 12 — jornada completa (plano). O hóspede já chega ao voucher em ambiente de teste |
| **Fase atual** | Fase 12. Release 0.0 e as fatias 1 a 4 da área do cliente já estão em código |
| **Próximo passo** | Fatia 1 da fase 12: ficha honesta (comodidades, quantidade, reembolso antes de cancelar, +10 min, novo PIX de teste) |
| **Última atualização** | 2026-10-25 |
| **Git** | `cursor/area-do-cliente-1644` em `github.com/Pedrowesley/Revoar` |

### O que já existe no disco

| Área | Local | Status |
|------|-------|--------|
| Master Plan | `docs/00-analise-de-mercado/` … `docs/12-jornada-completa/` | ✅ Fases 0–11 no desenho; fase 12 é o plano da jornada |
| Edição Sócios v2.0 | Fases 0, 1, 2, 8, 9 em `docs/` | ✅ |
| Monorepo apps | `apps/extranet`, `apps/admin`, `apps/api`, `apps/guest` | ✅ |
| Packages | `packages/database`, `packages/shared` | ✅ |
| Spec Release 0.0 | `.specs/features/admin-cadastro-parceiros/` | ✅ Atualizada |
| Spec Fase 7 (sync) | `.specs/features/sync-tempo-real/` | ✅ |
| Spec perfil do parceiro | `.specs/features/extranet-perfil-parceiro/` | ✅ spec/design/tasks e código na extranet e no admin |
| Área do hóspede | `apps/guest`, `docs/11-area-do-cliente/` | ✅ em código; pagamento em ambiente de teste |
| Jornada completa | `docs/12-jornada-completa/` | ✅ plano; nenhuma fatia desta fase está em código |
| Entrega consolidada | `RELEASE-0.0.md` | ✅ |
| UI moderna | AD-010 (`PageShell`, header autenticado) | ✅ |
| Sync UI | TanStack Query + polling + SSE | ✅ |
| Validação | `.specs/features/.../validation.md` | ✅ |
| Dev guide | `DEVELOPMENT.md` | ✅ |
| E2E + CI | `e2e/`, `.github/workflows/e2e.yml` | ✅ |
| PDF export | `scripts/export-pdfs.mjs` (`npm run pdf`) | ✅ Script; PDFs não commitados |
| Staging Docker | `docker-compose.staging.yml` | ✅ Local only |

### O que NÃO está feito

- Deploy staging em URL pública para sócios
- ≥ 10 hotéis piloto (operação manual)
- Gateway real de PIX e cartão (AD-022). O fluxo do hóspede confirma o pagamento em ambiente de teste
- Fatias 1 a 8 da fase 12: ficha honesta, e-mail da reserva, minhas viagens fora deste navegador, grade mensal e operação do pedido na extranet, admin da reserva, busca por estrelas, Mercado Pago, avaliações e mapa
- Vários usuários no mesmo parceiro
- E2E do sync duas origens (T7.19)
- EventBus Redis (só quando a API tiver >1 instância)

### Ordem de leitura (Cursor / novo dev)

1. `.specs/STATE.md` ← você está aqui
2. `docs/12-jornada-completa/fase-12-jornada-completa.md` — o que falta para a reserva operar
3. `docs/11-area-do-cliente/fase-11-area-do-cliente.md` — decisão da área do hóspede
4. `RELEASE-0.0.md`
5. `.specs/features/admin-cadastro-parceiros/spec.md`
6. `.specs/features/sync-tempo-real/spec.md`
7. `.specs/features/extranet-perfil-parceiro/spec.md` (código na extranet e ficha no admin)
8. `.specs/features/*/validation.md`
9. `DEVELOPMENT.md`
10. `.specs/features/*/design.md`
11. `docs/09-roadmap/fase-09-roadmap.md` (contexto de produto)

### Comandos essenciais

```bash
docker compose up -d
npm install && npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev          # extranet :3000, admin :3001, api :3002, hóspede :3003
npm run build
npm run test:e2e
```

**Seed:** admin@revoar.com.br / revoar123 · parceiro@revoar.com.br / revoar123

---

## Decisions

| ID | Decisão | Status | Data |
|----|---------|--------|------|
| AD-001 | **Inventário first:** cadastro de parceiros + hotéis antes do site público | active | 2026-06 |
| AD-002 | **Stack MVP:** monorepo — Next.js 15 + NestJS + Prisma + PostgreSQL | active | 2026-06 |
| AD-003 | **Anfitrião = Parceiro hoteleiro PJ** (CNPJ obrigatório) | active | 2026-06 |
| AD-004 | ~~Admin interno primeiro~~ | superseded by AD-007 | 2026-06 |
| AD-005 | Hotéis cadastrados manualmente têm `supplier_type = DIRECT` | active | 2026-06 |
| AD-006 | Release 0.0 → inventário cadastrado → Release 0.1 busca pública | active | 2026-06 |
| AD-007 | **Extranet self-service:** parceiro cadastra hotel, quartos e fotos; Revoar aprova via admin interno | active | 2026-06 |
| AD-008 | **Quartos no P1:** cadastro completo de room types com dados necessários para o viajante | active | 2026-06 |
| AD-009 | **Sync UI:** TanStack Query + polling condicional + SSE via `EventBusService`. WebSocket adiado para Release 0.5 (RF-028 reserva/PIX). | active | 2026-10 |
| AD-010 | **UI shell moderno** extranet/admin: header autenticado, Plus Jakarta Sans, tokens `#0E7490`, componentes `PageShell`/`Surface`/`Skeleton`/`EmptyState`/`Alert`, checklist de progresso do hotel | active | 2026-07 |
| AD-011 | **Perfil do parceiro:** a extranet grava avatar, logo e confirmação; o admin lê a mesma ficha e não a edita. Viajante não vê nesta entrega | active | 2026-10 |
| AD-012 | **Landing na `/` da extranet:** anfitrião com links reais (cadastro, login, painel); hóspede como prévia "Em breve" sem rota; admin fora da página; sem números inventados | active | 2026-10 |
| AD-013 | **CRUD inteiro:** cadastro novo cobre criar, ler, atualizar e excluir na mesma entrega, na tela de criar e na de editar | active | 2026-10 |
| AD-014 | **Correção de hotel ativo:** o parceiro reabre a ficha para rascunho, edita tudo e só volta a Ativo depois de nova aprovação. Sem cópia publicada nesta entrega | active | 2026-10 |
| AD-015 | **Área do cliente:** hotel e pousada de parceiro PJ. Casa inteira e anfitrião pessoa física ficam fora | active | 2026-10 |
| AD-016 | **Modo de fechamento** no hotel (`INSTANT` ou `REQUEST`), com override por tipo de quarto (`INHERIT`, `INSTANT`, `REQUEST`) | active | 2026-10 |
| AD-017 | **Quando cobra:** imediata cobra no checkout (hold 15 min). Sob consulta não cobra antes do aceite (24 h); depois do aceite, o hóspede paga em 2 h | active | 2026-10 |
| AD-018 | **Inventário da vitrine:** só `DIRECT` até o fluxo de reserva fechar. Bedbank fica depois | active | 2026-10 |
| AD-019 | **Uma reserva, um tipo de quarto e uma tarifa.** Quantidade do mesmo tipo. Tipos diferentes são reservas separadas | active | 2026-10 |
| AD-020 | **Preço do calendário é o preço do hóspede**, por quarto por noite, impostos inclusos. Sem taxa de plataforma e sem taxa de limpeza | active | 2026-10 |
| AD-021 | **Calendário:** o parceiro abre a noite para vender. Bloquear a noite, no dia inteiro ou em algumas unidades, com motivo de indisponível ou alugado fora, impede reserva imediata e sob consulta. Reserva já confirmada na plataforma não é cancelada pelo bloqueio | active | 2026-10 |
| AD-022 | **Jornada antes do banco:** PIX e cartão reais esperam a chave do Mercado Pago. Até lá o ambiente de teste permanece explícito na tela | active | 2026-10 |
| AD-023 | **Conta do hóspede opcional:** a viagem abre pelo código e pelo e-mail, e por um link enviado a esse e-mail | active | 2026-10 |
| AD-024 | **Parceiro opera a reserva:** prazo das 24 horas visível, motivo na recusa, confirmadas em leitura, aviso sem atualizar a página. A grade do mês substitui o formulário de intervalo | active | 2026-10 |
| AD-025 | **Admin da reserva:** busca, reenvio do voucher e cancelamento com motivo e auditoria. O admin não edita tarifa nem calendário do parceiro | active | 2026-10 |

---

## Roadmap revisado

```
Release 0.0  Extranet MVP + UI + sync sem F5 → ✅ (Jun–Out/2026)
Fatia 1      Tarifa, calendário e modo de reserva na extranet → ✅ em código
Fatia 2      Vitrine do hóspede (busca, ficha, escolha do quarto) → ✅ em código
Fatia 3      Reserva imediata + PIX/cartão de teste + voucher + cancelamento → ✅ em código (sandbox)
Fatia 4      Sob consulta (pedido, aceite, pagamento em 2 h) → ✅ em código (sandbox)
Fase 12      Jornada completa. Próximo trabalho: fatia 1, ficha honesta
             2 e-mail da reserva · 3 minhas viagens · 4 extranet (grade, motivo, 24 h)
             5 admin da reserva · 6 busca por estrelas · 7 Mercado Pago · 8 avaliações e mapa
```

Desenho da reserva, estados e preço: `docs/11-area-do-cliente/fase-11-area-do-cliente.md`.
O que falta para operar a jornada: `docs/12-jornada-completa/fase-12-jornada-completa.md`.

---

## Specs

| Feature | Spec | Design | Tasks | Validation | Status |
|---------|------|--------|-------|------------|--------|
| extranet-cadastro-parceiros | ✅ | ✅ | ✅ | ✅ | Release 0.0 — software complete (+ UI/RQ) |
| sync-tempo-real | ✅ | ✅ | ✅ | ✅ | Fase 7 — polling + SSE (PASS condicional, sem E2E sync) |
| extranet-perfil-parceiro | ✅ | ✅ | ✅ | — | Em código (AD-011): perfil na extranet, ficha somente leitura no admin. Reset de senha também está em código |
| landing-publica | ✅ | ✅ | ✅ | FAIL | Código no ar; validação com 2 testes frouxos por corrigir |
| fotos-do-quarto | ✅ | ✅ | ✅ | — | Implementada: até 8 fotos, CRUD no criar e editar, admin só leitura |
| ajuste-hotel-ativo | ✅ | ✅ | ✅ | — | Parceiro reabre o hotel ativo; volta a Ativo só com nova aprovação |
