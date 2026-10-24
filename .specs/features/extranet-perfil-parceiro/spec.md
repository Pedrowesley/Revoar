# Perfil do parceiro — extranet e ficha no admin

**Feature ID:** `extranet-perfil-parceiro`  
**Scope:** Large  
**Status:** Specified (não implementado)  
**Decisão:** AD-011 em `.specs/STATE.md`  
**Spec:** este arquivo  
**Design:** `.specs/features/extranet-perfil-parceiro/design.md`  
**Tasks:** `.specs/features/extranet-perfil-parceiro/tasks.md`

---

## Problem Statement

O parceiro logado só vê um cartão no painel (CNPJ, responsável, e-mail). Não há foto, menu de conta nem um passo em que ele confirme que os dados estão certos. O admin, na fila de pendentes e no detalhe do hotel, vê ainda menos: sem telefone na lista, sem foto, sem saber se o parceiro revisou o cadastro. Aprovar nessas condições é decidir no escuro.

## Goals

- [ ] Parceiro abre `/profile`, vê e edita os dados permitidos, envia avatar e logo, e confirma a ficha
- [ ] Admin abre `/partners/[id]` e lê a mesma ficha, sem editar, inclusive o estado de confirmação
- [ ] Fila de pendentes mostra "Confirmou" ou "Não confirmou" e a ficha aberta atualiza sem F5

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Troca de e-mail | Não há verificação de e-mail |
| Edição de razão social ou CNPJ | Cadastro fiscal não muda por esta tela |
| Admin alterar dados ou fotos do parceiro | AD-011: admin só lê |
| Galeria de fotos do perfil | Duas imagens apenas: avatar e logo |
| Viajante ver o perfil | Release 0.1 ainda não tem site público |
| Vários usuários por parceiro | P2 já registrado na spec de cadastro |
| App do viajante | Fora do Release 0.0 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem é o perfil | PartnerUser logado mais o Partner da empresa | Decisão do plano; viajante fica de fora | y |
| Fotos obrigatórias para confirmar | Avatar e logo são exigidos no confirm | Os quatro checks de completude incluem as duas fotos | y |
| Status do parceiro não trava a edição | PENDING, ACTIVE e SUSPENDED podem editar e confirmar | Confirmação é precisão dos dados, não publicação | y |
| Aprovar na ficha | O admin aprova na fila e também na ficha | Quem abriu o dossiê não volta para a lista só para aprovar | y |
| Testes | Playwright e2e; sem runner unitário novo | O repo só tem `npm run test:e2e` | y |

**Open questions:** none

---

## Stakeholders

| Field | Writer | Readers | Must not see | Rights | Confirmation state the reader sees |
| ----- | ------ | ------- | ------------ | ------ | ---------------------------------- |
| Nome, avatar | Parceiro | Parceiro, admin | Viajante | Parceiro edita; admin só lê | Admin vê a foto e "Confirmou em …" ou "Ainda não confirmou" |
| E-mail de login, razão social, CNPJ | Cadastro (já gravado) | Parceiro, admin | Viajante | Os dois só leem | Os dois veem o valor; não entra no que a confirmação zera |
| Nome fantasia, telefone, responsável, logo | Parceiro | Parceiro, admin | Viajante | Parceiro edita; admin só lê | Depois de editar, os dois veem "Ainda não confirmou" até um novo confirm |

---

## User Stories

### P1: Parceiro revisa e confirma a própria ficha ⭐ MVP

**User Story**: As a parceiro logado, I want a profile with my photo, company logo, and a review step so that I can confirm the details the Revoar team will read.

**Why P1**: Sem essa ficha o admin não tem o que visualizar.

**Acceptance Criteria**:

1. WHEN o parceiro autenticado abre `/profile` THEN the system SHALL mostrar nome, e-mail, avatar, razão social, CNPJ, nome fantasia, logo, telefone, responsável e o estado de confirmação
2. WHEN o parceiro salva nome, nome fantasia, telefone ou responsável THEN the system SHALL persistir só esses campos e SHALL gravar `detailsConfirmedAt` como nulo
3. The system SHALL recusar alteração de e-mail, razão social e CNPJ com HTTP 400
4. WHEN o parceiro envia avatar ou logo JPG, PNG ou WebP de até 5MB THEN the system SHALL gravar a URL no próprio parceiro, fora das fotos de hotel, e SHALL zerar `detailsConfirmedAt`
5. IF o arquivo não é JPG, PNG ou WebP ou passa de 5MB THEN the system SHALL recusar com HTTP 400 e SHALL manter a URL anterior
6. WHEN nome, telefone, responsável, avatar e logo estão preenchidos e o parceiro marca a confirmação THEN the system SHALL gravar `detailsConfirmedAt` com o instante atual
7. IF falta nome, telefone, responsável, avatar ou logo THEN the system SHALL recusar a confirmação com HTTP 422 e a lista dos campos ausentes
8. WHILE o parceiro está em `/profile` the system SHALL oferecer as seções Pessoal, Empresa, Contato e Revisar, e o header SHALL oferecer Meu perfil e Sair

**Independent Test**: login `parceiro@revoar.com.br` → `/profile` → editar telefone → Revisar desconfirma → preencher fotos → confirmar → data visível.

---

### P1: Admin lê a mesma ficha ⭐ MVP

**User Story**: As a operador Revoar, I want the partner's photos and confirmation on a read-only page so that I approve with the same facts the partner confirmed.

**Why P1**: A fila atual não mostra foto nem confirmação.

**Acceptance Criteria**:

1. WHEN o admin autenticado abre `/partners/[id]` THEN the system SHALL mostrar avatar, logo, nome, e-mail, razão social, CNPJ, nome fantasia, telefone, responsável, status e a data de confirmação ou o texto "Ainda não confirmou"
2. The admin screen SHALL NOT render inputs nem botão de confirmar dados do parceiro
3. WHEN o admin está na fila `/partners/pending` THEN the system SHALL mostrar "Confirmou" ou "Não confirmou" em cada linha
4. WHEN o admin abre um hotel THEN the system SHALL linkar o nome do parceiro para `/partners/[id]`
5. IF o id não existe THEN the system SHALL responder HTTP 404
6. IF o token não é de admin THEN the system SHALL responder HTTP 401
7. WHEN o parceiro confirma ou altera dados ou foto THEN the system SHALL emitir `partner.profile.updated` para admins e a ficha aberta SHALL atualizar sem F5
8. WHEN o admin aprova na ficha de um parceiro PENDING THEN the system SHALL aplicar a mesma transição da fila

**Independent Test**: duas abas; parceiro confirma; admin em `/partners/[id]` vê a data sem recarregar.

---

## Edge Cases

- IF o body de PATCH inclui `legalName`, `cnpj`, `email` ou `status` THEN the system SHALL responder HTTP 400 e SHALL não gravar os outros campos do mesmo body
- IF a URL de foto não começa com o prefixo `partners/{partnerId}/` THEN the system SHALL responder HTTP 400
- WHEN `detailsConfirmedAt` é nulo THEN a extranet e o admin SHALL mostrar "Ainda não confirmou"
- IF o parceiro pede presign para outro `partnerId` THEN the system SHALL responder HTTP 403

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| PROF-01 | P1: Ficha do parceiro | Design | Pending |
| PROF-02 | P1: Edição e zerar confirmação | Design | Pending |
| PROF-03 | P1: Campos fiscais somente leitura | Design | Pending |
| PROF-04 | P1: Avatar e logo | Design | Pending |
| PROF-05 | P1: Confirmar | Design | Pending |
| PROF-06 | P1: Menu do perfil | Design | Pending |
| PROF-07 | P1: Ficha do admin | Design | Pending |
| PROF-08 | P1: Sinal na fila e link no hotel | Design | Pending |
| PROF-09 | P1: Sync sem F5 | Design | Pending |
| PROF-10 | P1: Aprovar a partir da ficha | Design | Pending |

**Coverage:** 10 total, 0 mapped to tasks until tasks.md is approved, 10 unmapped.

---

## Success Criteria

- [ ] Parceiro confirma a ficha em menos de 3 minutos a partir do painel
- [ ] Admin distingue "Confirmou" e "Não confirmou" sem abrir o banco
- [ ] Nenhuma rota desta feature aceita token do outro app
