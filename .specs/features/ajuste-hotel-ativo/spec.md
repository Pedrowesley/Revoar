# Ajuste de hotel ativo

**Feature ID:** `ajuste-hotel-ativo`  
**Scope:** Medium  
**Status:** Specified  
**Spec:** este arquivo  
**Design:** `.specs/features/ajuste-hotel-ativo/design.md`

---

## Problem Statement

Depois que a equipe Revoar aprova um hotel, a ficha trava. Se o endereço está errado ou falta a foto de um quarto, nem o parceiro nem o admin conseguem corrigir. O status Ativo não tem caminho de volta para a edição.

## Goals

- [ ] O parceiro de um hotel ativo pede o ajuste e volta a editar a ficha inteira
- [ ] A correção só volta a Ativo depois de uma nova aprovação
- [ ] O admin vê o hotel de novo na fila, com o histórico do pedido

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Cópia publicada enquanto o rascunho é editado | O app do hóspede ainda não existe; quando a busca existir, a versão no ar tem que permanecer até a nova aprovação |
| Admin editar os campos | O admin continua só lendo, aprovando e rejeitando |
| Hotel inativo | Nenhum fluxo hoje coloca o hotel em INACTIVE |
| Edição parcial sem nova revisão | Nome, endereço, quartos e fotos mudam o que foi aprovado |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem começa | O parceiro, no hotel ativo, com "Corrigir ficha" | Combina com o fluxo pedido: pedir ajuste, voltar para análise, aprovar de novo | y |
| Para onde vai | DRAFT na hora, com edição completa | Em análise só libera descrição, telefone e horários; a correção precisa de quartos e fotos | y |
| Volta ao ar | O parceiro envia de novo; o admin aprova e o status vira ACTIVE | A publicação continua sendo a ficha revisada | y |
| Rejeição da correção | REJECTED com motivo; o parceiro edita e envia outra vez | Reusa o caminho que já existe | y |
| Versão no ar durante o ajuste | Não há. O hotel deixa de estar ACTIVE até a nova aprovação | Não existe superfície pública lendo ACTIVE | y |

**Open questions:** none

---

## Stakeholders

| Field | Writer | Readers | Must not see | Rights | Confirmation state the reader sees |
| ----- | ------ | ------- | ------------ | ------ | ---------------------------------- |
| Pedido de correção e a ficha alterada | Parceiro | Parceiro na extranet; admin no dossiê e na fila | Futuro hóspede, nesta entrega | Parceiro edita em rascunho ou rejeitado; admin só aprova ou rejeita | Ativo mostra "Corrigir ficha". Depois do clique, rascunho editável. Em análise, o admin vê o hotel na fila. Aprovado volta a Ativo. Rejeitado mostra o motivo |

---

## User Stories

### P1: Parceiro abre a ficha publicada para corrigir ⭐ MVP

**User Story**: As a parceiro, I want to reopen an active hotel so that I can fix wrong or missing information.

**Why P1**: É o buraco que existe hoje.

**Acceptance Criteria**:

1. WHEN o parceiro aciona "Corrigir ficha" em um hotel ACTIVE THEN the system SHALL mudar o status para DRAFT, SHALL gravar no histórico ACTIVE → DRAFT com o ator PARTNER e SHALL mostrar a ficha editável
2. WHILE o hotel está em DRAFT por essa correção the system SHALL permitir editar dados, quartos e fotos com as mesmas regras do rascunho
3. IF o parceiro aciona "Corrigir ficha" e o hotel não está ACTIVE THEN the system SHALL responder 422 com "Só um hotel ativo pode entrar em correção." e SHALL NOT mudar o status
4. The system SHALL NOT oferecer "Corrigir ficha" em rascunho, em análise, rejeitado ou inativo

**Independent Test**: hotel ativo, clicar "Corrigir ficha", ver o selo Rascunho e conseguir abrir o formulário do quarto.

---

### P1: A correção passa por nova revisão ⭐ MVP

**User Story**: As an admin, I want the corrected hotel back in the review queue so that I approve it before it is active again.

**Why P1**: Sem isso, a correção publicaria sozinha.

**Acceptance Criteria**:

1. WHEN o parceiro envia a correção e a ficha cumpre as regras atuais de revisão THEN the system SHALL mudar o status para IN_REVIEW e SHALL mostrar o hotel na fila do admin
2. IF a correção falha uma regra atual, como quarto sem foto THEN the system SHALL responder 422 com a mensagem dessa regra e SHALL manter DRAFT
3. WHEN o admin aprova THEN the system SHALL mudar o status para ACTIVE
4. WHEN o admin rejeita com um motivo THEN the system SHALL mudar o status para REJECTED e SHALL mostrar esse motivo ao parceiro
5. WHEN o parceiro abre o dossiê THEN the system SHALL mostrar a linha de histórico ACTIVE → DRAFT

**Independent Test**: corrigir, enviar, ver o hotel na fila, aprovar e ver o selo Ativo de novo.

---

## Edge Cases

- WHEN o parceiro pede correção e não envia THEN the system SHALL manter o hotel em DRAFT
- IF o admin tenta aprovar um hotel que não está IN_REVIEW THEN the system SHALL recusar, como já faz hoje

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AJUS-01 | P1: Corrigir ficha leva a DRAFT | Execute | Verified |
| AJUS-02 | P1: Edição completa no rascunho | Execute | Verified |
| AJUS-03 | P1: Só hotel ativo entra em correção | Execute | Verified |
| AJUS-04 | P1: Reenvio usa as regras atuais | Design | Pending |
| AJUS-05 | P1: Aprovação e rejeição reusam o admin | Design | Pending |
| AJUS-06 | P1: Histórico mostra o pedido | Execute | Verified |

**Coverage:** 6 total, 4 mapped to tasks, 2 mapped to design.

---

## Success Criteria

- [ ] Um hotel ativo pode ser corrigido pelo parceiro
- [ ] A correção não volta a Ativo sem aprovação
- [ ] O admin não ganha tela nova
