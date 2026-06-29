# Fase 3 — Levantamento de Requisitos

**Projeto:** Revoar  
**Versão:** 1.0  
**Data:** Junho/2026  
**Dependências:** Fases 0, 1, 2  
**Status:** Concluída

---

## 1. Escopo do MVP

### In scope
- Busca e listagem de hotéis (Brasil)
- Detalhe de hotel e quarto
- Reserva com pagamento (PIX + cartão)
- Confirmação e voucher
- Cancelamento self-service
- Conta de usuário (opcional guest checkout)
- Área "Minhas viagens"
- Backoffice operacional básico

### Out of scope (MVP)
- Voos, pacotes, experiências
- Programa fidelidade
- App nativo (PWA/responsive web primeiro)
- Extranet hotel self-service completa
- Multi-idioma / multi-moeda

---

## 2. Requisitos funcionais (RF)

### 2.1 Busca e descoberta

| ID | Requisito | Prioridade | Critério de aceite |
|----|-----------|------------|-------------------|
| RF-001 | Buscar hotéis por destino (cidade, bairro, POI), check-in, check-out, hóspedes e quartos | P0 | Retorna resultados em < 2s P95 para top 50 destinos |
| RF-002 | Autocomplete de destinos com desambiguação | P0 | Sugere cidades e bairros; trata homônimos |
| RF-003 | Busca por intenção (NL) — "hotel romântico em Gramado com spa" | P1 | Parser extrai destino + atributos; fallback busca clássica |
| RF-004 | Exibir preço total estimado na listagem (diárias + taxas obrigatórias) | P0 | Delta listagem→checkout ≤ R$ 1 ou 0,5% |
| RF-005 | Filtros: faixa preço, estrelas, cancelamento grátis, café, Wi-Fi, piscina, estacionamento, avaliação | P0 | Filtros combináveis; contagem resultados atualizada |
| RF-006 | Ordenação: recomendados, menor preço, melhor avaliados, distância | P0 | Default "recomendados" usa ranking IA |
| RF-007 | Mapa interativo com pins de hotéis | P1 | Sync com lista; cluster em zoom out |
| RF-008 | Coleções curadas (Família, Lua de mel, Workation) | P1 | Landing pages indexáveis |
| RF-009 | Salvar hotel em favoritos (requer login) | P2 | Persiste cross-device |

### 2.2 Detalhe e seleção

| ID | Requisito | Prioridade | Critério de aceite |
|----|-----------|------------|-------------------|
| RF-010 | Página detalhe: fotos, descrição, amenities, mapa, reviews, políticas | P0 | Galeria ≥5 fotos quando disponível |
| RF-011 | Listar quartos/tarifas disponíveis para datas selecionadas | P0 | Revalidação ao entrar na página |
| RF-012 | Exibir política cancelamento por tarifa em linguagem clara | P0 | Badge + texto + link simulador |
| RF-013 | Simulador cancelamento: "Se cancelar em [data], reembolso R$ X" | P1 | Cálculo conforme RN cancelamento |
| RF-014 | Exibir "por que recomendamos" quando ranking IA | P1 | Máx 3 bullets explicativos |
| RF-015 | Indicador escassez real (≤3 quartos) | P2 | Apenas se inventário bedbank confirmar |

### 2.3 Reserva e checkout

| ID | Requisito | Prioridade | Critério de aceite |
|----|-----------|------------|-------------------|
| RF-020 | Checkout guest (sem conta) ou logado | P0 | Guest recebe link mágico e-mail |
| RF-021 | Coletar dados hóspede principal: nome, e-mail, telefone, CPF | P0 | Validação CPF; LGPD consent |
| RF-022 | Coletar dados hóspedes adicionais (nome) | P0 | Conforme ocupação quarto |
| RF-023 | Resumo pedido imutável na sidebar checkout | P0 | Hotel, datas, quarto, total, política |
| RF-024 | Hold de inventário por 15 min durante checkout | P0 | Timer visível; extensão 1x |
| RF-025 | Pagamento PIX (QR + copia-cola) | P0 | Expiração 30 min; webhook confirma |
| RF-026 | Pagamento cartão crédito (parcelamento 1–10x conforme regra) | P0 | 3DS quando exigido |
| RF-027 | Idempotência: duplo clique não gera reserva duplicada | P0 | Idempotency-Key em API |
| RF-028 | Confirmação assíncrona com polling/SSE se bedbank lento | P0 | Timeout 120s → estado pendente + notificação |
| RF-029 | Voucher PDF + e-mail + disponível offline (PWA cache) | P0 | Código confirmação + dados hotel |

### 2.4 Pós-reserva

| ID | Requisito | Prioridade | Critério de aceite |
|----|-----------|------------|-------------------|
| RF-030 | Área "Minhas viagens": upcoming, past, cancelled | P0 | Filtro por status |
| RF-031 | Cancelamento self-service conforme política | P0 | Confirmação + e-mail + status refund |
| RF-032 | Reembolso automático quando aplicável | P0 | Prazo exibido (5–15 dias úteis) |
| RF-033 | Solicitar alteração de datas (manual via suporte MVP) | P2 | Ticket gerado automaticamente |
| RF-034 | Notificações: confirmação, lembrete check-in D-1, pós-estadia review | P1 | E-mail + opt-in WhatsApp |
| RF-035 | Avaliar estadia pós check-out | P1 | Rating 1–5 + texto; moderação |

### 2.5 Conta e autenticação

| ID | Requisito | Prioridade | Critério de aceite |
|----|-----------|------------|-------------------|
| RF-040 | Cadastro e-mail + senha ou OAuth Google | P1 | MFA opcional fase 1.5 |
| RF-041 | Login magic link | P1 | Expira 15 min |
| RF-042 | Recuperação senha | P1 | Token seguro |
| RF-043 | Exportar/excluir dados (LGPD) | P0 | SLA 15 dias |

### 2.6 Suporte e operações

| ID | Requisito | Prioridade | Critério de aceite |
|----|-----------|------------|-------------------|
| RF-050 | Chat IA FAQ + escalonamento humano | P1 | 70% deflexão meta |
| RF-051 | Backoffice: buscar reserva, reenviar voucher, forçar cancelamento | P0 | Audit log |
| RF-052 | Backoffice: gestão chargeback e disputas | P1 | Workflow status |
| RF-053 | Dashboard métricas: GMV, conversão, erros integração | P1 | Tempo real +24h |

---

## 3. Requisitos não funcionais (RNF)

| ID | Categoria | Requisito | Meta |
|----|-----------|-----------|------|
| RNF-001 | Performance | Busca P95 latency | < 2s |
| RNF-002 | Performance | Checkout API P95 | < 500ms (excl. gateway) |
| RNF-003 | Disponibilidade | Uptime serviços críticos | 99,9% |
| RNF-004 | Escalabilidade | Picos jul/dez | 10x carga baseline auto-scale |
| RNF-005 | Segurança | PCI DSS | SAQ A (redirect/tokenização) |
| RNF-006 | Segurança | Criptografia | TLS 1.3; PII at rest AES-256 |
| RNF-007 | Privacidade | LGPD | DPO; ROPA; consentimento granular |
| RNF-008 | Observabilidade | Tracing distribuído | 100% fluxos book/pay |
| RNF-009 | Acessibilidade | WCAG | 2.1 AA (fluxos críticos) |
| RNF-010 | SEO | Landing destinos | Core Web Vitals green |
| RNF-011 | i18n | Idioma MVP | pt-BR only |
| RNF-012 | Compatibilidade | Browsers | Chrome/Safari/Firefox últimas 2 versões |
| RNF-013 | DR | RPO / RTO | 1h / 4h |
| RNF-014 | Rate limiting | API pública | 100 req/min/IP busca |

---

## 4. Regras de negócio (RN)

### 4.1 Preço e tarifas

| ID | Regra |
|----|-------|
| RN-001 | Preço exibido ao usuário = soma (diárias × noites) + taxas obrigatórias do hotel + impostos inclusos na tarifa bedbank |
| RN-002 | Taxas opcionais (estacionamento, resort fee pago no hotel) devem ser claramente marcadas "pago no local" |
| RN-003 | Moeda MVP: BRL exclusivamente |
| RN-004 | Parcelamento: mínimo R$ 100/reserva; máximo 10x sem juros apenas se subsídio comercial; juros conforme adquirente |
| RN-005 | Crianças: 0–2 anos free na cama dos pais (quando hotel permitir); 3–11 child rate; 12+ adulto — conforme config hotel |

### 4.2 Disponibilidade e reserva

| ID | Regra |
|----|-------|
| RN-010 | Revalidar disponibilidade e preço no início checkout e imediatamente antes confirmar |
| RN-011 | Se preço aumentar > 2% entre listagem e checkout, exibir modal confirmação explícita |
| RN-012 | Hold inventário: 15 min; máximo 1 extensão +10 min |
| RN-013 | Reserva confirmada apenas após: pagamento capturado + confirmação fornecedor (bedbank/hotel) |
| RN-014 | Falha fornecedor pós-pagamento → estorno automático em 100% casos; notificar usuário em < 5 min |
| RN-015 | Overbooking detectado → realocação ou reembolso integral + crédito compensação R$ 100 |

### 4.3 Cancelamento e reembolso

| ID | Regra |
|----|-------|
| RN-020 | Políticas: **Flexível** (grátis até 24h antes), **Moderada** (grátis até 7 dias), **Restrita** (50% até 7 dias), **Não reembolsável** |
| RN-021 | Cancelamento grátis CDC: 7 dias corridos após compra online se check-in > 7 dias (quando aplicável lei) |
| RN-022 | Reembolso PIX: até 5 dias úteis; cartão: estorno na fatura 1–2 ciclos |
| RN-023 | No-show: cobrança 100% tarifa conforme política non-refundable ou 1ª noite |
| RN-024 | Cancelamento parcial (early checkout) não suportado MVP — tratar via suporte |

### 4.4 Pagamento e fraude

| ID | Regra |
|----|-------|
| RN-030 | Score antifraude > threshold → revisão manual; timeout 2h → estorno |
| RN-031 | Chargeback recebido → reserva flagged; hotel notificado |
| RN-032 | Limite 3 reservas pendentes simultâneas por CPF |
| RN-033 | PIX expira 30 min; reserva hold liberada após expiração |

### 4.5 Conteúdo e reviews

| ID | Regra |
|----|-------|
| RN-040 | Review apenas pós check-out confirmado |
| RN-041 | Moderação automática + manual; remoção conteúdo ofensivo em 24h |
| RN-042 | Rating agregado: média ponderada últimos 12 meses |

---

## 5. Casos de uso

### UC-01 — Buscar hotel

**Ator:** Viajante  
**Pré-condição:** Nenhuma  
**Fluxo principal:**
1. Usuário informa destino, datas, hóspedes.
2. Sistema consulta índice de busca + bedbank.
3. Sistema aplica ranking e exibe listagem com preço total.
4. Usuário aplica filtros/ordenação.

**Fluxos alternativos:**
- 3a. Zero resultados → sugere datas alternativas ou cidades próximas.
- 3b. Busca por intenção → NLP parseia atributos.

---

### UC-02 — Reservar hotel

**Ator:** Viajante  
**Pré-condição:** Quarto selecionado disponível  
**Fluxo principal:**
1. Usuário inicia checkout.
2. Sistema cria hold e exibe timer.
3. Usuário preenche dados e escolhe pagamento.
4. Sistema processa pagamento.
5. Sistema confirma com fornecedor.
6. Sistema emite voucher e notifica.

**Fluxos alternativos:**
- 4a. Pagamento recusado → mensagem clara + retry.
- 5a. Fornecedor timeout → retry 3x → pendente + fila reconciliação.
- 5b. Fornecedor rejeita → estorno automático.

---

### UC-03 — Cancelar reserva

**Ator:** Viajante  
**Pré-condição:** Reserva confirmada, status CONFIRMED  
**Fluxo principal:**
1. Usuário acessa reserva em "Minhas viagens".
2. Sistema exibe simulação reembolso.
3. Usuário confirma cancelamento.
4. Sistema cancela no fornecedor.
5. Sistema processa reembolso e notifica.

**Fluxos alternativos:**
- 4a. Fornecedor falha cancel → ticket ops + retry automático.
- 3a. Política non-refundable → reembolso R$ 0 com confirmação explícita.

---

### UC-04 — Operador reenvia voucher

**Ator:** Agente suporte  
**Pré-condição:** Reserva confirmada  
**Fluxo:** Backoffice busca reserva → reenvia e-mail/PDF → audit log.

---

### UC-05 — Reconciliação falha confirmação

**Ator:** Sistema (job)  
**Fluxo:** Detecta pagamento sem confirmação > 5 min → retry fornecedor → se falha, estorno + alerta ops.

---

## 6. Cenários de erro e edge cases

| # | Cenário | Comportamento esperado |
|---|---------|------------------------|
| E01 | Bedbank timeout na busca | Cache stale + banner "preços podem variar"; retry background |
| E02 | Preço mudou no checkout | Modal diff preço; usuário aceita ou aborta |
| E03 | Hold expirou | Redirect detalhe hotel; mensagem amigável |
| E04 | PIX pago após expiração | Job reconcilia; estorno automático ou confirma se inventário OK |
| E05 | Double booking mesmo quarto | Primeira confirmação vence; segunda estornada + compensação |
| E06 | Hotel fechou permanentemente | Cancelamento forçado + reembolso + alternativas sugeridas |
| E07 | Cartão 3DS abandonado | Reserva não criada; hold mantido até timer |
| E08 | Usuário cancela 1 min após reserva (CDC) | Reembolso integral automático |
| E09 | Chargeback fraudulento | Ban CPF + evidências ao adquirente |
| E10 | E-mail voucher bounced | Retry 3x + SMS/WhatsApp fallback |
| E11 | Busca datas passadas | Validação client+server; erro claro |
| E12 | Criança count > max ocupação | Bloqueio checkout + sugestão quarto maior |
| E13 | Blackout dates hotel | Ocultar tarifa ou marcar indisponível |
| E14 | Manutenção bedbank | Modo degradado cache 6h + ops alert |
| E15 | Pico 10x tráfego julho | Auto-scale + queue booking + SLA estendido comunicado |

---

## 7. Matriz de rastreabilidade (amostra)

| Persona | Dor | Requisito |
|---------|-----|-----------|
| P1 Camila | PP1 preço surpresa | RF-004, RN-001, RN-011 |
| P1 | PP4 cancelamento | RF-012, RF-013, RN-020 |
| P2 Ricardo | PP3 confirmação lenta | RF-028, RNF-001 |
| P4 Fernanda | PP8 checkout longo | RF-020–027, RNF-002 |
| P3 Juliana | PP2 overload | RF-003, RF-006, RF-008 |

---

## 8. Conclusões

1. **47 RFs** priorizados cobrem jornada completa MVP.
2. **Regras RN-010 a RN-015** são críticas para confiança (pagamento vs confirmação).
3. **15 edge cases** documentados para testes e runbooks.
4. **Próxima fase (UX)** detalha fluxos visuais destes requisitos.

---

*Base para Fase 4 — Experiência do Usuário.*
