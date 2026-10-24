# Fase 5 — Desenho de Sistema (System Design)

**Projeto:** Revoar  
**Versão:** 1.0  
**Data:** Junho/2026  
**Dependências:** Fases 0–4  
**Status:** Concluída

---

## 1. Visão arquitetural

Arquitetura **modular orientada a serviços** (microservices pragmáticos), deploy em **Kubernetes (EKS)**, comunicação **sync REST/gRPC** para fluxos user-facing e **async event-driven** para pós-processamento, reconciliação e notificações.

### 1.1 Princípios

| Princípio | Decisão |
|-----------|---------|
| Separation of concerns | Serviços por domínio bounded context |
| Fail fast, recover gracefully | Circuit breakers; sagas compensatórias |
| Idempotência everywhere | Booking e payment com idempotency keys |
| Cache agressivo, revalidate crítico | Redis + CDN; revalidação checkout |
| Observability first | OpenTelemetry, structured logs, SLOs |
| Security by design | Zero trust inter-service; secrets manager |

---

## 2. Diagrama de alto nível (C4 — Context)

```
                    ┌─────────────┐
                    │   Viajante  │
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────▼──────┐
                    │  CDN/WAF    │
                    │ CloudFront  │
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │   API Gateway (Kong)    │
              │   Rate limit, Auth, TLS │
              └────────────┬────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
┌────▼────┐  ┌─────────────▼────────────┐  ┌────▼────┐
│ Web App │  │     Backend Services      │  │Backoffice│
│ Next.js │  │  (EKS cluster sa-east-1)  │  │  Admin  │
└─────────┘  └─────────────┬────────────┘  └─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐        ┌─────▼─────┐
   │PostgreSQL│         │   Redis   │        │ OpenSearch│
   │  (RDS)   │         │ ElastiCache│       │ (busca)   │
   └─────────┘         └───────────┘        └───────────┘
                             │
        ┌────────────────────┼────────────────────┐
   ┌────▼────┐  ┌───────────▼──────────┐  ┌────▼────┐
   │ SQS/SNS │  │ External Integrations │  │   S3    │
   │ EventBridge│ Hotelbeds, Omnibees  │  │ assets  │
   └─────────┘  │ Stripe/MercadoPago    │  └─────────┘
                └───────────────────────┘
```

---

## 3. Serviços (bounded contexts)

### 3.1 Catálogo de serviços

| Serviço | Responsabilidade | Stack sugerida | DB |
|---------|------------------|----------------|-----|
| **gateway-api** | Roteamento, auth, rate limit | Kong | — |
| **search-service** | Busca, filtros, ranking | Node/Go | OpenSearch + Redis |
| **catalog-service** | Metadados hotel, fotos, amenities | Node | PostgreSQL + S3 |
| **availability-service** | Disponibilidade e preços real-time | Go | Redis + PostgreSQL snapshot |
| **booking-service** | Reservas, holds, lifecycle | Go | PostgreSQL |
| **payment-service** | Cobrança, estorno, PIX | Node | PostgreSQL |
| **user-service** | Auth, perfil, LGPD | Node | PostgreSQL |
| **notification-service** | E-mail, SMS, WhatsApp, push | Node | PostgreSQL queue |
| **review-service** | Reviews pós-estadia | Node | PostgreSQL |
| **integration-hub** | Adapters bedbank/channel mgr | Go | PostgreSQL audit |
| **reconciliation-worker** | Jobs async, sagas | Go | — |
| **analytics-service** | Eventos, funil | ClickHouse/BigQuery | — |
| **admin-api** | Backoffice ops | Node | Read replicas |

### 3.2 Comunicação inter-serviços

| Padrão | Uso |
|--------|-----|
| **Sync REST** | Search → Availability (hot path) |
| **Sync gRPC** | Booking → Payment (baixa latência) |
| **Async SNS/SQS** | BookingConfirmed → Notification, Analytics |
| **EventBridge** | Scheduled jobs (reconciliação, lembretes) |
| **Outbox pattern** | Garantir publish evento pós-commit DB |

---

## 4. Fluxos técnicos críticos

### 4.1 Busca (read path)

```
Client → CDN (static) 
Client → API Gateway → search-service
    → Redis (cache key: dest+dates+guests, TTL 5min)
    → miss: OpenSearch (hotel index) + availability-service (batch quote)
    → ranking-service (ML features)
    → response JSON
```

**SLA:** P95 < 2s; cache hit ratio target 70%.

### 4.2 Reserva (write path — Saga)

```
1. booking-service: CREATE hold (15min) → availability-service lock
2. payment-service: authorize/capture (idempotency-key)
3. integration-hub: confirmSupplier(booking)
   ├─ success → booking CONFIRMED → outbox event
   └─ fail → compensate: refund payment → release hold
4. notification-service: email voucher
5. analytics-service: track conversion
```

**Padrão:** Orchestration saga no `booking-service` com estado persistido.

Estados reserva: `DRAFT → HELD → PAYMENT_PENDING → CONFIRMING → CONFIRMED | FAILED | CANCELLED`

### 4.3 Cancelamento

```
1. booking-service: validate policy → calculate refund
2. integration-hub: cancelSupplier
3. payment-service: refund (partial ou total)
4. booking-service: status CANCELLED
5. notification-service: email confirmação cancel
```

---

## 5. Estratégias de escalabilidade

### 5.1 Horizontal scaling

| Componente | Estratégia |
|------------|------------|
| Web (Next.js) | Vercel/ECS auto-scale |
| API services | HPA Kubernetes CPU/mem + custom metric (RPS) |
| Workers | KEDA scale by SQS depth |
| PostgreSQL | Read replicas; particionamento bookings por mês |
| Redis | Cluster mode; separate cache vs session |
| OpenSearch | 3+ nodes; sharding por região BR |

### 5.2 Caching strategy

| Layer | TTL | Invalidação |
|-------|-----|-------------|
| CDN static | 1 ano (hash) | Deploy |
| CDN API search | 0 (bypass) | — |
| Redis search results | 5 min | Event availability change |
| Redis hotel detail | 15 min | Webhook catalog update |
| Application L2 | Request-scoped | — |

### 5.3 Picos sazonais (jul/dez)

- Pre-warm Redis top 100 destinos
- Scale EKS node pool 3x antecipado
- Queue booking com max concurrency bedbank
- Degrade: desabilitar mapa interativo; aumentar cache TTL 15→30 min

---

## 6. Alta disponibilidade

### 6.1 Targets SLO

| Serviço | Availability | Error budget/mês |
|---------|--------------|------------------|
| Search | 99.9% | 43 min |
| Booking+Payment | 99.95% | 22 min |
| Notification | 99.5% | 3.6 h |

### 6.2 Multi-AZ

- RDS PostgreSQL Multi-AZ
- EKS nodes across 3 AZs sa-east-1
- ElastiCache Multi-AZ com auto-failover

### 6.3 Disaster recovery

| Cenário | RPO | RTO | Ação |
|---------|-----|-----|------|
| AZ failure | 0 (Multi-AZ) | Auto | Failover RDS/EKS |
| Region failure | 1h | 4h | Restore backup us-east-1* |
| Data corruption | 24h backup | 4h | Point-in-time recovery |

*DR region secundária fase 1.5.

---

## 7. Tratamento de falhas

### 7.1 Circuit breaker (bedbank)

```
Closed → failures > 50% in 30s → Open (fail fast, cache)
Open → 60s → Half-open → probe → Closed/Open
```

### 7.2 Retry policy

| Chamada | Retries | Backoff |
|---------|---------|---------|
| Bedbank confirm | 3 | exp 1s, 2s, 4s |
| Payment capture | 2 | 2s, 5s |
| Email send | 5 | SQS visibility timeout |

### 7.3 Degraded modes

| Modo | Trigger | Comportamento |
|------|---------|---------------|
| **Search degraded** | Bedbank down | Cache + banner |
| **Booking queue** | Concurrency limit | Async confirm + email |
| **Payment only PIX** | Gateway card down | Hide cartão temporariamente |

### 7.4 Dead letter queues

- SQS DLQ para booking confirm failures → reconciliation-worker manual/auto.

---

## 8. Segurança

| Camada | Controle |
|--------|----------|
| Edge | WAF OWASP; bot detection; geo block |
| Auth | JWT RS256; refresh rotation; OAuth Google |
| Inter-service | mTLS service mesh (Istio) fase 1.5 |
| Secrets | AWS Secrets Manager; rotation 90d |
| PII | Tokenização CPF; column-level encryption |
| PCI | SAQ A — cartão nunca toca servidores Revoar |
| Audit | CloudTrail + audit_log table imutável |

---

## 9. Observabilidade

```
Apps → OpenTelemetry Collector → Tempo (traces) + Prometheus (metrics) + Loki (logs)
                                        ↓
                                  Grafana dashboards
                                  PagerDuty alerts
```

**Alertas críticos:**
- Booking confirm failure rate > 1%
- Payment capture failure > 2%
- Search P95 > 3s por 5 min
- DLQ depth > 100

---

## 10. Stack tecnológica recomendada

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15, React, TypeScript, Tailwind |
| Mobile future | React Native ou Flutter |
| API | Node.js (NestJS) + Go (hot paths) |
| DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Search | OpenSearch |
| Queue | AWS SQS + SNS |
| IaC | Terraform |
| CI/CD | GitHub Actions → ArgoCD |
| Cloud | AWS sa-east-1 (primário) |

---

## 11. API Gateway — rotas públicas

| Método | Rota | Serviço |
|--------|------|---------|
| GET | `/v1/search` | search-service |
| GET | `/v1/hotels/:id` | catalog-service |
| GET | `/v1/hotels/:id/availability` | availability-service |
| POST | `/v1/bookings/hold` | booking-service |
| POST | `/v1/bookings/:id/pay` | payment-service |
| GET | `/v1/bookings/:id` | booking-service |
| POST | `/v1/bookings/:id/cancel` | booking-service |
| GET | `/v1/users/me/bookings` | user-service + booking |

---

## 12. Considerações futuras (voos)

- **integration-hub** terá adapter pattern: `HotelSupplier`, `FlightSupplier`.
- **booking-service** evolui para `trip-service` com itinerary composto.
- **search-service** federado cross-product.

---

## 13. Conclusões

1. **Saga booking** com compensação é core — não pode ser monólito acoplado.
2. **Cache + revalidação** equilibra performance e consistência.
3. **Async** para tudo que não bloqueia UX (notificações, analytics).
4. **Próxima fase (Modelagem de Dados)** detalha entidades e lifecycle.

---

*Base para Fase 6 — Modelagem de Dados.*

---

## Addendum de implementação — Release 0.0 (Jul/2026)

O desenho acima é o **alvo** (microservices em EKS). O que está no disco hoje é o **monólito pragmático** da AD-002:

```
apps/extranet  (Next.js :3000)  ─┐
apps/admin     (Next.js :3001)  ─┼─► apps/api (NestJS :3002)
                                 │      ├─ REST (Prisma / PostgreSQL)
                                 │      ├─ S3 presign (LocalStack / AWS)
                                 │      └─ EventBusService (EventEmitter → SSE)
                                 └─ packages/shared + packages/database
```

| Conceito do Master Plan | Implementação atual | Quando extrair |
|-------------------------|---------------------|----------------|
| notification-service | `NotificationsService` (e-mail) + `EventBusService` (SSE in-app) | Release 0.5+ |
| Event-driven async | `RevoarEvent` in-process | Redis Pub/Sub quando API >1 instância |
| Web App Next.js | Dois apps: extranet (parceiro) e (futuro) site público | Release 0.1 = site viajante |
| Backoffice Admin | `apps/admin` — só moderação de cadastro | RF-051 (reservas) ainda não |

**Sync UI (AD-009):** TanStack Query + SSE. WebSocket continua reservado para fluxos bidirecionais da Release 0.5. Detalhe: `.specs/features/sync-tempo-real/design.md`.
