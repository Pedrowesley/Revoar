# Fase 11 — Área do cliente

**Projeto:** Revoar
**Versão:** 1.0
**Data:** Outubro/2026
**Dependências:** Fases 0–10, Release 0.0 (extranet + admin)
**Status:** Fluxo do hóspede em código para inventário DIRECT. Pagamento de PIX e cartão confirma em ambiente de teste, sem gateway real.

Este documento é o master plan da jornada do hóspede. Ele estende as Fases 3 (requisitos), 4 (UX) e 6 (dados). Onde esta fase e aquelas divergem, vale o que está escrito aqui.

---

## 1. Decisões

| ID | Decisão |
|----|---------|
| AD-015 | A área do cliente reserva **hotel e pousada** de parceiro com CNPJ. Casa, apartamento inteiro e anfitrião pessoa física ficam fora. |
| AD-016 | Cada hotel tem um modo de fechamento: **reserva imediata** ou **sob consulta**. Cada tipo de quarto herda o modo do hotel ou substitui por um dos dois. |
| AD-017 | Reserva imediata cobra no checkout, com o quarto segurado por 15 minutos. Sob consulta **não cobra** antes do aceite. O parceiro tem 24 horas. Se aceitar, o hóspede paga em até 2 horas (PIX ou cartão). |
| AD-018 | A primeira área do cliente lê só inventário `DIRECT` já aprovado na extranet. Hotelbeds e Omnibees entram depois que esse fluxo fechar de ponta a ponta. |
| AD-019 | Uma reserva leva **um** tipo de quarto e **uma** tarifa. A quantidade pode ser maior que um, do mesmo tipo, limitada ao que a busca pediu e ao que o calendário tem livre. Tipos diferentes viram reservas separadas. |
| AD-020 | O preço que o parceiro lança no calendário é o preço que o hóspede paga, por quarto por noite, com impostos inclusos. A comissão sai desse valor. O hóspede não vê taxa de plataforma nem taxa de limpeza. |
| AD-021 | O parceiro abre as noites em que quer receber hóspede. Noite sem configuração fica fora de venda. Bloquear o dia ou algumas unidades, porque não pode receber ou porque alugou fora do Revoar, tira essa vaga da reserva imediata e do pedido sob consulta. Reserva já confirmada na plataforma permanece. |

O formato da jornada segue o que o Airbnb faz quando o anúncio é um hotel ou uma pousada: busca, ficha, escolha de quarto, fechamento. O fechamento imediato é o "Reserve" do Airbnb. O sob consulta é o "Solicitar reserva", com uma diferença de propósito: no Revoar o PIX é o meio principal, e PIX não segura valor sem cobrar. Por isso o dinheiro só entra depois que a estadia está garantida.

---

## 2. O que já existe e o que esta fase acrescenta

A Release 0.0 entrega o lado da oferta.

| Já está no ar | Ainda não existe |
|---------------|------------------|
| Parceiro PJ, hotel, tipo de quarto, fotos, moderação até `ACTIVE` | App do hóspede |
| Endereço, horários de check-in e check-out, ocupação, camas, comodidades do quarto | Preço, calendário, tarifa, política de cancelamento |
| Landing da extranet com prévia e link para a área do hóspede | Conta obrigatória do hóspede. O checkout de convidado já funciona, e o pagamento real de PIX e cartão ainda é o ambiente de teste |
| | Caixa de pedidos na extranet |

Sem calendário de diárias, a busca não tem preço verdadeiro e o hóspede não escolhe um quarto de verdade. A extranet ganha tarifa e calendário **antes** da busca pública mostrar preço.

---

## 3. Jornada do hóspede

```
Home → Resultados → Hotel → Quarto e tarifa → Fechamento → Minhas viagens
                                      │
                                      ├─ Imediata: dados → pagamento → confirmada
                                      └─ Sob consulta: pedido → aceite → pagamento → confirmada
```

A busca fica no topo em todas as telas até o checkout e pode ser editada sem recomeçar.

### 3.1 Home

Campos, nesta ordem:

1. Destino. Cidade ou bairro, com autocomplete. No primeiro corte, as cidades com hotel `ACTIVE`.
2. Check-in e check-out. Check-out depois do check-in. Estadia máxima de 30 noites.
3. Hóspedes. Adultos (mínimo 1), crianças com idade, e quantos quartos a pessoa quer.
4. Botão Buscar.

Conta é opcional. "Entrar" e "Minhas viagens" ficam no header. Quem não tem conta segue até o pagamento e recebe o voucher e o link da reserva por e-mail.

### 3.2 Resultados

Cada card mostra a foto principal, o nome, o bairro, as estrelas, o modo de fechamento e o **preço total da estadia** para a busca corrente: diária do quarto mais barato que cabe nos hóspedes, vezes noites, vezes a quantidade de quartos pedida.

Texto do preço: "R$ 1.890 total · 3 noites · impostos inclusos".

O card só entra na lista se existir pelo menos um tipo de quarto que:

- cabe nos adultos e na ocupação total;
- tem uma tarifa cuja estadia mínima é compatível com o número de noites;
- tem vaga em **todas** as noites, na quantidade pedida.

Hotel `ACTIVE` sem tarifa ou sem vaga nas datas não aparece nessa busca. Continua acessível pela URL direta da ficha, com as datas vazias de vaga.

Filtros do primeiro corte, só com dado que o cadastro passa a ter:

| Filtro | Origem |
|--------|--------|
| Faixa de preço total | Calendário |
| Estrelas | Hotel |
| Cancelamento grátis | Tarifa Flexível ou Moderada |
| Café da manhã | Plano de refeição da tarifa |
| Reserva imediata | Modo efetivo do quarto |
| Comodidade do quarto | Amenidades já cadastradas (Wi-Fi, ar, varanda) |
| Comodidade do hotel | Lista nova no hotel: piscina, estacionamento, café no salão |

Ordenação padrão: menor preço total. Também: melhor avaliação (quando houver review) e estrelas. O ranking por IA da Fase 3 fica para depois. Mapa fica para a Release 1.0.

Estado vazio: "Nada livre nessas datas" e um atalho para repetir a busca com as datas deslocadas em três dias, quando houver vaga.

### 3.3 Ficha do hotel

URL: `/hoteis/[slug]`, com as datas e os hóspedes na query.

Blocos, de cima para baixo:

1. Galeria. A foto principal e as demais do hotel.
2. Nome, estrelas, endereço, horários de check-in e check-out.
3. Resumo da busca, editável.
4. Lista de quartos disponíveis naquelas datas. Este é o bloco de decisão.
5. Descrição.
6. Comodidades do hotel.
7. Mapa estático com o pin, quando houver latitude e longitude. Mapa interativo da listagem continua na Release 1.0.
8. Regras da casa: horários, o que está incluso, o que é pago no local.
9. Avaliações, quando a Release 1.0 ligar reviews. Até lá o bloco não aparece.

### 3.4 Escolha do quarto e da tarifa

Cada quarto mostra foto, nome, camas, tamanho, ocupação, comodidades e as tarifas daquele quarto para as datas.

Cada tarifa mostra:

- nome ("Flexível com café", "Não reembolsável");
- plano de refeição: só quarto, café, meia pensão;
- política em uma frase, mais o simulador "se cancelar em [data], reembolso de R$ X";
- estadia mínima, quando for maior que uma noite;
- preço total da linha (diária de cada noite somada, vezes a quantidade);
- modo efetivo: "Reserva imediata" ou "Sob consulta · resposta em até 24 h".

O hóspede escolhe **uma** linha. A quantidade começa no número de quartos da busca e pode baixar até 1, nunca acima do menor número de vagas entre as noites.

O botão acompanha o modo:

- imediata: "Reservar";
- sob consulta: "Solicitar reserva".

Revalidação de preço e vaga ao abrir a ficha e de novo ao entrar no checkout. Se o total subir mais de 2% desde a listagem, um modal pede confirmação explícita antes de seguir. Abaixo disso, segue e mostra o valor novo.

### 3.5 Reserva imediata

O quarto fica segurado por 15 minutos. Uma extensão de 10 minutos, uma vez. O timer fica visível. Se expirar, a vaga volta e o hóspede refaz a escolha.

**Tela 1 — Quem se hospeda**

- Nome, e-mail, telefone, CPF do hóspede principal.
- Nomes dos demais, conforme a ocupação.
- Idade das crianças.
- Consentimento de termos e LGPD.
- Quem já tem conta entra por aqui; quem não tem segue como convidado.

**Tela 2 — Pagamento**

- Resumo imóvel: hotel, datas, quarto, tarifa, quantidade, política, total. Esse resumo não muda no meio do pagamento.
- PIX: QR, copia e cola, expira em 30 minutos dentro da janela do hold. Se o PIX expirar e o hold ainda valer, gera outro.
- Cartão: tokenizado no gateway, parcelamento de 1 a 10 vezes conforme a regra já escrita na Fase 3 (mínimo R$ 100, juros só quando a adquirente cobrar).
- Botão "Confirmar reserva" com o total.

**Tela 3 — Confirmação**

Pagamento capturado decrementa o calendário e a reserva nasce `CONFIRMED`. O código `REV-XXXXXX`, o voucher e o botão de calendário (`.ics`) aparecem na hora. O mesmo conteúdo vai por e-mail. Como o inventário é nosso, não há espera de bedbank.

Falha de pagamento devolve o hóspede à tela 2, com a vaga ainda segurada se o hold não expirou. Duplo clique não cria duas reservas.

### 3.6 Sob consulta

O hóspede vê, antes de enviar, a frase: "O hotel responde em até 24 horas. Você só paga se ele aceitar."

**Envio do pedido**

- Os mesmos dados da tela 1.
- Mensagem opcional ao hotel, um texto curto. Não há conversa contínua nesta fase.
- Nenhum meio de pagamento nesta etapa.
- Ao enviar, uma vaga fica retida por 24 horas e a reserva fica `REQUESTED`.
- E-mail para o hóspede ("pedido enviado") e para o parceiro ("novo pedido").

**Resposta do parceiro, na extranet**

- Aceitar ou recusar, com motivo opcional na recusa.
- Sem resposta em 24 horas, o pedido expira sozinho.

| Desfecho | O que acontece |
|----------|----------------|
| Recusa | `DECLINED`. A vaga volta. E-mail ao hóspede. Nada foi cobrado. |
| Expirou | `EXPIRED`. A vaga volta. E-mail aos dois. |
| Aceite | `AWAITING_PAYMENT`. A retenção de 24 horas é trocada por uma janela de **2 horas** para pagar. E-mail com o link de pagamento. |

**Pagamento depois do aceite**

A tela de pagamento é a mesma da reserva imediata. PIX e cartão. Se as 2 horas acabam sem pagamento, `EXPIRED`, a vaga volta e o hotel é avisado. Dentro das 2 horas, um PIX de 30 minutos pode ser gerado de novo.

Pagamento capturado leva a `CONFIRMED`, voucher e e-mail, igual à reserva imediata.

O hóspede pode desistir enquanto o pedido está `REQUESTED` ou `AWAITING_PAYMENT`, sem custo.

### 3.7 Minhas viagens

Três listas: próximas, anteriores, canceladas.

Quem reservou sem conta abre pelo link do e-mail (token de 7 dias, renovável por um novo e-mail). Quem tem conta vê todas as reservas daquele e-mail.

Cada reserva mostra status, hotel, quarto, datas, total, política congelada no momento da compra e o voucher. O voucher também fica disponível para salvar no celular.

### 3.8 Cancelamento

O botão só aparece em reserva `CONFIRMED` com check-in futuro.

O relógio da política começa em `confirmedAt`, não no pedido. Antes do pagamento, desistir é sempre integral e imediato, porque não houve cobrança.

| Política | Reembolso |
|----------|-----------|
| Flexível | Integral até 24 horas antes do check-in |
| Moderada | Integral até 7 dias antes do check-in |
| Restrita | 50% até 7 dias antes; depois, nenhum |
| Não reembolsável | Nenhum, salvo o direito de arrependimento abaixo |

Direito de arrependimento (compra online): se o cancelamento ocorre em até 7 dias corridos depois da confirmação **e** o check-in está a mais de 7 dias, o reembolso é integral, qualquer que seja a tarifa.

PIX: o prazo comunicado é de até 5 dias úteis. Cartão: estorno na fatura, em um ou dois ciclos. O status da reserva vai para `CANCELLED` na hora; o reembolso tem o próprio status.

Cancelar no meio da estadia e mudar datas não têm self-service. O hóspede fala com o suporte.

### 3.9 Avaliação

Depois do check-out, uma vez por reserva: nota de 1 a 5 e um texto. Entra na ficha quando a moderação publica. Fica na Release 1.0, fora do primeiro fechamento.

---

## 4. O que muda na extranet

O parceiro só configura isso em hotel que ele já pode editar. Trocar o modo de reserva, a tarifa ou o calendário **não** devolve o hotel para análise. O conteúdo que o admin já aprovou (texto, fotos, endereço) continua sujeito à regra atual: hotel ativo volta a rascunho para corrigir e só republica com nova aprovação.

### 4.1 Modo de reserva

Na ficha do hotel, um controle:

- Reserva imediata
- Sob consulta

No quarto, três opções: herdar o hotel, imediata, sob consulta. O valor efetivo é o do quarto quando ele não herda.

Hotel novo nasce como reserva imediata.

### 4.2 Tarifa

Pelo menos uma tarifa por tipo de quarto antes de o quarto aparecer numa busca com datas. Campos:

| Campo | Valores |
|-------|---------|
| Nome | Texto curto |
| Cancelamento | Flexível, Moderada, Restrita, Não reembolsável |
| Refeição | Só quarto, Café, Meia pensão |
| Estadia mínima | Noites, padrão 1 |
| Pago no local | Texto opcional (estacionamento, taxa de resort) |

### 4.3 Calendário

Grade mensal por tipo de quarto. Cada noite está em um de três estados:

| Estado | O que o parceiro fez | O que o hóspede pode fazer |
|--------|----------------------|----------------------------|
| Sem configuração | Ainda não abriu a noite | Nada. A noite não entra na busca |
| Aberta | Definiu o preço e deixou ao menos uma unidade livre | Reservar na hora ou solicitar, até o número de unidades livres |
| Bloqueada | Tirou unidades de venda | Nada nessas unidades. As que continuam livres seguem abertas |

Abrir e bloquear valem para um dia ou para um intervalo. O aviso fixo na grade é: "Alugou fora do Revoar? Bloqueie essas noites."

Ao abrir, o parceiro informa o preço da diária e quantas unidades daquele tipo estão à venda. Ao bloquear, informa quantas unidades saem de venda e o motivo: não pode receber, ou alugou fora da plataforma. Bloquear o dia inteiro zera o que ainda está livre.

A vaga livre de uma noite é: unidades à venda, menos as reservas confirmadas na plataforma, menos as retenções de checkout, menos as unidades bloqueadas. A vaga é do tipo de quarto e vale para todas as tarifas dele. Duas tarifas no mesmo dia não dobram o estoque. O preço é da tarifa.

Noite ocupada por uma reserva confirmada no Revoar já aparece assim na grade. O parceiro não precisa bloqueá-la. O bloqueio é para o que aconteceu fora, ou para o que ele não quer vender. Bloquear não cancela reserva `CONFIRMED`.

Se há 4 quartos daquele tipo e 1 foi alugado por fora, ele bloqueia 1 unidade naquelas noites. As outras 3 continuam à venda. Não dá para bloquear uma unidade que já está confirmada ou retida num checkout: a tela mostra o conflito e o bloqueio fica no que ainda está livre.

Um hold já iniciado (15 minutos na reserva imediata, 24 horas num pedido, 2 horas para pagar) continua com a unidade que segurou. O bloqueio vale dali para a frente. Se o hóspede chega no pagamento e a vaga livre acabou, a reserva não confirma e nada é cobrado.

### 4.4 Pedidos e reservas

Nova área "Reservas":

- Pedidos sob consulta, com aceitar e recusar, e o tempo que falta das 24 horas.
- Reservas confirmadas, só leitura: código, hóspede, quarto, datas, total, status.
- Aviso em tempo real no mesmo canal de eventos que a extranet já usa, para o pedido não depender de atualizar a página.

---

## 5. O que muda no admin

Na fatia de pagamento, o operador passa a:

- buscar reserva por código, e-mail ou hotel;
- reenviar voucher;
- cancelar com motivo, com o reembolso calculado pela política ou integral quando o operador marcar exceção;
- ver o histórico de status.

Isso fica auditado, no mesmo espírito do histórico de status do hotel.

---

## 6. Máquina de estados

```
IMEDIATA
  HELD (15 min) → PAYMENT_PENDING → CONFIRMED
                      │                    │
                      └─ hold/PIX expira   └─ cancelamento → CANCELLED
                         → CANCELLED

SOB CONSULTA
  REQUESTED (24 h) → AWAITING_PAYMENT (2 h) → CONFIRMED
        │                    │                      │
        ├─ recusa → DECLINED └─ sem pagamento      └─ cancelamento → CANCELLED
        ├─ 24 h → EXPIRED       → EXPIRED
        └─ hóspede desiste → CANCELLED
```

| De | Para | Quem dispara |
|----|------|----------------|
| — | HELD | Hóspede entra no checkout de um quarto imediato |
| HELD | PAYMENT_PENDING | Gera PIX ou envia cartão |
| HELD | CANCELLED | Hold expirou, ou hóspede saiu |
| PAYMENT_PENDING | CONFIRMED | Pagamento capturado |
| PAYMENT_PENDING | HELD | Pagamento recusado e o hold ainda vale |
| — | REQUESTED | Hóspede envia pedido sob consulta |
| REQUESTED | DECLINED | Parceiro recusa |
| REQUESTED | EXPIRED | 24 horas sem resposta |
| REQUESTED | CANCELLED | Hóspede desiste |
| REQUESTED | AWAITING_PAYMENT | Parceiro aceita |
| AWAITING_PAYMENT | CONFIRMED | Pagamento capturado dentro de 2 horas |
| AWAITING_PAYMENT | EXPIRED | 2 horas sem pagamento |
| AWAITING_PAYMENT | CANCELLED | Hóspede desiste |
| CONFIRMED | CANCELLED | Hóspede, parceiro via suporte, ou admin |

`DECLINED` e `EXPIRED` são finais. `FAILED` da Fase 6 deixa de ser o caminho do inventário `DIRECT`: a vaga é nossa, e a confirmação é o próprio decremento no mesmo passo da captura. Se o decremento falhar depois da captura, o pagamento é estornado por inteiro e a reserva vai para `CANCELLED` com motivo `inventory_conflict`. O hóspede vê: "Não foi possível confirmar. Nada foi cobrado."

Estados que continuam valendo quando um bedbank existir: `CONFIRMING` e `FAILED`, como a Fase 6 descreve. Eles não entram no fluxo `DIRECT`.

---

## 7. Dados

O schema de hoje tem hotel, tipo de quarto e fotos. Esta fase acrescenta o que falta, em cima do desenho da Fase 6, com os campos do modo de reserva.

### 7.1 Catálogo

`Hotel`

- `bookingMode`: `INSTANT` ou `REQUEST`. Padrão `INSTANT`.
- `amenities`: lista de comodidades do hotel.
- `houseRules`: texto curto opcional.

`RoomType`

- `bookingMode`: `INHERIT`, `INSTANT` ou `REQUEST`. Padrão `INHERIT`.

`RatePlan` (novo): hotel, quarto, nome, política, regras congeláveis, plano de refeição, estadia mínima, texto "pago no local", ativo.

`DailyRate` (novo): tarifa, data, preço em centavos. A vaga **não** fica aqui.

`RoomInventory` (novo): tipo de quarto, data, `unitsForSale`, `blockedUnits`, `blockReason` (`UNAVAILABLE` ou `RENTED_OFFLINE`, vazio quando `blockedUnits` é zero). Único por quarto e data. As tarifas daquele quarto leem a mesma vaga. O preço continua em `DailyRate`.

`InventoryLock` (novo): reserva, tipo de quarto, data, quantidade, `expiresAt`. Segura as unidades do hold de 15 minutos, das 24 horas do pedido ou das 2 horas de pagamento.

### 7.2 Reserva e pagamento

Como a Fase 6, mais:

`Booking`

- `bookingMode` no momento da compra (`INSTANT` ou `REQUEST`), imutável;
- `quantity`;
- `respondBy` (pedido) e `payBy` (janela de 2 horas);
- `guestMessage` opcional;
- `declineReason` opcional;
- snapshot de preço, política, quarto e hotel, para a ficha não mudar se o parceiro editar depois.

`BookingGuest`, `BookingStatusHistory`, `Payment`, `Refund` como a Fase 6.

`User` do hóspede é outra tabela, separada de `PartnerUser` e `AdminUser`. E-mail único. Senha opcional. Reserva de convidado guarda o e-mail na própria reserva e pode ser ligada à conta depois, quando esse e-mail criar senha.

CPF segue guardado como hash, como a Fase 6 já exige.

### 7.3 Preço e vaga na prática

Para cada noite do intervalo, a diária é a linha do calendário daquela tarifa. O total é a soma das diárias, vezes a quantidade. A vaga livre é `unitsForSale − confirmadas na plataforma − locks − blockedUnits`. Noite sem preço, sem quantidade ou com vaga livre menor que a quantidade torna a tarifa indisponível. Unidade com `blockReason` `RENTED_OFFLINE` conta como bloqueada: não entra em reserva imediata nem em pedido sob consulta.

Aceitar duas reservas ao mesmo tempo sobre a última vaga usa trava transacional: quem commitar o lock primeiro fica com o quarto. O outro recebe "Esse quarto acabou de ser reservado" e volta à ficha.

Hotel que sai de `ACTIVE` (correção, rejeição, inativação) some da busca. Locks ainda não pagos são liberados. Pedido `REQUESTED` é recusado pelo sistema. Checkout `HELD` que já começou pode concluir se o lock ainda vale. Reserva `CONFIRMED` não é desfeita por isso.

---

## 8. Aplicação

Novo app `apps/guest` (Next.js, mesma família da extranet), para a sessão do hóspede não se misturar com a do parceiro. A landing da extranet passa a apontar "Área do hóspede" para esse app.

| Rota | Uso |
|------|-----|
| `/` | Home com a busca |
| `/busca` | Resultados |
| `/hoteis/[slug]` | Ficha e escolha do quarto |
| `/checkout/[id]` | Dados e pagamento |
| `/reservas/[code]` | Confirmação, voucher, cancelar. Abre com a conta ou com o token do e-mail |
| `/conta/viagens` | Minhas viagens |
| `/entrar`, `/criar-conta` | Conta opcional |

API nova em `apps/api`, módulo público de leitura e módulo de reserva. Escrita de tarifa, calendário e aceite fica no módulo da extranet, com o JWT do parceiro. Busca de reserva e cancelamento forçado ficam no módulo do admin.

Pagamento: Mercado Pago, PIX e cartão tokenizado, como a Fase 7. O servidor guarda a chave de idempotência. O browser nunca vê segredo de gateway.

---

## 9. Ordem de construção

Cada fatia entra no ar só quando a anterior fecha. Hotelbeds não está em nenhuma delas.

### Fatia 1 — Tarifa e calendário na extranet

O parceiro define modo, tarifa e calendário. Sem isso a busca mente.

Pronto quando: um hotel `ACTIVE` de teste tem quarto com preço e vaga, e a vaga não duplica entre duas tarifas. Uma noite bloqueada, no dia inteiro ou em parte das unidades, e uma unidade marcada como alugada fora não aparecem como reserváveis. Uma reserva já confirmada na plataforma continua no calendário depois do bloqueio.

### Fatia 2 — Vitrine

App do hóspede com home, resultados e ficha. Dá para escolher quarto e tarifa. O botão de reservar ainda não cobra: a fatia 3 liga o fechamento. O preço na lista e na ficha é o total real.

Pronto quando: a busca de Fortaleza com datas devolve só quarto que cabe e que tem vaga, com o mesmo total que a ficha mostra.

### Fatia 3 — Reserva imediata

Hold, dados, PIX, cartão, confirmação, voucher por e-mail, Minhas viagens, cancelamento pela política. Admin busca a reserva e reenvia o voucher.

Pronto quando: pagar confirma uma reserva e baixa o calendário; pagar duas vezes não cria duas; cancelar na política devolve o valor e a vaga; PIX expirado não deixa reserva confirmada.

### Fatia 4 — Sob consulta

Pedido, caixa da extranet, aceite, recusa, expiração em 24 horas, pagamento em 2 horas, desistência sem cobrança.

Pronto quando: recusa e silêncio de 24 horas devolvem a vaga sem qualquer pagamento; aceite seguido de PIX confirma; aceite sem pagamento em 2 horas devolve a vaga.

### Fatia 5 — Lançamento dos cinco destinos

Avaliação pós-estadia, mapa na listagem, coleções, lembrete de check-in. Operação: hotéis piloto no Rio, São Paulo, Salvador, Fortaleza e Gramado. Integração com bedbank só começa aqui, se o fluxo `DIRECT` já estiver estável.

---

## 10. Fora deste plano

- Casa, apartamento inteiro, anfitrião pessoa física.
- Vários tipos de quarto no mesmo pedido.
- Conversa contínua com o hotel.
- Pré-autorização de cartão no pedido sob consulta.
- Taxa de limpeza e preço por pessoa.
- Alteração de datas pelo hóspede.
- Voos, pacotes, experiências, fidelidade.
- Hotelbeds e Omnibees antes da fatia 5.
- App nativo. O site é responsivo, mobile primeiro, como a Fase 4.

---

## 11. Critérios da área pronta

1. O hóspede escolhe destino, datas e pessoas, abre um hotel e escolhe um quarto e uma tarifa com o total visível desde a lista.
2. Quarto imediato: pagou, recebeu código e voucher, calendário baixou.
3. Quarto sob consulta: o hotel aceita ou recusa; o hóspede só paga depois do aceite; recusa não gera cobrança.
4. Cancelar dentro da política devolve o que a tabela da seção 3.8 descreve, e devolve a vaga das noites futuras.
5. Hotel que não está `ACTIVE`, quarto sem tarifa, noite sem configuração e noite bloqueada (inclusive unidade alugada fora da plataforma) não aparecem como reserváveis. Bloquear não cancela reserva já confirmada no Revoar.

---

*Este documento faz parte do Master Plan Revoar. Requisitos de busca, pagamento e cancelamento continuam nas Fases 3 e 4. O ciclo de vida com bedbank continua na Fase 6 e só volta a valer quando a fatia 5 abrir integração.*
