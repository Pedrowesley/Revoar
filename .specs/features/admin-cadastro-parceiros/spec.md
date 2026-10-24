# Extranet — Cadastro de Parceiros, Hotéis e Quartos (Release 0.0)

**Feature ID:** `extranet-cadastro-parceiros`  
**Scope:** Large  
**Status:** Implemented (Release 0.0 — Jun/2026) · **Addendum:** Fase 7 sync (Jul/2026)  
**Versão:** 2.0 — Extranet + quartos P1  
**Validação:** `.specs/features/admin-cadastro-parceiros/validation.md`  
**Sync UI (sem F5):** `.specs/features/sync-tempo-real/spec.md`

---

## Problem Statement

A Revoar precisa de **inventário próprio** (hotéis direct) antes de abrir ao viajante. O parceiro hoteleiro (anfitrião PJ) deve **cadastrar-se e gerenciar** hotéis, quartos e fotos pela extranet — com todas as informações que o viajante precisa ver. A equipe Revoar **aprova** o conteúdo antes de publicar.

## Goals

- [x] Parceiro consegue se cadastrar, criar hotel + quartos + fotos e enviar para revisão em uma sessão
- [x] Quartos incluem dados completos para exibição futura ao viajante (capacidade, camas, comodidades, descrição)
- [x] Revoar aprova ou rejeita hotéis com rastreabilidade
- [x] Inventário ACTIVE pronto para Release 0.1 (busca pública) — dados no banco; site público ainda não existe

## Out of Scope

| Feature | Reason |
|---------|--------|
| Site público de reservas | Release 0.1 |
| Tarifas, calendário e disponibilidade | Release 0.5 |
| Integração Hotelbeds/Omnibees | Release 0.1 |
| Pagamentos | Release 0.5 |
| Múltiplos usuários por parceiro (equipe hotel) | P2 |
| App mobile | Futuro |
| Marketplace estilo Airbnb (PF) | AD-003 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|-----------------------|----------------|-----------|------------|
| Anfitrião = parceiro PJ com CNPJ | Sim | AD-003 | y |
| Cadastro self-service na extranet | Sim | Decisão sócios | y |
| Admin interno Revoar só para aprovação/moderação | Sim | Governança de qualidade | y |
| 1 usuário por parceiro no MVP | Sim | Simplicidade | y |
| Hotel precisa ≥1 quarto + ≥1 foto para revisão | Sim | Conteúdo mínimo viável | y |
| Fotos de quarto | P2 | Fotos do hotel P1; quarto P2 | n |

**Open questions:** none.

---

## User Stories — Extranet (Parceiro)

### P1: Cadastro e login do parceiro ⭐ MVP

**User Story:** Como parceiro hoteleiro, quero criar minha conta com CNPJ e fazer login para gerenciar meus hotéis.

**Acceptance Criteria:**

1. WHEN parceiro preenche razão social, CNPJ, e-mail, senha, telefone e responsável legal THEN system SHALL criar Partner (`PENDING`) + PartnerUser vinculado
2. WHEN CNPJ inválido ou duplicado THEN system SHALL rejeitar com mensagem clara
3. WHEN parceiro faz login com credenciais válidas THEN system SHALL redirecionar ao painel da extranet
4. WHEN Partner status é `PENDING` THEN parceiro SHALL poder cadastrar hotéis em DRAFT mas NÃO enviar para revisão até Partner ser `ACTIVE`
5. WHEN Revoar aprova parceiro THEN Partner status SHALL ser `ACTIVE` e parceiro recebe e-mail

**Independent Test:** Signup → login → painel visível; CNPJ dup → erro.

---

### P1: Cadastrar hotel ⭐ MVP

**User Story:** Como parceiro, quero cadastrar meu hotel com endereço, contatos, políticas e descrição para que viajantes entendam a propriedade.

**Acceptance Criteria:**

1. WHEN parceiro ACTIVE preenche nome, descrição, endereço (CEP, rua, cidade, UF), estrelas, check-in/out, telefone THEN system SHALL criar hotel `DRAFT` vinculado ao parceiro logado
2. WHEN CEP informado THEN system SHALL preencher cidade/UF via ViaCEP (editável)
3. WHEN hotel salvo THEN system SHALL gerar slug único
4. WHEN parceiro edita hotel THEN system SHALL persistir apenas hotéis do próprio parceiro (403 se outro)

**Independent Test:** Parceiro cria hotel → aparece em "Meus hotéis".

---

### P1: Cadastrar quartos com informações completas ⭐ MVP

**User Story:** Como parceiro, quero cadastrar tipos de quarto com todas as informações que o viajante precisa para escolher (capacidade, camas, comodidades, descrição).

**Acceptance Criteria:**

1. WHEN parceiro adiciona quarto THEN system SHALL exigir: nome, descrição, max_adults, max_children, max_occupancy, bed_configuration (ex: "1 cama king" ou "2 solteiros")
2. WHEN parceiro seleciona amenities THEN system SHALL persistir lista (Wi-Fi, ar-condicionado, TV, frigobar, banheiro privativo, varanda, etc.)
3. WHEN max_occupancy < max_adults + max_children THEN system SHALL rejeitar
4. WHEN parceiro informa size_sqm THEN system SHALL exibir opcionalmente na ficha futura
5. WHEN hotel tenta ir para IN_REVIEW sem ≥1 quarto THEN system SHALL bloquear

**Independent Test:** Cadastrar "Suíte Deluxe" com 2 adultos, amenities → salvo e listado no hotel.

---

### P1: Upload de fotos do hotel ⭐ MVP

**User Story:** Como parceiro, quero enviar fotos do hotel para o viajante visualizar a propriedade.

**Acceptance Criteria:**

1. WHEN parceiro faz upload JPG/PNG/WebP ≤ 5MB THEN system SHALL armazenar e exibir preview
2. WHEN parceiro define foto principal THEN system SHALL garantir apenas uma `is_primary`
3. WHEN hotel vai para IN_REVIEW sem ≥1 foto THEN system SHALL bloquear

**Independent Test:** 3 fotos → 1 principal → preview OK.

---

### P1: Enviar hotel para revisão ⭐ MVP

**User Story:** Como parceiro, quero enviar meu hotel completo para a Revoar aprovar e publicar.

**Acceptance Criteria:**

1. WHEN hotel tem endereço completo + ≥1 quarto + ≥1 foto + descrição THEN parceiro SHALL poder enviar para `IN_REVIEW`
2. WHEN enviado THEN parceiro SHALL ver status "Em análise" e não poder editar campos críticos (nome, endereço) até resposta
3. WHEN Revoar rejeita THEN status volta `DRAFT` com motivo visível ao parceiro
4. WHEN Revoar aprova THEN status `ACTIVE` e parceiro recebe e-mail

**Independent Test:** Fluxo DRAFT → IN_REVIEW → ACTIVE com e-mail.

---

### P1: Painel "Meus hotéis" ⭐ MVP

**User Story:** Como parceiro, quero ver todos os meus hotéis e status para acompanhar o cadastro.

**Acceptance Criteria:**

1. WHEN parceiro acessa painel THEN system SHALL listar apenas hotéis do parceiro logado
2. WHEN parceiro filtra por status THEN listagem SHALL refletir filtro

---

## User Stories — Admin Revoar (moderação)

### P1: Login admin Revoar ⭐ MVP

**User Story:** Como operador Revoar, quero acessar painel interno para aprovar parceiros e hotéis.

**Acceptance Criteria:**

1. WHEN operador login válido THEN acesso ao admin separado da extranet
2. WHEN operador aprova Partner PENDING THEN Partner → ACTIVE
3. WHEN operador aprova hotel IN_REVIEW THEN hotel → ACTIVE
4. WHEN operador rejeita THEN motivo obrigatório registrado

**Independent Test:** Admin aprova parceiro + hotel end-to-end.

---

### P2: Dashboard admin

**User Story:** Como gestor Revoar, quero ver fila de parceiros e hotéis pendentes de aprovação.

**Acceptance Criteria:**

1. WHEN admin abre dashboard THEN exibe contadores e fila IN_REVIEW / PENDING

---

## Edge Cases

- WHEN parceiro esquece senha THEN system SHALL enviar link reset (e-mail) — P2 se atrasar MVP
- WHEN slug colide THEN suffix `-2`, `-3`
- WHEN upload falha THEN retry sem duplicar
- WHEN parceiro SUSPENDED tenta login THEN 403 com mensagem

---

## Requirement Traceability

| ID | Story | Status | Evidência |
|----|-------|--------|-----------|
| EXT-AUTH-01 | P1: Cadastro/login parceiro | Implemented | `e2e/full-flow.spec.ts`, `apps/api/src/extranet/auth/` |
| EXT-HOTEL-01 | P1: Cadastrar hotel | Implemented | `apps/api/src/extranet/hotels/`, UI `/hotels/new` |
| EXT-ROOM-01 | P1: Cadastrar quartos completos | Implemented | RoomType CRUD + validação ocupação |
| EXT-PHOTO-01 | P1: Fotos hotel | Implemented | S3 presign + galeria `/hotels/[id]/photos` |
| EXT-REVIEW-01 | P1: Enviar revisão | Implemented | `POST .../submit`, edição parcial IN_REVIEW |
| EXT-LIST-01 | P1: Meus hotéis | Implemented | `/hotels` com filtro status |
| ADM-AUTH-01 | P1: Login admin | Implemented | `apps/api/src/admin/auth/` |
| ADM-APPROVE-01 | P1: Aprovar parceiro/hotel | Implemented | Admin filas + `HotelStatusHistory` |
| ADM-DASH-01 | P2: Dashboard | Implemented (mínimo) | Contadores + links em `/dashboard` |

---

## Success Criteria

- [x] Parceiro cadastra hotel + quartos + fotos e envia revisão em uma sessão (E2E `full-flow`)
- [x] Admin aprova em poucos cliques (filas + botões na UI)
- [x] Zero hotel ACTIVE sem quarto, foto e endereço completo (validação no submit)
- [x] Dados de quarto suficientes para página pública futura (Release 0.1)

## Fora do escopo desta entrega (documentado em RELEASE-0.0.md)

- Deploy staging público, ≥ 10 hotéis piloto, e-mail produção (Resend), reset senha, fotos de quarto

## Addendum — Fase 7 (Jul/2026)

A aprovação/rejeição/submit **não exige mais F5** na outra UI. Requisitos e evidências: feature `sync-tempo-real` (SYNC-UI-01 … SYNC-INV-01). Isto não altera os ACs desta spec — só o transporte de atualização.
