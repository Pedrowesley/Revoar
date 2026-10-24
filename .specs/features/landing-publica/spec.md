# Landing pública na home da extranet

**Feature ID:** `landing-publica`  
**Scope:** Medium  
**Status:** Specified  
**Spec:** este arquivo  
**Design:** `.specs/features/landing-publica/design.md`  
**Tasks:** `.specs/features/landing-publica/tasks.md`

---

## Problem Statement

A rota `/` da extranet é um bloco curto que só fala com quem já decidiu cadastrar um hotel. Ela não conta o que a Revoar vai ser para o hóspede e não tem nada para o visitante tocar. Um anfitrião que chega pela primeira vez não vê o caminho até o hotel no ar, nem o que vem depois.

## Goals

- [ ] Visitante entende em uma tela que hoje publica o hotel e que o hóspede vai reservar pela Revoar
- [ ] Anfitrião chega a cadastro, login ou painel em um toque
- [ ] Hóspede vê a prévia do produto futuro sem cair em rota inexistente

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| App do hóspede (busca, reserva, pagamento, avaliação) | Ainda não existe; a landing mostra só uma prévia |
| Link para o admin | Admin é interno da equipe Revoar |
| Número de prova social | Não há contagem real de hotéis ou empresas |
| Nova rota ou novo app | A landing substitui a home da extranet |
| Mudança de API ou header | O header atual permanece |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Onde mora | Rota `/` da extranet | Decisão do grilling | y |
| Portas | Anfitrião com links reais; hóspede desabilitado com "Em breve"; admin ausente | Decisão do grilling | y |
| Promessa | Headline cita a reserva do hóspede; busca, reserva, pagamento e avaliação aparecem como "Em breve" | Decisão do grilling | y |
| Interação | Prévia clicável do app do hóspede com selo "Em breve"; o clique só troca a aba | Decisão do grilling | y |
| Sessão ativa | A landing continua visível e o CTA principal vira "Ir para o painel" | Decisão do grilling | y |
| Paleta | Tokens atuais: teal, neutros e Plus Jakarta Sans | Decisão do grilling | y |
| Testes | Playwright e2e em `e2e/landing.spec.ts` | O repo só tem `npm run test:e2e` | y |

**Open questions:** none

---

## Stakeholders

| Field | Writer | Readers | Must not see | Rights | Confirmation state the reader sees |
| ----- | ------ | ------- | ------------ | ------ | ---------------------------------- |
| Headline, passos e grade de capacidades | Time Revoar (código) | Visitante, anfitrião logado, futuro hóspede | none | Todos só leem | Não há confirmação; o texto é estático |
| CTAs do anfitrião | Time Revoar (código) | Visitante e anfitrião logado | none | Visitante navega para cadastro e login; logado navega para o painel | Deslogado vê "Cadastrar hotel" e "Já tenho conta"; logado vê "Ir para o painel" |
| Porta e prévia do hóspede | Time Revoar (código) | Visitante, anfitrião logado, futuro hóspede | none | Todos só leem; nenhum controle navega ou grava | Todos veem o selo "Em breve" |
| Acesso ao admin | — | none | Visitante, anfitrião e hóspede | Ninguém navega a partir da landing | A landing não mostra o admin |

---

## User Stories

### P1: Visitante entende a promessa e chega ao cadastro ⭐ MVP

**User Story**: As a visitante, I want a clear headline with the next step so that I can list my hotel today and know guests will book here.

**Why P1**: É a razão da página existir.

**Acceptance Criteria**:

1. WHEN o visitante abre `/` THEN the system SHALL mostrar o título "Publique seu hotel. O hóspede vai reservar aqui."
2. WHEN o visitante abre `/` THEN the system SHALL mostrar, abaixo do CTA, a linha "Cadastro, revisão da equipe Revoar e hotel no ar."
3. WHEN o visitante sem sessão aciona "Cadastrar hotel" THEN the system SHALL navegar para `/signup`
4. WHEN o visitante sem sessão aciona "Já tenho conta" THEN the system SHALL navegar para `/login`
5. WHEN o anfitrião com sessão abre `/` THEN the system SHALL mostrar "Ir para o painel" apontando para `/dashboard` e SHALL NOT mostrar "Cadastrar hotel" no hero
6. WHEN o visitante aciona "Área do hóspede" THEN the system SHALL manter a URL em `/`, pois o botão SHALL estar desabilitado com o texto "Em breve"

**Independent Test**: abrir `/` sem sessão → clicar "Cadastrar hotel" → `/signup`.

---

### P1: Visitante explora a prévia do hóspede ⭐ MVP

**User Story**: As a visitante, I want to click through the future guest app so that I see what Revoar will offer.

**Why P1**: É a interação pedida e a vitrine do que vem.

**Acceptance Criteria**:

1. WHEN o visitante abre `/` THEN the system SHALL mostrar as abas Buscar, Reservar, Pagar e Avaliar, com Buscar selecionada
2. WHEN o visitante aciona uma aba THEN the system SHALL marcar essa aba como selecionada, SHALL mostrar o painel dela e SHALL manter a URL em `/`
3. WHILE qualquer aba está selecionada the system SHALL mostrar o selo "Em breve" na prévia

**Independent Test**: clicar Pagar → painel de pagamento visível → selo "Em breve" → URL `/`.

---

### P1: Visitante vê o caminho e as capacidades ⭐ MVP

**User Story**: As a visitante, I want the steps and what the platform does so that I know what is live now and what comes next.

**Why P1**: Separa o que já existe do que é promessa.

**Acceptance Criteria**:

1. WHEN o visitante abre `/` THEN the system SHALL mostrar os passos "Cadastre seu hotel", "Configure os quartos" e "Envie para revisão"
2. WHEN o visitante abre `/` THEN the system SHALL mostrar na grade "Busca", "Reserva", "Pagamento" e "Avaliação", cada um com o selo "Em breve"
3. The landing SHALL NOT render link para o admin

**Independent Test**: rolar a página → três passos → quatro itens "Em breve" → nenhum link do admin.

---

## Edge Cases

- WHEN a sessão expira e o token some THEN o hero SHALL voltar a mostrar "Cadastrar hotel"
- IF a tela tem 390px de largura THEN os CTAs do hero SHALL ficar visíveis sem rolagem horizontal

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| LAND-01 | P1: Headline e linha de processo | Execute | Implemented |
| LAND-02 | P1: CTAs do visitante | Execute | Implemented |
| LAND-03 | P1: CTA com sessão | Execute | Implemented |
| LAND-04 | P1: Porta do hóspede desabilitada | Execute | Implemented |
| LAND-05 | P1: Prévia com abas | Execute | Implemented |
| LAND-06 | P1: Passos, grade e sem admin | Execute | Implemented |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Visitante chega a `/signup` em um toque
- [ ] Nenhum controle do hóspede navega
- [ ] A página não mostra número de prova social nem link do admin
