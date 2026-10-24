# Fase 10 — Diagramas

**Projeto:** Revoar  
**Versão:** 1.0  
**Data:** Junho/2026  
**Dependências:** Fases 0–9  
**Status:** Concluída

---

Este documento consolida todos os diagramas de engenharia do Master Plan Revoar, alinhados às decisões das fases anteriores.

---

## 1. Diagrama de arquitetura (C4 — Container)

```mermaid
flowchart TB
    subgraph Clients
        WEB[Web App Next.js]
        ADMIN[Backoffice Admin]
    end

    subgraph Edge
        CDN[CloudFront CDN]
        WAF[WAF]
        GW[Kong API Gateway]
    end

    subgraph EKS["EKS Cluster sa-east-1"]
        SEARCH[search-service]
        CATALOG[catalog-service]
        AVAIL[availability-service]
        BOOK[booking-service]
        PAY[payment-service]
        USER[user-service]
        NOTIF[notification-service]
        REVIEW[review-service]
        INT[integration-hub]
        RECON[reconciliation-worker]
        ANAL[analytics-service]
    end

    subgraph Data
        PG[(PostgreSQL RDS)]
        REDIS[(Redis ElastiCache)]
        OS[(OpenSearch)]
        S3[(S3 Assets)]
    end

    subgraph Messaging
        SQS[SQS Queues]
        SNS[SNS Topics]
        EB[EventBridge]
    end

    subgraph External
        HB[Hotelbeds API]
        OB[Omnibees API]
        MP[Mercado Pago]
        SG[SendGrid]
        WA[WhatsApp API]
        MB[Mapbox]
    end

    WEB --> CDN --> WAF --> GW
    ADMIN --> GW
    GW --> SEARCH & CATALOG & AVAIL & BOOK & PAY & USER & REVIEW

    SEARCH --> OS & REDIS & AVAIL
    CATALOG --> PG & S3
    AVAIL --> REDIS & INT
    BOOK --> PG & PAY & INT & SNS
    PAY --> PG & MP
    USER --> PG
    NOTIF --> SG & WA & SQS
    REVIEW --> PG
    INT --> HB & OB
    RECON --> SQS & BOOK & PAY & INT
    ANAL --> SNS

    SNS --> NOTIF & ANAL
    EB --> RECON
```

---

## 2. Diagrama de arquitetura — camadas

```mermaid
flowchart LR
    subgraph Presentation
        P1[Next.js SSR/CSR]
        P2[Admin React]
    end

    subgraph Application
        A1[API Gateway Auth RateLimit]
        A2[Domain Services]
        A3[Integration Hub ACL]
    end

    subgraph Domain
        D1[Booking Saga]
        D2[Payment Orchestration]
        D3[Search Ranking]
    end

    subgraph Infrastructure
        I1[PostgreSQL]
        I2[Redis]
        I3[OpenSearch]
        I4[SQS/SNS]
        I5[Observability OTel]
    end

    P1 --> A1 --> A2 --> D1 & D2 & D3
    A2 --> A3
    D1 & D2 & D3 --> I1 & I2 & I3 & I4
    A2 --> I5
```

---

## 3. Diagrama de sequência — Reserva (happy path)

```mermaid
sequenceDiagram
    autonumber
    actor U as Viajante
    participant W as Web App
    participant GW as API Gateway
    participant B as booking-service
    participant A as availability-service
    participant P as payment-service
    participant I as integration-hub
    participant HB as Hotelbeds
    participant MP as Mercado Pago
    participant N as notification-service
    participant E as SendGrid

    U->>W: Seleciona quarto → Checkout
    W->>GW: POST /bookings/hold
    GW->>B: createHold()
    B->>A: lockInventory(rateKey, 15min)
    A-->>B: holdId, expiresAt
    B-->>W: booking HELD + timer

    U->>W: Preenche dados + PIX
    W->>GW: POST /bookings/{id}/pay
    GW->>P: createPixPayment(idempotencyKey)
    P->>MP: POST /payments (pix)
    MP-->>P: qrCode, paymentId
    P-->>W: QR Code exibido

    U->>MP: Paga via app banco
    MP->>GW: Webhook payment.approved
    GW->>P: handleWebhook()
    P->>B: paymentCaptured(bookingId)
    B->>B: status → CONFIRMING

    B->>I: confirmBooking(booking)
    I->>HB: CheckRate + POST /bookings
    HB-->>I: confirmationCode
    I-->>B: supplierConfirmed

    B->>B: status → CONFIRMED
    B->>N: event BookingConfirmed
    N->>E: Send voucher email
    E-->>U: E-mail confirmação

    W-->>U: Tela sucesso + voucher
```

---

## 4. Diagrama de sequência — Falha fornecedor (compensação)

```mermaid
sequenceDiagram
    autonumber
    participant B as booking-service
    participant P as payment-service
    participant I as integration-hub
    participant HB as Hotelbeds
    participant MP as Mercado Pago
    participant N as notification-service
    actor U as Viajante

    Note over B: status CONFIRMING
    B->>I: confirmBooking()
    I->>HB: POST /bookings
    HB-->>I: ERROR / TIMEOUT
    I-->>B: SupplierFailed

    B->>P: refundFull(paymentId)
    P->>MP: POST /refunds
    MP-->>P: refunded
    P-->>B: refundConfirmed

    B->>B: status → FAILED
    B->>N: event BookingFailed
    N-->>U: E-mail estorno automático

    Note over U: "Seu pagamento foi estornado"
```

---

## 5. Diagrama de sequência — Cancelamento

```mermaid
sequenceDiagram
    autonumber
    actor U as Viajante
    participant W as Web App
    participant B as booking-service
    participant I as integration-hub
    participant HB as Hotelbeds
    participant P as payment-service
    participant N as notification-service

    U->>W: Cancelar reserva
    W->>B: GET /bookings/{id}/cancel-preview
    B-->>W: refundAmount, penalty, policy

    U->>W: Confirma cancelamento
    W->>B: POST /bookings/{id}/cancel

    B->>I: cancelBooking(supplierRef)
    I->>HB: DELETE /bookings/{ref}
    HB-->>I: cancelled
    I-->>B: ok

    alt Reembolso parcial ou total
        B->>P: refund(amount)
        P-->>B: refundId
    end

    B->>B: status → CANCELLED
    B->>N: event BookingCancelled
    N-->>U: E-mail confirmação
    W-->>U: "Reembolso em até 5 dias úteis"
```

---

## 6. Diagrama de entidades (ERD)

```mermaid
erDiagram
    HOTELS ||--o{ ROOM_TYPES : has
    ROOM_TYPES ||--o{ RATE_PLANS : offers
    RATE_PLANS ||--o{ DAILY_RATES : prices

    USERS ||--o{ BOOKINGS : makes
    HOTELS ||--o{ BOOKINGS : receives
    ROOM_TYPES ||--o{ BOOKINGS : reserved
    RATE_PLANS ||--o{ BOOKINGS : uses

    BOOKINGS ||--o{ BOOKING_GUESTS : includes
    BOOKINGS ||--o| PAYMENTS : has
    BOOKINGS ||--o{ BOOKING_STATUS_HISTORY : tracks
    BOOKINGS ||--o| REVIEWS : generates

    PAYMENTS ||--o{ REFUNDS : may_have
    PAYMENTS ||--o{ CHARGEBACKS : may_have

    USERS ||--o{ USER_CONSENTS : grants
    USERS ||--o{ SAVED_TRAVELERS : stores

    HOTELS {
        uuid id PK
        string supplier_code
        enum supplier_type
        string name
        string city
        string state
        decimal latitude
        decimal longitude
        enum status
    }

    ROOM_TYPES {
        uuid id PK
        uuid hotel_id FK
        string name
        int max_occupancy
        jsonb amenities
    }

    RATE_PLANS {
        uuid id PK
        uuid room_type_id FK
        enum cancellation_policy_type
        jsonb cancellation_rules
        enum meal_plan
    }

    BOOKINGS {
        uuid id PK
        string booking_code UK
        uuid user_id FK
        enum status
        date check_in
        date check_out
        int total_amount_cents
        jsonb cancellation_policy_snapshot
        string supplier_confirmation_code
    }

    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        int amount_cents
        enum method
        enum status
        string gateway_payment_id
    }

    REVIEWS {
        uuid id PK
        uuid booking_id FK UK
        int rating
        text comment
        enum status
    }
```

---

## 7. State machine — Booking

```mermaid
stateDiagram-v2
    [*] --> HELD : createHold()

    HELD --> PAYMENT_PENDING : startPayment()
    HELD --> CANCELLED : holdExpired()

    PAYMENT_PENDING --> CONFIRMING : paymentCaptured()
    PAYMENT_PENDING --> HELD : paymentFailed(retry)

    CONFIRMING --> CONFIRMED : supplierConfirmed()
    CONFIRMING --> FAILED : supplierFailed()

    CONFIRMED --> CANCELLED : userCancel()
    CONFIRMED --> COMPLETED : checkoutDone()

    FAILED --> [*]
    CANCELLED --> [*]
    COMPLETED --> [*]

    note right of CONFIRMING
        Saga ativa
        Retry 3x bedbank
        Timeout → FAILED + refund
    end note
```

---

## 8. Fluxos de usuário

### 8.1 Busca de hotéis

```mermaid
flowchart TD
    A[Home] --> B{Preenche busca}
    B --> C[Autocomplete destino]
    C --> D[Seleciona datas e hóspedes]
    D --> E[Buscar]
    E --> F[Resultados skeleton load]
    F --> G[Lista + preço total]
    G --> H{Ações}
    H --> I[Aplicar filtros]
    H --> J[Ordenar]
    H --> K[Ver mapa]
    H --> L[Editar busca]
    I --> G
    J --> G
    K --> G
    L --> B
    G --> M[Clique hotel]
    M --> N[Detalhe hotel]
```

### 8.2 Reserva e pagamento

```mermaid
flowchart TD
    A[Detalhe hotel] --> B[Selecionar quarto/tarifa]
    B --> C[Reservar agora]
    C --> D[Tela 1: Dados hóspede]
    D --> E[Tela 2: Pagamento]
    E --> F{Método}
    F --> G[PIX QR Code]
    F --> H[Cartão tokenizado]
    G --> I{Pago?}
    H --> J{3DS + Aprovado?}
    I -->|Sim| K[Confirmando...]
    I -->|Timeout| L[PIX expirado - regenerar]
    J -->|Sim| K
    J -->|Não| M[Erro - retry]
    K --> N{Fornecedor OK?}
    N -->|Sim| O[Tela 3: Sucesso + Voucher]
    N -->|Não| P[Estorno + Erro claro]
    L --> E
    M --> E
```

### 8.3 Cancelamento

```mermaid
flowchart TD
    A[Minhas viagens] --> B[Selecionar reserva]
    B --> C[Cancelar reserva]
    C --> D[Simulador reembolso]
    D --> E{Non-refundable?}
    E -->|Sim| F[Modal aviso forte]
    E -->|Não| G[Confirmar cancelamento]
    F --> H{Manter ou cancelar?}
    H -->|Manter| B
    H -->|Cancelar| G
    G --> I[Processando...]
    I --> J{Fornecedor OK?}
    J -->|Sim| K[Reembolso iniciado]
    J -->|Retry| I
    K --> L[E-mail confirmação]
    L --> M[Status CANCELLED]
```

---

## 9. Diagrama de deployment (AWS)

```mermaid
flowchart TB
    subgraph Internet
        USER[Usuários]
    end

    subgraph AWS_sa_east_1
        subgraph AZ_a
            EKS1[EKS Node]
            RDS_P[(RDS Primary)]
        end
        subgraph AZ_b
            EKS2[EKS Node]
            RDS_S[(RDS Standby)]
        end
        subgraph AZ_c
            EKS3[EKS Node]
        end

        CF[CloudFront]
        ALB[ALB]
        REDIS[(Redis Cluster)]
        OS_CLUSTER[(OpenSearch)]
    end

    USER --> CF --> ALB
    ALB --> EKS1 & EKS2 & EKS3
    EKS1 & EKS2 & EKS3 --> RDS_P
    RDS_P -.-> RDS_S
    EKS1 & EKS2 & EKS3 --> REDIS & OS_CLUSTER
```

---

## 10. Diagrama de integrações

```mermaid
flowchart LR
    subgraph Revoar
        IH[integration-hub]
        PS[payment-service]
        NS[notification-service]
    end

    subgraph Hotel Suppliers
        HB[Hotelbeds REST]
        WB[WebBeds REST]
        OM[Omnibees API]
    end

    subgraph Payments
        MP[Mercado Pago]
        ST[Stripe backup]
    end

    subgraph Comms
        SG[SendGrid]
        TW[Twilio WhatsApp]
    end

    subgraph Maps
        MB[Mapbox]
    end

    subgraph Future
        AM[Amadeus Flights]
    end

    IH --> HB & WB & OM
    PS --> MP & ST
    NS --> SG & TW

    WEB[search-service] --> MB

    IH -.->|Fase 2| AM

    style AM fill:#f9f,stroke:#333,stroke-dasharray: 5 5
```

---

## 11. Diagrama C4 — Contexto simplificado

```mermaid
C4Context
    title Diagrama de Contexto — Revoar

    Person(traveler, "Viajante", "Busca e reserva hotéis")
    Person(hotel, "Hotel Parceiro", "Fornece inventário via bedbank/channel")
    Person(ops, "Operações Revoar", "Suporte e backoffice")

    System(revoar, "Plataforma Revoar", "OTA hotéis Brasil MVP")

    System_Ext(bedbank, "Bedbank/Channel", "Hotelbeds, Omnibees")
    System_Ext(payment, "Gateway Pagamento", "Mercado Pago")
    System_Ext(email, "E-mail/SMS", "SendGrid, WhatsApp")

    Rel(traveler, revoar, "Busca, reserva, paga, cancela")
    Rel(ops, revoar, "Gerencia reservas")
    Rel(revoar, bedbank, "Availability, booking, cancel")
    Rel(revoar, payment, "PIX, cartão, estorno")
    Rel(revoar, email, "Notificações")
    Rel(hotel, bedbank, "Atualiza inventário")
```

---

## 12. Fluxo de dados — Busca (read path)

```mermaid
flowchart LR
    Q[Query destino+dates] --> GW[Gateway]
    GW --> SS[search-service]
    SS --> R{Redis cache?}
    R -->|Hit| RESP[Response]
    R -->|Miss| OS[OpenSearch filter]
    OS --> AV[availability batch quote]
    AV --> IH[integration-hub]
    IH --> HB[Hotelbeds]
    HB --> IH
    IH --> AV
    AV --> RK[ranking ML]
    RK --> CACHE[Write Redis TTL 5min]
    CACHE --> RESP
```

---

## 13. Mapa de consistência entre documentos

| Diagrama | Fase origem | Consistência verificada |
|----------|-------------|-------------------------|
| Arquitetura containers | Fase 5 | Serviços §3.1 ✓ |
| Sequência reserva | Fase 5 §4.2, Fase 7 §2.1 | Saga + Hotelbeds ✓ |
| ERD | Fase 6 §2 | Entidades + FKs ✓ |
| State machine | Fase 6 §3 | Transições §3.2 ✓ |
| Fluxos UX | Fase 4 §4–7 | 3 telas checkout ✓ |
| Integrações | Fase 7 | Adapters ✓ |
| Deployment | Fase 5 §6 | Multi-AZ ✓ |
| Roadmap Gantt | Fase 9 | Releases ✓ |
| Monorepo + sync 0.0 | Addendum Jul/2026 | Código atual ✓ |

---

## 14. Conclusão do Master Plan

Com a conclusão desta fase, o **Master Plan Revoar** está completo:

| Fase | Documento | Status |
|------|-----------|--------|
| 0 | Análise de Mercado | ✅ |
| 1 | Product Discovery | ✅ |
| 2 | Modelo de Negócio | ✅ |
| 3 | Requisitos | ✅ |
| 4 | UX | ✅ |
| 5 | System Design | ✅ |
| 6 | Modelagem de Dados | ✅ |
| 7 | Integrações | ✅ |
| 8 | Análise de Riscos | ✅ |
| 9 | Roadmap | ✅ |
| 10 | Diagramas | ✅ |

O sistema Revoar está **completamente definido em nível de engenharia** para iniciar a Release 0.1 (Foundation), com:

- Proposta de valor e personas validadas contra mercado
- Unit economics e modelo de receita
- 47 requisitos funcionais + RNFs + regras de negócio
- UX mobile-first com checkout 3 telas
- Arquitetura microservices AWS com saga de reserva
- Modelo de dados PostgreSQL com lifecycle de booking
- Integrações Hotelbeds + Mercado Pago
- Registro de riscos com mitigações
- Roadmap 24 meses com MVP GA em 9 meses
- Diagramas de arquitetura, sequência, ERD e fluxos

**Próximo passo recomendado:** Iniciar Release 0.1 — setup infra Terraform + integration-hub Hotelbeds sandbox.

---

*Documento final do Master Plan Revoar.*

---

## Addendum de implementação — Release 0.0 (Jul/2026)

Diagrama do que **está no código hoje** (não substitui os C4-alvo acima).

### A. Monorepo atual

```mermaid
flowchart LR
    EXT[apps/extranet :3000]
    ADM[apps/admin :3001]
    API[apps/api :3002]
    DB[(PostgreSQL 16)]
    S3[LocalStack S3 :4566]
    SH[@revoar/shared]
    PR[@revoar/database]

    EXT -->|REST + SSE JWT| API
    ADM -->|REST + SSE JWT| API
    API --> PR --> DB
    API --> S3
    EXT --> SH
    ADM --> SH
    API --> SH
```

### B. Sync sem F5 (Fase 7)

```mermaid
sequenceDiagram
    participant P as Extranet
    participant API as NestJS
    participant Bus as EventBusService
    participant A as Admin

    P->>API: GET /extranet/notifications/stream
    A->>API: GET /admin/notifications/stream
    P->>API: POST /extranet/hotels/:id/submit
    API->>Bus: hotel.submitted
    Bus-->>A: SSE
    Note over A: invalidateQueries filas + stats
    A->>API: PATCH /admin/hotels/:id/approve
    API->>Bus: hotel.approved
    Bus-->>P: SSE canal partnerId
    Note over P: invalidateQueries hotel + lista
```

Spec: `.specs/features/sync-tempo-real/design.md`.
