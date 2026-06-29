# Fase 6 — Modelagem de Dados

**Projeto:** Revoar  
**Versão:** 1.0  
**Data:** Junho/2026  
**Dependências:** Fases 0–5  
**Status:** Concluída

---

## 1. Visão geral do modelo

Modelo relacional **PostgreSQL** por serviço (database-per-service), com consistência eventual entre contextos via eventos. Identificadores **UUID v7** (time-sortable) para entidades expostas externamente.

---

## 2. Entidades principais

### 2.1 Domínio Catalog

#### `hotels`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| supplier_code | VARCHAR | Código bedbank/omnibees |
| supplier_type | ENUM | HOTELBEDS, OMNIBEES, DIRECT |
| name | VARCHAR(255) | |
| slug | VARCHAR | URL-friendly |
| description | TEXT | |
| star_rating | DECIMAL(2,1) | |
| address_line | VARCHAR | |
| city | VARCHAR | |
| state | CHAR(2) | UF |
| country | CHAR(2) | BR |
| latitude | DECIMAL(10,7) | |
| longitude | DECIMAL(10,7) | |
| timezone | VARCHAR | America/Sao_Paulo |
| check_in_time | TIME | Default 14:00 |
| check_out_time | TIME | Default 12:00 |
| status | ENUM | ACTIVE, INACTIVE, SUSPENDED |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `room_types`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| hotel_id | UUID FK | |
| supplier_room_code | VARCHAR | |
| name | VARCHAR | Ex: "Suíte Deluxe" |
| max_adults | INT | |
| max_children | INT | |
| max_occupancy | INT | |
| bed_configuration | JSONB | |
| amenities | JSONB | |
| size_sqm | INT | nullable |

#### `hotel_images`
| id, hotel_id, url, sort_order, is_primary, alt_text |

#### `hotel_amenities`
| hotel_id, amenity_code (enum: WIFI, POOL, PARKING, etc.) |

---

### 2.2 Domínio Availability

#### `rate_plans`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| hotel_id | UUID FK | |
| room_type_id | UUID FK | |
| supplier_rate_code | VARCHAR | |
| name | VARCHAR | "Tarifa Flexível" |
| cancellation_policy_type | ENUM | FLEXIBLE, MODERATE, STRICT, NON_REFUNDABLE |
| cancellation_rules | JSONB | Regras detalhadas |
| meal_plan | ENUM | ROOM_ONLY, BREAKFAST, HALF_BOARD |
| is_refundable | BOOLEAN | |
| currency | CHAR(3) | BRL |

#### `daily_rates` (snapshot/cache)
| rate_plan_id, date, base_price_cents, taxes_included_cents, available_rooms |

Índice composto: `(hotel_id, date)`.

---

### 2.3 Domínio Booking

#### `bookings`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| booking_code | VARCHAR(12) UNIQUE | Ex: REV-A1B2C3 |
| user_id | UUID nullable | Guest checkout null |
| guest_email | VARCHAR | |
| guest_phone | VARCHAR | |
| guest_cpf_hash | VARCHAR | Tokenizado |
| status | ENUM | Ver lifecycle §3 |
| hotel_id | UUID | |
| room_type_id | UUID | |
| rate_plan_id | UUID | |
| check_in | DATE | |
| check_out | DATE | |
| nights | INT | Computed |
| adults | INT | |
| children | INT | |
| total_amount_cents | INT | Snapshot preço |
| currency | CHAR(3) | |
| cancellation_policy_snapshot | JSONB | Imutável |
| supplier_confirmation_code | VARCHAR | nullable |
| supplier_type | ENUM | |
| idempotency_key | VARCHAR UNIQUE | |
| hold_expires_at | TIMESTAMPTZ | |
| confirmed_at | TIMESTAMPTZ | |
| cancelled_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `booking_guests`
| booking_id, type (PRIMARY, ADDITIONAL), first_name, last_name, age |

#### `booking_status_history`
| id, booking_id, from_status, to_status, reason, actor, created_at |

#### `booking_holds`
| id, booking_id, inventory_lock_id, expires_at, extended_count |

---

### 2.4 Domínio Payment

#### `payments`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| booking_id | UUID FK | |
| amount_cents | INT | |
| currency | CHAR(3) | |
| method | ENUM | PIX, CREDIT_CARD |
| status | ENUM | PENDING, AUTHORIZED, CAPTURED, REFUNDED, PARTIAL_REFUND, FAILED |
| gateway | ENUM | MERCADOPAGO, STRIPE |
| gateway_payment_id | VARCHAR | |
| gateway_customer_id | VARCHAR | |
| installments | INT | |
| pix_qr_code | TEXT | nullable |
| pix_expires_at | TIMESTAMPTZ | |
| captured_at | TIMESTAMPTZ | |
| idempotency_key | VARCHAR UNIQUE | |

#### `refunds`
| id, payment_id, amount_cents, reason, status, gateway_refund_id, created_at |

#### `chargebacks`
| id, payment_id, amount_cents, status, evidence_due_at, resolved_at |

---

### 2.5 Domínio User

#### `users`
| id, email UNIQUE, password_hash nullable, google_id nullable, phone, cpf_hash, created_at |

#### `user_consents`
| user_id, consent_type (LGPD_MARKETING, LGPD_TERMS), granted_at, ip |

#### `saved_travelers`
| user_id, name, document_hash, birth_date |

---

### 2.6 Domínio Review

#### `reviews`
| id, booking_id UNIQUE, hotel_id, user_id, rating INT 1-5, comment TEXT, status (PENDING, PUBLISHED, REJECTED), created_at |

---

### 2.7 Domínio Notification

#### `notification_outbox`
| id, event_type, payload JSONB, status, retry_count, sent_at |

---

## 3. Ciclo de vida de uma reserva

### 3.1 State machine

```
                    ┌─────────┐
                    │  DRAFT  │ (opcional, carrinho futuro)
                    └────┬────┘
                         │ create hold
                    ┌────▼────┐
              ┌─────│  HELD   │─────┐ hold expired
              │     └────┬────┘     │
              │          │ start payment
              │     ┌────▼──────────┐
              │     │ PAYMENT_PENDING│
              │     └────┬──────────┘
              │          │ payment captured
              │     ┌────▼────┐
              │     │CONFIRMING│──── supplier fail ──→ FAILED
              │     └────┬────┘
              │          │ supplier ok
              │     ┌────▼────┐
              │     │CONFIRMED│
              │     └────┬────┘
              │          │ cancel
              │     ┌────▼────┐
              └────→│CANCELLED│
                    └─────────┘

FAILED → payment refunded automatically
CONFIRMED → após check_out + 1 day → COMPLETED (opcional)
```

### 3.2 Transições válidas

| De | Para | Trigger |
|----|------|---------|
| HELD | PAYMENT_PENDING | POST /pay |
| HELD | CANCELLED | Hold expired |
| PAYMENT_PENDING | CONFIRMING | Webhook payment success |
| PAYMENT_PENDING | HELD | Payment failed (retry) |
| CONFIRMING | CONFIRMED | Supplier confirm |
| CONFIRMING | FAILED | Supplier reject + refund |
| CONFIRMED | CANCELLED | User/system cancel |
| FAILED | — | Terminal |

### 3.3 Timeline exemplo (happy path)

| T+ | Evento | Status |
|----|--------|--------|
| 0s | Hold criado | HELD |
| 45s | PIX gerado | PAYMENT_PENDING |
| 120s | PIX pago | CONFIRMING |
| 135s | Hotelbeds confirma | CONFIRMED |
| 136s | E-mail voucher | CONFIRMED |

---

## 4. Relacionamentos (ER resumo)

```
hotels 1──N room_types
room_types 1──N rate_plans
rate_plans 1──N daily_rates

users 1──N bookings (optional FK)
hotels 1──N bookings
bookings 1──N booking_guests
bookings 1──1 payments (MVP)
bookings 1──0..1 reviews
payments 1──N refunds
payments 1──N chargebacks

bookings N──1 rate_plans (snapshot at booking time)
```

---

## 5. Regras de consistência

| ID | Regra | Implementação |
|----|-------|---------------|
| DC-001 | Total booking imutável pós-confirmação | Trigger reject update total_amount |
| DC-002 | Uma review por booking | UNIQUE(booking_id) |
| DC-003 | Payment captured → booking não HELD | Check constraint + saga |
| DC-004 | Refund ≤ payment captured | Application validation |
| DC-005 | CPF armazenado hashed | SHA256 + salt KMS |
| DC-006 | Soft delete users; hard delete PII on request LGPD | Anonymization job |
| DC-007 | booking_code human-readable único | Sequence + prefix REV- |
| DC-008 | Status history append-only | No UPDATE/DELETE |
| DC-009 | cancellation_policy_snapshot copiado no booking | JSONB frozen |
| DC-010 | Concurrent hold same room | Optimistic lock + Redis distributed lock |

---

## 6. Índices críticos

```sql
-- Busca
CREATE INDEX idx_hotels_city ON hotels(city, status);
CREATE INDEX idx_hotels_geo ON hotels USING GIST (ll_to_earth(latitude, longitude));

-- Bookings
CREATE INDEX idx_bookings_user ON bookings(user_id, status);
CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);

-- Payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_gateway ON payments(gateway_payment_id);

-- Availability
CREATE INDEX idx_daily_rates ON daily_rates(hotel_id, date);
```

---

## 7. Particionamento e retenção

| Tabela | Estratégia | Retenção |
|--------|------------|----------|
| bookings | Partição mensal por created_at | 7 anos (fiscal) |
| booking_status_history | Partição com bookings | 7 anos |
| payments | Partição mensal | 7 anos |
| notification_outbox | Purge 90 dias pós-sent | 90 dias |
| audit_log | Append-only S3 archive | 10 anos |

---

## 8. Eventos de domínio (integração async)

| Evento | Payload chave | Consumidores |
|--------|---------------|--------------|
| BookingHeld | booking_id, expires_at | Analytics |
| PaymentCaptured | payment_id, booking_id | Booking (confirm), Analytics |
| BookingConfirmed | booking_id, voucher_data | Notification, Review scheduler |
| BookingFailed | booking_id, reason | Notification, Payment (refund) |
| BookingCancelled | booking_id, refund_amount | Notification, Payment |
| ReviewSubmitted | review_id, hotel_id | Catalog (rating aggregate) |

---

## 9. OpenSearch — índice `hotels_search`

```json
{
  "hotel_id": "uuid",
  "name": "text",
  "city": "keyword",
  "state": "keyword",
  "star_rating": "float",
  "avg_rating": "float",
  "review_count": "integer",
  "amenities": "keyword[]",
  "location": "geo_point",
  "collections": "keyword[]",
  "min_price_cache": "integer"
}
```

Sync via CDC (Debezium) ou evento `HotelUpdated`.

---

## 10. Migrações e versionamento

- **Flyway/Liquibase** por serviço.
- Backward compatible migrations (expand-contract pattern).
- Nunca DROP column em produção sem deprecate cycle.

---

## 11. Conclusões

1. **Snapshot imutável** de preço e política no booking é essencial para disputas.
2. **State machine** rigorosa previne reservas órfãs.
3. **Separação DB por serviço** com eventos garante evolução independente.
4. **Próxima fase (Integrações)** detalha adapters externos.

---

*Base para Fase 7 — Integrações.*
