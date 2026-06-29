# Análise de Riscos — Revoar

**Projeto:** Revoar  
**Versão:** 2.0 — Edição para Sócios  
**Data:** Junho/2026  
**Status:** Concluída

---

## Resumo para os sócios

> Todo negócio tem riscos. A diferença entre um negócio bem planejado e um que se surpreende é saber com antecedência o que pode dar errado — e já ter o plano B pronto. Este documento lista os principais riscos do Revoar em linguagem direta, com o grau de preocupação e o que já estamos fazendo para mitigar cada um.

**Como lemos a tabela de prioridade:**
- 🔴 **Crítico** — pode afetar a existência do negócio. Exige atenção máxima.
- 🟠 **Alto** — impacto significativo se acontecer. Precisa de plano de resposta claro.
- 🟡 **Médio** — relevante, mas gerenciável.

---

## 1. Riscos financeiros

### O cliente pagou mas a reserva não foi confirmada

🔴 **Crítico**

**O que pode acontecer:** O cliente paga pelo PIX ou cartão, mas por alguma falha de comunicação entre a nossa plataforma e o hotel, a reserva não é criada no sistema do hotel. O cliente fica sem reserva e com o dinheiro debitado.

**Por que é crítico:** Isso destrói a confiança do cliente de forma irreversível — e pode gerar problemas legais.

**O que fazemos para evitar:**
- O sistema foi desenhado para detectar esse cenário automaticamente em menos de 5 minutos
- Se confirmado, o reembolso é feito de forma automática e imediata, sem precisar ligar para ninguém
- O cliente recebe um aviso imediato e uma alternativa de hotel

---

### Custo de aquisição de clientes maior que o lucro por cliente

🟠 **Alto**

**O que pode acontecer:** Gastamos mais em marketing para trazer cada cliente do que ele nos gera de margem. Com R$ 85 de custo por cliente e R$ 34 de margem por reserva, precisamos que ele reserve pelo menos 3 vezes para ser lucrativo.

**O que fazemos:**
- Acompanhar semanalmente a relação custo × margem por canal de marketing
- Focar em SEO (conteúdo sobre destinos no Google) que gera clientes mais baratos a longo prazo
- Criar fidelização para que o cliente volte sem precisar de novo investimento em anúncio

---

### Sazonalidade — caixa baixo no meio do ano

🟠 **Alto**

**O que pode acontecer:** Julho e dezembro são os picos. De abril a junho, o volume cai bastante. Sem planejamento, a empresa pode ter dificuldade de caixa nesses meses.

**O que fazemos:**
- Guardar reserva financeira nos meses fortes para cobrir os meses fracos
- Ter acesso a uma linha de crédito disponível antes de precisar
- Reduzir gastos variáveis (principalmente marketing) nos períodos de baixa

---

### Contestação de pagamento (chargeback) em excesso

🟠 **Alto**

**O que pode acontecer:** O cliente cancela a cobrança no cartão alegando que não fez a compra (fraude com cartão clonado) ou que o serviço não foi entregue. A operadora de cartão devolve o dinheiro ao cliente e debita da Revoar.

**O que fazemos:**
- Sistema antifraude que analisa cada transação antes de confirmar
- Políticas de cancelamento claras para reduzir disputas por "não recebi"
- Meta: manter abaixo de 0,8% das transações (limite saudável para operar)

---

## 2. Riscos de mercado e crescimento

### Marca nova sem reconhecimento

🟠 **Alto**

**O que pode acontecer:** O consumidor não conhece a Revoar e prefere o Booking ou a Decolar por confiança. CAC alto, conversão baixa.

**O que fazemos:**
- Depoimentos reais de clientes desde o início
- Política de cancelamento fácil reduz o risco percebido da primeira compra
- Parcerias com influenciadores e criadores de conteúdo de viagem para gerar credibilidade

---

### Concorrente grande copia nosso diferencial

🟡 **Médio**

**O que pode acontecer:** O Booking decide mostrar o preço total desde a listagem — nosso principal diferencial.

**Por que não é tão grave:** Grandes plataformas mudam devagar. Enquanto isso, construímos base de dados e fidelização que eles não conseguem copiar facilmente. Nossa vantagem vai além de uma funcionalidade — é a confiança que construímos com o cliente ao longo do tempo.

---

### Hotéis relutantes em fazer parceria direta

🟡 **Médio**

**O que pode acontecer:** Hotéis preferem usar as plataformas já conhecidas e não aderem ao contrato direto.

**Por que não é bloqueador:** No início, usamos os agregadores de inventário (que já têm contrato com os hotéis). O contrato direto é um plus que vem com o tempo, quando a Revoar já tem volume para mostrar.

---

### Mudança de regras (regulação, impostos, turismo)

🟡 **Médio**

**O que pode acontecer:** Uma nova lei sobre plataformas de turismo, tributação diferente ou mudança nas regras do CDC afeta o negócio.

**O que fazemos:**
- Jurídico acompanha mudanças regulatórias continuamente
- O sistema foi construído para adaptar políticas de cancelamento e fiscal sem reformar tudo

---

## 3. Riscos operacionais

### Suporte sobrecarregado nos picos de demanda

🟠 **Alto**

**O que pode acontecer:** Em julho ou dezembro, o volume de dúvidas e problemas explode. Com equipe pequena, o atendimento fica lento e prejudica a reputação.

**O que fazemos:**
- Sistema de atendimento com inteligência artificial resolve 70% das dúvidas automaticamente (status de reserva, voucher, política de cancelamento)
- O restante é tratado por humanos, mas com triagem automática por prioridade
- Contratação sazonal temporária para picos previsíveis

---

### Hotel com qualidade muito diferente das fotos

🟠 **Alto**

**O que pode acontecer:** O cliente reserva com base em fotos bonitas e chega no hotel com realidade bem diferente. Reclamação, pedido de reembolso e avaliação ruim.

**O que fazemos:**
- O contrato deixa claro que o hotel é responsável pela precisão do conteúdo
- Após 5 reclamações verificadas sobre conteúdo enganoso, o hotel é removido da plataforma
- Reviews de clientes reais aparecem com destaque — a própria comunidade regula a qualidade

---

### Pessoa chave sai da empresa

🟡 **Médio**

**O que pode acontecer:** Um dos membros centrais do time deixa a empresa e leva conhecimento crítico consigo.

**O que fazemos:**
- Documentação de todos os processos — nada vive só na cabeça de uma pessoa
- Decisões técnicas registradas por escrito
- Pelo menos 2 pessoas com conhecimento profundo de cada área crítica

---

## 4. Dependências externas

Dependemos de alguns parceiros externos para funcionar. Esses são os mais críticos:

| Parceiro | O que fornece | O risco | Nosso plano B |
|----------|--------------|---------|---------------|
| **Hotelbeds** (agregador de hotéis) | Acesso a +50.000 hotéis | Sistema fora do ar | Segundo agregador ativado; cache temporário |
| **Mercado Pago** (pagamentos) | PIX e cartão | Instabilidade do PIX | Ativar Stripe como segundo gateway de cartão |
| **Amazon Web Services** | Servidores e infraestrutura | Indisponibilidade regional | Redundância em múltiplas zonas geográficas |

---

## 5. Riscos legais e de conformidade

| Tema | O que pode acontecer | Como estamos protegidos |
|------|----------------------|-------------------------|
| **LGPD** (proteção de dados) | Multa por uso inadequado de dados pessoais | DPO designado; consentimento explícito; direito de exclusão de dados |
| **CDC** (Código de Defesa do Consumidor) | Reclamação por cancelamento negado ou prazo de reembolso | Cancelamento automático dentro do prazo legal de 7 dias |
| **Segurança de pagamento** | Vazamento de dados de cartão | Dados de cartão nunca tocam nossos servidores — vão direto para o processador |

---

## 6. Os 5 riscos que mais nos preocupam

Em ordem de prioridade de atenção:

| # | Risco | Por que é prioritário |
|---|-------|----------------------|
| 1 | Cliente pagou mas reserva não confirmada | Confiança — qualquer ocorrência é grave |
| 2 | Dois clientes reservam o mesmo quarto (overbooking) | Qualidade de serviço e custo de compensação |
| 3 | Caixa baixo nos meses de baixa temporada | Financeiro — pode inviabilizar a operação |
| 4 | Custo de marketing superar lucro por cliente | Financeiro — sustentabilidade de longo prazo |
| 5 | Marca desconhecida gerando baixa conversão | Comercial — impacta tempo até o break-even |

---

## 7. Plano de resposta para crises

### Se o sistema de reservas ficar fora do ar

1. Aviso automático no site explicando o problema
2. Equipe técnica acionada imediatamente
3. Comunicado nas redes sociais se durar mais de 30 minutos
4. Revisão completa para entender a causa assim que voltar

### Se houver muitos reembolsos ao mesmo tempo

1. Novos pagamentos pausados temporariamente
2. Todos os sócios e o time financeiro convocados
3. Verificação imediata se o problema é nosso ou do fornecedor de hotéis
4. Comunicação ativa para os clientes afetados

---

## 8. Proteção financeira

| Cobertura | O que protege |
|-----------|---------------|
| Seguro cibernético | Vazamento de dados, ataques digitais |
| Reserva de caixa para estornos | 0,5% do volume mensal de reservas separado mensalmente |

---

## 9. Rotina de revisão

Riscos não são revisados uma vez e esquecidos:

| Frequência | O que revisamos |
|------------|-----------------|
| Toda semana | Métricas de saúde do negócio + qualquer incidente |
| Todo mês | Atualização da lista de riscos |
| A cada 3 meses | Simulação de crise e teste dos planos B |
| Todo ano | Auditoria completa de segurança e conformidade legal |

---

## 10. Conclusão

Nenhum negócio é isento de risco — o que diferencia os bem-sucedidos é a capacidade de antecipar, preparar e reagir rápido. Os riscos mais graves do Revoar estão identificados e têm planos de resposta claros. O maior deles — cliente pagar e reserva não confirmar — tem solução automática implementada antes do lançamento.

---

*Próximo: Roadmap — O que vamos construir e quando*
