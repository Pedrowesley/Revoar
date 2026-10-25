# Fotos do quarto

**Feature ID:** `fotos-do-quarto`  
**Scope:** Large  
**Status:** Implemented  
**Spec:** este arquivo  
**Context:** `.specs/features/fotos-do-quarto/context.md`

---

## Problem Statement

O quarto só guarda texto. A foto fica no hotel, então o parceiro não mostra o quarto e o admin revisa a ficha sem ver o que o hóspede vai reservar. O envio para revisão também não cobra foto por quarto.

## Goals

- [ ] Cada quarto aceita de 1 a 8 fotos, com uma capa
- [ ] O parceiro recebe toast em sucesso, erro, limite e exclusão
- [ ] Criar, ver, trocar a capa e excluir a foto funcionam na ficha nova e na ficha de edição
- [ ] O admin vê as fotos de cada quarto e não as edita

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| App do hóspede mostrando o quarto | Ainda não existe |
| Limite de fotos do hotel | O hotel continua sem teto de quantidade |
| Reordenar fotos arrastando | A ordem é a de envio; a capa é escolhida à parte |
| Legenda editável | O texto alternativo nasce do nome do arquivo, como no hotel |
| Excluir o quarto | A extranet não tem essa ação; esta entrega apaga a foto, não o quarto |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Máximo por quarto | 8 | Escolha do usuário | y |
| Revisão | Bloqueada enquanto algum quarto tiver 0 fotos | Escolha do usuário | y |
| Capa | A primeira foto vira capa; o parceiro troca depois | Mesmo gesto do hotel; usuário não corrigiu | y |
| Onde envia | Criar e editar o quarto usam a mesma galeria | O CRUD da foto vale nas duas telas | y |
| Lista de quartos | Cada quarto mostra a capa, ou o ícone de prédio se não tiver foto | Ler também é parte do CRUD | y |
| Excluir o quarto | Fora desta entrega | A extranet não apaga quarto; apagar a foto está dentro | y |
| Arquivo | JPG, PNG ou WebP, até 5 MB | Regra já usada na foto do hotel | y |
| Falha de imagem | Ícone de prédio, sem texto | Mesmo placeholder do hotel | y |
| Excluir a capa | A próxima foto vira capa; se era a última, o quarto fica sem foto | Mesmo comportamento da foto do hotel | y |

**Open questions:** none

---

## Stakeholders

| Field | Writer | Readers | Must not see | Rights | Confirmation state the reader sees |
| ----- | ------ | ------- | ------------ | ------ | ---------------------------------- |
| Fotos do quarto (arquivo, capa, ordem, texto alternativo) | Parceiro, na ficha do quarto | Parceiro na extranet; admin no dossiê do hotel | Futuro hóspede, nesta entrega | Parceiro cria, troca a capa e exclui enquanto o hotel está em rascunho ou rejeitado; admin só lê | Parceiro vê a galeria e o selo de capa; admin vê a mesma galeria, somente leitura. Quarto sem foto mostra o ícone de prédio |

---

## User Stories

### P1: Parceiro ilustra o quarto ⭐ MVP

**User Story**: As a parceiro, I want to add up to 8 photos on a room so that the room is visible apart from the hotel.

**Why P1**: Sem a foto, o quarto continua só texto.

**Acceptance Criteria**:

1. WHEN o parceiro envia a primeira foto de um quarto THEN the system SHALL gravá-la como capa e SHALL mostrar o toast "Foto principal enviada" com o texto "Ela já é a capa do quarto."
2. WHEN o quarto já tem de 1 a 7 fotos e o envio termina THEN the system SHALL mostrar o toast "Foto enviada"
3. WHEN o quarto já tem 8 fotos e o parceiro escolhe outro arquivo THEN the system SHALL recusar o envio e SHALL mostrar o toast "Este quarto já tem 8 fotos."
4. IF o cliente ignorar a tela e a API receber a 9ª foto THEN the system SHALL responder 422 com a mensagem "Este quarto já tem 8 fotos." e SHALL NOT gravar a foto
5. IF o arquivo passa de 5 MB THEN the system SHALL mostrar o toast "Foto não enviada" com "Arquivo deve ter no máximo 5MB."
6. IF o arquivo não é JPG, PNG nem WebP THEN the system SHALL mostrar o toast "Foto não enviada" com "Formato inválido. Use JPG, PNG ou WebP."
7. WHEN o parceiro marca outra foto como capa THEN the system SHALL deixar só essa como capa e SHALL mostrar o toast "Foto principal definida"
8. WHEN o parceiro confirma "Excluir esta foto?" THEN the system SHALL remover a foto e SHALL mostrar o toast "Foto excluída"
9. IF o parceiro cancela "Excluir esta foto?" THEN the system SHALL manter a foto
10. WHEN a foto excluída era a capa e ainda existe outra THEN the system SHALL marcar a próxima como capa
11. The system SHALL recusar envio, troca de capa e exclusão quando o hotel não está em rascunho nem rejeitado

**Independent Test**: criar um quarto, enviar a primeira foto, ver o toast de capa, tentar a 9ª e ver a recusa.

---

### P1: Criar e editar o quarto com as fotos ⭐ MVP

**User Story**: As a parceiro, I want the same photo actions when I create a room and when I edit it so that I never leave a room half illustrated.

**Why P1**: O CRUD da foto vale nas duas telas.

**Acceptance Criteria**:

1. WHEN o parceiro abre "Adicionar" quarto THEN the system SHALL mostrar o seletor de fotos no mesmo formulário dos dados do quarto
2. WHEN o parceiro salva um quarto novo com 1 a 8 arquivos THEN the system SHALL criar o quarto, SHALL enviar esses arquivos, SHALL marcar o primeiro como capa, SHALL mostrar o toast "Quarto criado" e SHALL abrir a edição com essas fotos visíveis
3. IF o parceiro escolhe mais de 8 arquivos ao criar THEN the system SHALL recusar antes de criar o quarto e SHALL mostrar o toast "Escolha no máximo 8 fotos."
4. IF o quarto é criado e o envio de uma foto falha THEN the system SHALL manter o quarto, SHALL mostrar o toast "Foto não enviada" e SHALL abrir a edição com as fotos que entraram
5. WHEN o parceiro abre a edição de um quarto THEN the system SHALL listar as fotos já salvas, com a capa primeiro, e SHALL oferecer enviar, definir capa e excluir
6. WHEN o parceiro salva nome, ocupação ou comodidades THEN the system SHALL manter as fotos e SHALL mostrar o toast "Quarto salvo"
7. WHEN o parceiro abre a lista de quartos THEN the system SHALL mostrar a capa de cada quarto, ou o ícone de prédio quando o quarto não tem foto

**Independent Test**: criar um quarto com duas fotos, cair na edição com a primeira como capa, salvar o nome de novo e ver as duas fotos no lugar.

---

### P1: Revisão cobra foto em cada quarto ⭐ MVP

**User Story**: As a parceiro, I want the review gate to name the rooms still missing a photo so that I finish them before submitting.

**Why P1**: Foi a regra escolhida para "cada quarto tem imagem".

**Acceptance Criteria**:

1. IF algum quarto tem 0 fotos WHEN o parceiro envia o hotel para revisão THEN the system SHALL responder 422 com a mensagem "Cadastre ao menos 1 foto em: {nomes}" , em que `{nomes}` é a lista dos quartos sem foto na ordem de cadastro, separados por vírgula e espaço, e SHALL NOT mudar o status
2. WHEN todo quarto tem ao menos 1 foto e o hotel já cumpre quarto, foto e capa THEN the system SHALL mudar o status para IN_REVIEW
3. WHILE existir quarto sem foto the system SHALL mostrar no checklist o passo "Foto em cada quarto" como pendente
4. WHILE todo quarto tem ao menos 1 foto the system SHALL mostrar "Foto em cada quarto" como concluído

**Independent Test**: dois quartos, um sem foto, enviar para revisão e ler a mensagem com o nome desse quarto.

---

### P1: Admin vê as fotos do quarto ⭐ MVP

**User Story**: As an admin, I want each room on the hotel dossier to show its photos so that I review the room, not only the hotel cover.

**Why P1**: A revisão precisa ver o que o parceiro cadastrou.

**Acceptance Criteria**:

1. WHEN o admin abre o dossiê THEN the system SHALL listar, dentro de cada quarto, as fotos desse quarto com a capa primeiro
2. IF uma foto do quarto não carrega THEN the system SHALL mostrar o ícone de prédio, sem texto
3. IF o quarto não tem foto THEN the system SHALL mostrar o mesmo ícone de prédio, sem texto
4. The admin dossier SHALL NOT render controle de enviar, definir capa ou excluir foto de quarto

**Independent Test**: abrir o dossiê de um hotel com quarto fotografado e ver a imagem dentro do card do quarto.

---

## Edge Cases

- WHEN o parceiro exclui a única foto THEN o quarto fica sem capa e o checklist volta a pendente
- IF o parceiro tenta enviar foto para quarto de outro hotel THEN the system SHALL responder 404
- IF o upload para o storage falha THEN the system SHALL mostrar o toast "Foto não enviada" e SHALL NOT gravar a foto

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FOTO-01 | P1: Primeira foto vira capa | Execute | Verified |
| FOTO-02 | P1: Envio das fotos 2 a 8 | Execute | Verified |
| FOTO-03 | P1: Nona foto recusada na tela e na API | Execute | Verified |
| FOTO-04 | P1: Tipo e tamanho | Execute | Verified |
| FOTO-05 | P1: Trocar capa e excluir | Execute | Verified |
| FOTO-06 | P1: Hotel fechado não aceita mudança | Execute | Verified |
| FOTO-07 | P1: Revisão bloqueada com a lista de quartos | Execute | Verified |
| FOTO-08 | P1: Checklist | Execute | Verified |
| FOTO-09 | P1: Galeria no admin, só leitura | Execute | Verified |
| FOTO-10 | P1: Criar quarto já com fotos | Execute | Verified |
| FOTO-11 | P1: Edição lista, altera e preserva as fotos | Execute | Verified |
| FOTO-12 | P1: Lista de quartos mostra a capa | Execute | Verified |

**Coverage:** 12 total, 12 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Um quarto nunca passa de 8 fotos
- [ ] Hotel com quarto sem foto não entra em revisão
- [ ] O admin vê a galeria do quarto e não tem botão de edição
- [ ] Criar e editar o quarto fazem as mesmas ações de foto: enviar, ver, trocar a capa e excluir
