# Fase 4 — Experiência do Usuário (UX)

**Projeto:** Revoar  
**Versão:** 1.0  
**Data:** Junho/2026  
**Dependências:** Fases 0–3  
**Status:** Concluída

---

## 1. Princípios de UX Revoar

| Princípio | Implementação |
|-----------|---------------|
| **Transparência visual** | Preço total sempre visível; taxas locais com ícone informativo |
| **Progressive disclosure** | Filtros avançados colapsados; detalhes política expandíveis |
| **Mobile-first** | Thumb zone para CTAs; bottom sheets no mobile |
| **Feedback imediato** | Skeleton loaders; estados vazios acionáveis |
| **Recuperação de erro** | Toda falha oferece próximo passo claro |
| **Confiança** | Selos segurança pagamento; reviews verificados |

---

## 2. Jornada do usuário (end-to-end)

```
Descoberta → Consideração → Decisão → Transação → Pós-viagem
    │              │            │           │            │
  SEO/Ads      Listagem     Detalhe     Checkout    Review/NPS
  Coleções     Filtros      Simulador   Pagamento   Fidelidade*
  Intenção     Mapa         Reviews     Voucher     Rebook*
```

### 2.1 Touchpoints emocionais

| Fase | Emoção desejada | Risco | Mitigação UX |
|------|-----------------|-------|--------------|
| Descoberta | Curiosidade, inspiração | Overwhelm | Coleções curadas |
| Consideração | Confiança | Desconfiança preço | Total upfront |
| Decisão | Segurança | Medo errar | Simulador cancelamento |
| Transação | Alívio | Ansiedade pagamento | Progress bar + confirmação clara |
| Pré-viagem | Antecipação | Voucher perdido | PWA offline + WhatsApp |
| Pós-viagem | Gratidão | — | Review fácil + crédito futuro* |

---

## 3. Arquitetura de informação

```
Home
├── Busca (hero)
├── Coleções
├── Destinos populares
└── Footer (ajuda, legal)

Resultados
├── Header busca (editável)
├── Filtros (sidebar desktop / sheet mobile)
├── Lista + Mapa (toggle)
└── Paginação / infinite scroll

Hotel
├── Galeria
├── Resumo + preço total
├── Quartos/tarifas
├── Sobre + amenities
├── Mapa localização
├── Reviews
└── Políticas

Checkout (3 telas)
├── Tela 1: Dados hóspedes
├── Tela 2: Pagamento
└── Tela 3: Confirmação / pendente

Minhas viagens
├── Próximas
├── Anteriores
└── Canceladas

Conta
├── Perfil
├── Pagamentos salvos*
└── Preferências notificação
```

---

## 4. Fluxo — Busca de hotéis

### 4.1 Wireflow textual

```
[Home] → usuário preenche destino, datas, hóspedes → [Buscar]
    ↓
[Resultados] skeleton 200ms → cards com foto, nome, estrelas, rating, preço TOTAL, badge cancelamento
    ↓
Interações paralelas:
  • Editar busca (sticky header)
  • Filtros (sheet mobile)
  • Ordenação (dropdown)
  • Mapa (split view desktop / fullscreen mobile)
  • Card tap → [Detalhe hotel]
```

### 4.2 Componentes críticos

| Componente | Comportamento |
|------------|---------------|
| **SearchBar** | Autocomplete debounce 300ms; destinos recentes |
| **PriceTag** | "R$ 1.890 total · 3 noites · impostos inclusos" |
| **FilterChip** | Cancelamento grátis destacado default-off mas promovido |
| **HotelCard** | Lazy load imagem; skeleton; favorito heart |
| **IntentSearch** | Campo alternativo "Descreva sua viagem ideal..." |

### 4.3 Estados especiais

| Estado | UX |
|--------|-----|
| Zero resultados | Ilustração + "Tente datas flexíveis ±3 dias" + botão |
| Erro API | "Estamos com lentidão" + retry + cache parcial |
| Preços desatualizados | Banner amarelo discreto |

---

## 5. Fluxo — Reserva (checkout)

### 5.1 Três telas (mobile)

**Tela 1 — Seus dados (≈40% conversão drop aqui se mal feito)**
- Resumo sticky bottom: total + "Continuar"
- Form: nome, e-mail, telefone, CPF
- Hóspedes adicionais colapsável
- Checkbox LGPD + termos
- Guest checkout default; link "Já tenho conta"

**Tela 2 — Pagamento**
- Timer hold visível: "Reservamos seu quarto por 14:32"
- Tabs: PIX | Cartão
- PIX: QR grande + copia-cola + instruções
- Cartão: campos tokenizados; selector parcelas com total por parcela
- Botão "Confirmar reserva R$ X.XXX"

**Tela 3 — Confirmação**
- Sucesso: animação check + confetti sutil
- Código reserva + botão "Ver voucher"
- Add calendar (.ics)
- Compartilhar WhatsApp
- Pendente: spinner + "Confirmando com hotel..." + e-mail quando pronto

### 5.2 Desktop

Layout 2 colunas: form esquerda (telas 1+2 unificadas scroll) | resumo direita sticky.

### 5.3 Microcopy crítico

| Momento | Copy |
|---------|------|
| Início checkout | "Quase lá! Seu quarto está reservado temporariamente." |
| PIX | "Pague em até 30 min para garantir." |
| Preço mudou | "O hotel atualizou o preço de R$ X para R$ Y. Deseja continuar?" |
| Falha confirmação | "Seu pagamento foi estornado. Nenhum valor foi cobrado." |

---

## 6. Fluxo — Pagamento

### 6.1 PIX

```
Seleciona PIX → Gera QR → Usuário paga app banco
    ↓
Webhook confirma → Tela sucesso automática (SSE/poll 3s)
    ↓
Timeout 30min → "PIX expirado" + botão gerar novo
```

**UX antifraude:** Loading state "Validando pagamento..." max 10s antes confirmação.

### 6.2 Cartão

```
Tokeniza cartão (iframe gateway) → 3DS se necessário → Captura
    ↓
Sucesso → Confirmação fornecedor
    ↓
Recusa → "Cartão recusado. Tente outro ou use PIX." (sem jargão código)
```

### 6.3 Parcelamento

Selector visual: 1x R$ 1.200 | 3x R$ 400 | 6x R$ 200*  
*Com asterisco se com juros.

---

## 7. Fluxo — Cancelamento

```
Minhas viagens → [Reserva] → Botão "Cancelar reserva"
    ↓
Modal simulador:
  "Hoje (13/06): reembolso R$ 1.080 de R$ 1.200"
  "Multa: R$ 120 (política Moderada)"
  Timeline visual verde/amarelo/vermelho
    ↓
Confirmar cancelamento → Checkbox "Entendo que..."
    ↓
Processing → Sucesso "Cancelado. Reembolso em até 5 dias úteis."
    ↓
E-mail confirmação + status Minhas viagens = CANCELLED
```

**Edge UX:** Non-refundable → modal vermelho explícito; botão "Manter reserva" primário.

---

## 8. Fluxos secundários

### 8.1 Login / Magic link
- E-mail → link 15 min → redirect Minhas viagens ou checkout retomado.

### 8.2 Voucher
- PDF: logo Revoar, código barras/QR, dados hotel, política, telefone suporte.
- PWA: salvo em cache após primeiro acesso online.

### 8.3 Suporte chat
- Bubble bottom-right; IA responde status/cancelamento; botão "Falar com humano".

### 8.4 Notificações

| Evento | Canal | Timing |
|--------|-------|--------|
| Confirmação | E-mail + push* | Imediato |
| Lembrete check-in | E-mail + WhatsApp opt-in | D-1 10h |
| Pós-estadia | E-mail review | D+1 |

---

## 9. Design system (diretrizes)

### 9.1 Identidade visual

| Token | Valor |
|-------|-------|
| Primary | `#0E7490` (ciano profundo — confiança, céu) |
| Accent | `#F97316` (laranja pôr do sol — energia viagem) |
| Success | `#059669` |
| Error | `#DC2626` |
| Neutral | Escala slate |
| Font | **Plus Jakarta Sans** (extranet/admin implementados); Inter/system aceitável no app viajante futuro |
| Radius | 8px cards, 12px modals |
| Shadow | Sutil; elevado em modals |

### 9.2 Componentes shadcn/ui base
Button, Input, Select, Sheet, Dialog, Tabs, Badge, Skeleton, Toast.

### 9.3 Acessibilidade
- Contraste AA mínimo
- Focus visible
- Labels em todos inputs
- aria-live para confirmação assíncrona

---

## 10. Responsividade

| Breakpoint | Layout |
|------------|--------|
| < 640px | Single column; bottom CTA; filter sheet |
| 640–1024px | 2 col resultados opcional |
| > 1024px | Sidebar filtros; split mapa |

---

## 11. Métricas UX

| Métrica | Meta | Ferramenta |
|---------|------|------------|
| Checkout completion rate | ≥ 65% | Analytics |
| Time to book (median) | < 4 min | Hotjar |
| SUS score | ≥ 80 | Survey |
| Mobile bounce search | < 40% | GA4 |
| Error recovery rate | ≥ 90% | Custom events |

---

## 12. Protótipo sugerido (Figma)

1. Home + busca intenção
2. Resultados + filtros
3. Detalhe + simulador
4. Checkout 3 telas (mobile)
5. Confirmação sucesso/pendente/erro
6. Minhas viagens + cancelamento

---

## 13. Conclusões

1. **Checkout 3 telas** é requisito central de diferenciação mobile.
2. **Simulador cancelamento** reduz ansiedade personas P1/P3.
3. **Estados assíncronos** (pendente, PIX, confirmação) precisam design dedicado — não afterthought.
4. **Próxima fase (System Design)** materializa estes fluxos em serviços e infra.

---

*Base para Fase 5 — Desenho de Sistema.*
