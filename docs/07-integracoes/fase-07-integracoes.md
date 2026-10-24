# Fase 7 — Integrações

**Projeto:** Revoar  
**Versão:** 1.0  
**Data:** Junho/2026  
**Dependências:** Fases 0–6  
**Status:** Concluída

---

## 1. Visão geral

O **integration-hub** centraliza adapters para sistemas externos, implementando **Anti-Corruption Layer (ACL)** entre modelos Revoar e fornecedores. Padrão **Adapter + Factory** por tipo de integração.

```
booking-service → integration-hub → HotelSupplierAdapter
payment-service → PaymentGatewayAdapter
notification-service → TwilioAdapter / SendGridAdapter
```

---

## 2. Provedores de hotéis

### 2.1 Hotelbeds (bedbank — MVP primário)

| Aspecto | Detalhe |
|---------|---------|
| **Protocolo** | REST API Hotelbeds Booking API |
| **Autenticação** | Api-Key + X-Signature (SHA256) |
| **Ambientes** | Test + Production |
| **Operações** | Availability, CheckRate, Booking, BookingList, BookingCancellation |

**Fluxo availability:**
```
POST /hotels
  destination / geolocation / hotel codes
  stay: checkIn, checkOut
  occupancies: rooms, adults, children
→ Response: hotels[].rooms[].rates[]
→ Map to Revoar RatePlan + DailyRate
```

**Fluxo booking:**
```
1. CheckRate (revalidate rateKey) — obrigatório
2. POST /bookings { rateKey, holder, rooms, clientReference }
3. Store supplier confirmation + voucher URL
```

**Tratamento erros:**

| Código HB | Ação Revoar |
|-----------|-------------|
| PRODUCT_ERROR | Retry 1x; se persist → FAILED |
| INVALID_DATA | Fail fast; log + alert |
| CONFIRMATION_TIMEOUT | Async poll BookingList 3x |
| QUOTA_EXCEEDED | Circuit breaker; queue |

**Rate limits:** 8 req/s production — implementar token bucket client-side.

---

### 2.2 Omnibees (channel manager — BR direct)

| Aspecto | Detalhe |
|---------|---------|
| **Protocolo** | SOAP/REST (conforme contrato Omnibees) |
| **Uso** | Hotéis direct connect Brasil |
| **Sync** | Push availability webhook + pull scheduled |

**Vantagens:** Tarifas direct, menor comissão intermediária, inventário mais preciso.

**Desafios:** Integração por hotel; onboarding manual MVP.

---

### 2.3 WebBeds (bedbank secundário)

Fallback quando Hotelbeds sem inventário em destino específico. Mesmo padrão adapter.

---

### 2.4 Adapter interface (Go)

```go
type HotelSupplier interface {
    SearchAvailability(ctx, SearchRequest) ([]HotelOffer, error)
    CheckRate(ctx, RateKey) (ValidatedRate, error)
    CreateBooking(ctx, BookingRequest) (SupplierBooking, error)
    CancelBooking(ctx, SupplierRef, reason) (CancelResult, error)
    GetBookingStatus(ctx, SupplierRef) (BookingStatus, error)
}
```

**Factory:** `NewAdapter(supplierType) HotelSupplier`

---

## 3. Gateways de pagamento

### 3.1 Mercado Pago (primário BR)

| Método | Integração |
|--------|------------|
| **PIX** | POST /v1/payments `{ payment_method_id: "pix" }` → QR code |
| **Cartão** | Tokenização frontend SDK → server capture |
| **Webhook** | `/webhooks/mercadopago` — validação HMAC |
| **Estorno** | POST refund API |

**Idempotência:** Header `X-Idempotency-Key: {booking_id}-{attempt}`.

**Estados mapping:**

| MP Status | Revoar Payment Status |
|-----------|----------------------|
| pending | PENDING |
| approved | CAPTURED |
| rejected | FAILED |
| refunded | REFUNDED |
| charged_back | CHARGEBACK |

---

### 3.2 Stripe (backup / internacional futuro)

- Payment Intents + 3DS2.
- Usar para fallback se MP indisponível ou expansão LATAM.

---

### 3.3 Antifraude

| Camada | Ferramenta |
|--------|------------|
| Regras | MP fraud scoring + rules engine interno |
| Velocity | Max 3 bookings/CPF/dia |
| Device fingerprint | FingerprintJS Pro (fase 1.5) |
| Manual review queue | Backoffice RF-052 |

**Regras MVP:**
- Primeira compra > R$ 5.000 → review manual
- E-mail disposable domain → block
- IP geo ≠ BR sem justificativa → 3DS obrigatório

---

## 4. APIs externas auxiliares

### 4.1 Mapbox

| Uso | API |
|-----|-----|
| Mapa resultados | GL JS |
| Geocoding destinos | Geocoding API |
| Distância POI | Matrix API (fase 1.5) |

Cache geocoding Redis TTL 30 dias.

---

### 4.2 SendGrid (e-mail transacional)

| Template | Trigger |
|----------|---------|
| booking_confirmation | BookingConfirmed |
| booking_pending | CONFIRMING > 30s |
| booking_failed_refund | BookingFailed |
| cancellation_confirmed | BookingCancelled |
| check_in_reminder | Cron D-1 |
| review_request | D+1 pós checkout |

Fallback: AWS SES.

---

### 4.3 Twilio / WhatsApp Business API

| Mensagem | Opt-in |
|----------|--------|
| Confirmação reserva | Checkout checkbox |
| Lembrete check-in | Preferências conta |
| Status cancelamento | Automático |

Template pré-aprovado Meta Business.

---

### 4.4 Google OAuth

- Login social; scope email profile.
- Account linking com reservas guest (match email).

---

## 5. Estrutura futura — Voos (Fase 2)

### 5.1 Consolidadores / GDS

| Provedor | Uso potencial |
|----------|---------------|
| **Amadeus Self-Service APIs** | Search + book voos |
| **Sabre** | Alternativa enterprise |
| **Consolidador BR (RexturAdvance / CVC API)** | Pacotes domestic |

### 5.2 Adapter voos (planejado)

```go
type FlightSupplier interface {
    SearchFlights(ctx, FlightSearchRequest) ([]Itinerary], error)
    PriceItinerary(ctx, ItineraryKey) (PricedItinerary, error)
    BookFlight(ctx, FlightBookingRequest) (SupplierTicket, error)
    CancelTicket(ctx, SupplierRef) (CancelResult, error)
}
```

### 5.3 Trip composition (fase 2)

```
trip-service:
  Trip = []Segment{ HotelSegment, FlightSegment, ExperienceSegment* }
  Unified checkout com saga multi-supplier
  Rollback parcial: cancel hotel se voo falhou
```

### 5.4 Preparação no MVP

- `bookings` schema reserva campo `trip_id` nullable (future).
- integration-hub registry extensível.
- Event bus schema versionado (Avro/JSON Schema).

---

## 6. Webhooks inbound

| Origem | Endpoint | Validação |
|--------|----------|-----------|
| Mercado Pago | `/webhooks/mp` | HMAC signature |
| Hotelbeds | `/webhooks/hb` | IP allowlist + token |
| Omnibees | `/webhooks/omnibees` | Shared secret |

**Padrão processamento:**
1. Persist raw webhook (`webhook_inbox`).
2. Ack 200 imediato.
3. Process async worker.
4. Idempotent by event_id.

---

## 7. Contratos e SLAs fornecedores

| Fornecedor | SLA uptime | Timeout client | Fallback |
|------------|------------|----------------|----------|
| Hotelbeds | 99.5% | 30s search, 60s book | Cache + queue |
| Mercado Pago | 99.9% | 15s | Stripe cartão |
| SendGrid | 99.95% | 10s | SES |
| Mapbox | 99.9% | 5s | Static map image |

---

## 8. Secrets e configuração

| Secret | Storage | Rotation |
|--------|---------|----------|
| HOTELBEDS_API_KEY | Secrets Manager | 90d |
| MP_ACCESS_TOKEN | Secrets Manager | Auto OAuth |
| SENDGRID_API_KEY | Secrets Manager | 90d |
| WEBHOOK_SIGNING_SECRET | Secrets Manager | On demand |

Config por ambiente: `dev`, `staging`, `prod` — feature flags LaunchDarkly.

---

## 9. Monitoramento integrações

| Métrica | Alerta |
|---------|--------|
| hb_search_error_rate | > 5% 5min |
| hb_book_latency_p95 | > 45s |
| mp_webhook_delay | > 2 min backlog |
| adapter_circuit_open | Page immediately |

Dashboard Grafana: "Integration Health".

---

## 10. Ambiente sandbox

| Integração | Sandbox |
|------------|---------|
| Hotelbeds | test-api.hotelbeds.com |
| Mercado Pago | TEST credentials + test users |
| Omnibees | Homologação parceiro |

CI/CD roda contract tests contra sandboxes nightly.

---

## 11. Conclusões

1. **Hotelbeds + Mercado Pago** são stack MVP mínima viável.
2. **Adapter pattern** desacopla evolução para voos e novos bedbanks.
3. **Webhooks async** evitam perda eventos pagamento.
4. **Próxima fase (Riscos)** mapeia dependências externas como riscos.

---

*Base para Fase 8 — Análise de Riscos.*

---

## Addendum de implementação — Release 0.0 (Jul/2026)

Integrações externas no código **hoje** (antes de Hotelbeds / Mercado Pago):

| Destino | Uso atual | Notas |
|---------|-----------|--------|
| ViaCEP | Preenchimento de endereço na extranet | Cliente Next.js |
| LocalStack S3 (`:4566`) | Fotos do hotel (presign) | CORS auto no boot da API |
| AWS S3 | Mesmo contrato, quando `S3_*` de produção | — |
| Resend | E-mail de signup/aprovação | Stub no console sem `RESEND_API_KEY` |
| SSE interno | Sync UI admin ↔ extranet | Não é integração externa; `EventBusService` |

Hotelbeds, Mercado Pago, SendGrid/Twilio do documento acima continuam **Release 0.1 / 0.5**.
