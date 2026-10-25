# Landing com fotos e fundos alternados

**Feature ID:** `landing-visual`  
**Scope:** Medium (design inline, tasks implícitas)  
**Status:** Specified  
**Base:** `.specs/features/landing-publica/spec.md` (LAND-01..06 continuam valendo)

---

## Problem Statement

A landing inteira usa o mesmo fundo claro e nenhuma foto. Para uma plataforma de hospedagem, falta a emoção do lugar: o visitante lê sobre hotel sem ver um hotel. As seções também se emendam sem separação visual.

## Goals

- [ ] O hero mostra hospedagem real em foto já no primeiro olhar
- [ ] Cada seção se distingue da vizinha pelo fundo
- [ ] A página continua rápida e sem depender de servidor externo de imagem

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Vídeo no hero | Pesa no mobile; decisão do usuário foi colagem de fotos |
| Fundo animado em gradiente | Decisão do usuário foi foto no hero e fundos alternados |
| Fotos de hotéis reais cadastrados | Ainda não há hotel publicado para vitrine |
| Mudança de texto, CTAs ou rotas | Mantidos de `landing-publica` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Visual do hero | Colagem de três fotos ao lado do texto, com leve movimento ao passar o mouse | Escolha do usuário | y |
| Origem das fotos | Unsplash, salvas em `apps/extranet/public/landing/` | Escolha do usuário; licença Unsplash permite uso sem atribuição | y |
| Fundos | Hero no fundo atual, prévia em faixa teal clara, passos em branco, grade no fundo atual, fechamento em teal escuro | Escolha do usuário (alternar) | y |
| Mobile | Abaixo de `lg` a colagem mostra só a foto principal, depois dos CTAs | CTAs seguem na primeira tela em 390px | y |
| Movimento | Só com `motion-safe`; quem pede movimento reduzido vê as fotos paradas | Acessibilidade | y |

**Open questions:** none

---

## Stakeholders

| Field | Writer | Readers | Must not see | Rights | Confirmation state the reader sees |
| ----- | ------ | ------- | ------------ | ------ | ---------------------------------- |
| Fotos do hero | Time Revoar (arquivos no repositório) | Visitante, anfitrião logado, futuro hóspede | none | Todos só leem | Não há confirmação; imagem estática ilustrativa |
| Fundos das seções | Time Revoar (código) | Visitante, anfitrião logado, futuro hóspede | none | Todos só leem | Não há confirmação; estilo estático |

---

## User Stories

### P1: Visitante vê hospedagem real no hero ⭐ MVP

**User Story**: As a visitante, I want to see real lodging photos next to the headline so that the platform feels like travel, not a form.

**Why P1**: É o pedido central.

**Acceptance Criteria**:

1. WHEN o visitante abre `/` em tela de 1280px THEN the system SHALL mostrar no hero três fotos carregadas, cada uma com texto alternativo em português não vazio
2. WHEN o visitante abre `/` em tela de 390px THEN the system SHALL mostrar no hero exatamente uma foto carregada, posicionada abaixo do botão "Cadastrar hotel"
3. WHEN a página carrega THEN the system SHALL servir as fotos do próprio domínio da extranet e SHALL NOT fazer requisição a `images.unsplash.com`

**Independent Test**: abrir `/` em 1280px → três `img` do hero com `naturalWidth > 0` e `alt` preenchido.

---

### P1: Seções com fundos alternados ⭐ MVP

**User Story**: As a visitante, I want each section to have its own background so that I can tell where one part ends and the next begins.

**Why P1**: É o segundo pedido.

**Acceptance Criteria**:

1. WHEN o visitante abre `/` THEN the system SHALL pintar a seção da prévia do hóspede com o fundo `primary-soft` (`#ecfeff`)
2. WHEN o visitante abre `/` THEN the system SHALL pintar a seção dos três passos com o fundo `surface` (`#ffffff`)
3. WHEN o visitante abre `/` THEN the system SHALL pintar a seção de fechamento com o fundo `primary` (`#0e7490`) e o título dela em branco
4. WHILE o fechamento está em fundo `primary` the system SHALL mostrar o botão "Cadastrar hotel" do fechamento com fundo branco

**Independent Test**: ler a cor de fundo computada das três seções e do botão do fechamento.

---

## Edge Cases

- WHEN o visitante usa `prefers-reduced-motion: reduce` THEN as fotos SHALL ficar paradas ao passar o mouse
- IF a tela tem 390px THEN a página SHALL continuar sem rolagem horizontal

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| VIS-01 | P1: Três fotos no desktop com alt | Execute | Pending |
| VIS-02 | P1: Uma foto no mobile abaixo do CTA | Execute | Pending |
| VIS-03 | P1: Fotos locais, sem Unsplash em runtime | Execute | Pending |
| VIS-04 | P1: Fundos da prévia, passos e fechamento | Execute | Pending |
| VIS-05 | P1: Botão claro no fechamento escuro | Execute | Pending |

**Coverage:** 5 total, 5 mapped to execute steps, 0 unmapped.

---

## Success Criteria

- [ ] O hero tem foto em todas as larguras
- [ ] Nenhuma seção vizinha compartilha o mesmo fundo
- [ ] A suíte de `landing-publica` continua verde
