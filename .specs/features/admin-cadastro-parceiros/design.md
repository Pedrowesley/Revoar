# Design — Extranet Cadastro Parceiros (Release 0.0)

**Spec:** `.specs/features/admin-cadastro-parceiros/spec.md`  
**Status:** Implemented (Release 0.0 — Jun/2026)  
**Nota:** monorepo usa **npm** (não pnpm); testes são **E2E Playwright** (Vitest não implementado)

---

## Architecture Overview

Dois portais, uma API, um banco:

```
┌──────────────────────────────────────────────────────────────┐
│                      MONOREPO revoar                          │
├──────────────────────────────────────────────────────────────┤
│  apps/extranet     Next.js 15 — parceiro (anfitrião PJ)      │
│  apps/admin        Next.js 15 — moderação Revoar (aprovação) │
│  apps/api          NestJS — REST API compartilhada           │
│  packages/database Prisma                                      │
│  packages/shared   Zod schemas (CNPJ, hotel, room)             │
└──────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   PostgreSQL 16                    AWS S3 (fotos)
```

**Fluxo principal:**
```
Parceiro signup (extranet) → PENDING
Admin aprova parceiro → ACTIVE
Parceiro cadastra hotel + quartos + fotos → DRAFT
Parceiro envia → IN_REVIEW
Admin aprova → ACTIVE (visível Release 0.1)
```

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Extranet UI | Next.js 15 + shadcn/ui + Tailwind |
| Admin UI | Next.js 15 + shadcn/ui (mesmo design system) |
| API | NestJS + Prisma |
| Banco | PostgreSQL 16 |
| Auth parceiro | JWT (PartnerUser) |
| Auth admin | JWT (AdminUser) — issuer/audience separados |
| Validação | Zod + React Hook Form |
| CEP | ViaCEP API |
| CNPJ | cpf-cnpj-validator |
| Fotos | S3 presigned URL |
| Monorepo | Turborepo + pnpm |
| Testes | Vitest + Playwright (fluxo parceiro + aprovação admin) |

---

## Data Model (Prisma)

```prisma
model AdminUser {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String
  role         AdminRole @default(OPERATOR)
}

enum AdminRole {
  OPERATOR
  SUPER_ADMIN
}

model Partner {
  id          String        @id @default(uuid())
  legalName   String
  tradeName   String?
  cnpj        String        @unique
  email       String
  phone       String
  contactName String
  status      PartnerStatus @default(PENDING)
  users       PartnerUser[]
  hotels      Hotel[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum PartnerStatus {
  PENDING    // aguardando aprovação Revoar
  ACTIVE     // pode enviar hotéis para revisão
  SUSPENDED
}

model PartnerUser {
  id           String   @id @default(uuid())
  partnerId    String
  partner      Partner  @relation(fields: [partnerId], references: [id])
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
}

model Hotel {
  id            String       @id @default(uuid())
  partnerId     String
  partner       Partner      @relation(fields: [partnerId], references: [id])
  name          String
  slug          String       @unique
  description   String
  starRating    Decimal?     @db.Decimal(2, 1)
  addressLine   String
  city          String
  state         String       @db.Char(2)
  zipCode       String
  country       String       @default("BR")
  latitude      Decimal?
  longitude     Decimal?
  phone         String
  checkInTime   String       @default("14:00")
  checkOutTime  String       @default("12:00")
  supplierType  SupplierType @default(DIRECT)
  status        HotelStatus  @default(DRAFT)
  rejectionReason String?
  roomTypes     RoomType[]
  images        HotelImage[]
  statusHistory HotelStatusHistory[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum HotelStatus {
  DRAFT
  IN_REVIEW
  ACTIVE
  INACTIVE
  REJECTED
}

model RoomType {
  id               String  @id @default(uuid())
  hotelId          String
  hotel            Hotel   @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  name             String
  description      String
  maxAdults        Int
  maxChildren      Int     @default(0)
  maxOccupancy     Int
  bedConfiguration String  // ex: "1 cama king"
  amenities        Json    // ["WIFI","AC","TV","MINIBAR","PRIVATE_BATH","BALCONY"]
  sizeSqm          Int?
  sortOrder        Int     @default(0)
}

model HotelImage {
  id        String  @id @default(uuid())
  hotelId   String
  hotel     Hotel   @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  url       String
  sortOrder Int     @default(0)
  isPrimary Boolean @default(false)
  altText   String?
}

model HotelStatusHistory {
  id         String       @id @default(uuid())
  hotelId    String
  hotel      Hotel        @relation(fields: [hotelId], references: [id])
  fromStatus HotelStatus?
  toStatus   HotelStatus
  reason     String?
  actorType  ActorType    // PARTNER | ADMIN
  actorId    String
  createdAt  DateTime     @default(now())
}

enum ActorType {
  PARTNER
  ADMIN
}
```

### Amenities de quarto (enum shared)

`WIFI`, `AC`, `TV`, `MINIBAR`, `SAFE`, `PRIVATE_BATH`, `BALCONY`, `BATHTUB`, `DESK`, `BLACKOUT_CURTAINS`, `CRIB_AVAILABLE`

---

## API Routes

### Extranet (PartnerUser JWT)

| Method | Route | Descrição |
|--------|-------|-----------|
| POST | `/extranet/auth/signup` | Cadastro parceiro + user |
| POST | `/extranet/auth/login` | Login |
| GET | `/extranet/me` | Perfil parceiro |
| GET | `/extranet/hotels` | Meus hotéis |
| POST | `/extranet/hotels` | Criar hotel |
| GET | `/extranet/hotels/:id` | Detalhe |
| PATCH | `/extranet/hotels/:id` | Editar (bloqueado se IN_REVIEW) |
| POST | `/extranet/hotels/:id/submit` | DRAFT → IN_REVIEW |
| POST | `/extranet/hotels/:id/rooms` | Adicionar quarto |
| PATCH | `/extranet/hotels/:id/rooms/:roomId` | Editar quarto |
| DELETE | `/extranet/hotels/:id/rooms/:roomId` | Remover quarto |
| POST | `/extranet/hotels/:id/images/presign` | URL upload S3 |
| POST | `/extranet/hotels/:id/images` | Registrar foto |
| PATCH | `/extranet/hotels/:id/images/:imageId/primary` | Foto principal |

### Admin (AdminUser JWT)

| Method | Route | Descrição |
|--------|-------|-----------|
| POST | `/admin/auth/login` | Login operador |
| GET | `/admin/partners/pending` | Fila parceiros PENDING |
| PATCH | `/admin/partners/:id/approve` | → ACTIVE |
| PATCH | `/admin/partners/:id/suspend` | → SUSPENDED |
| GET | `/admin/hotels/pending` | Fila IN_REVIEW |
| PATCH | `/admin/hotels/:id/approve` | → ACTIVE |
| PATCH | `/admin/hotels/:id/reject` | → DRAFT + motivo |

---

## Extranet UI — Páginas

```
/signup                    Cadastro parceiro (CNPJ)
/login
/dashboard                 Resumo + atalhos
/hotels                      Meus hotéis
/hotels/new                  Wizard hotel
/hotels/[id]                 Tabs: Dados | Quartos | Fotos | Status
/hotels/[id]/rooms/new       Form quarto completo
```

### Formulário quarto (campos obrigatórios para viajante)

| Campo | Obrigatório | Exemplo |
|-------|-------------|---------|
| Nome | Sim | "Suíte Deluxe Vista Mar" |
| Descrição | Sim | "30m², varanda com vista..." |
| Adultos máx | Sim | 2 |
| Crianças máx | Sim | 1 |
| Ocupação máx | Sim | 3 |
| Configuração camas | Sim | "1 cama king" |
| Comodidades | Sim (≥1) | Wi-Fi, AC, TV... |
| Área m² | Não | 30 |

---

## Admin UI — Páginas

```
/admin/login
/admin/dashboard           Fila aprovações (P2)
/admin/partners/pending    Aprovar parceiros
/admin/hotels/pending      Aprovar hotéis
/admin/hotels/[id]         Preview + aprovar/rejeitar
```

---

## Auth Boundaries

- PartnerUser só acessa `/extranet/*` do próprio `partnerId`
- AdminUser só acessa `/admin/*`
- Guards separados: `PartnerJwtGuard`, `AdminJwtGuard`
- Partner PENDING: CRUD hotel DRAFT ok; submit IN_REVIEW bloqueado

---

## Regras de negócio (validação submit)

Hotel pode ir `DRAFT → IN_REVIEW` quando:
- Partner status = ACTIVE
- name, description, address completo
- ≥1 RoomType com todos campos obrigatórios
- ≥1 HotelImage com is_primary

Admin `IN_REVIEW → ACTIVE` quando checklist visual OK.

---

## Migration path

| Release 0.0 | Evolução |
|-------------|----------|
| Extranet + Admin | Mantidos |
| catalog-service | Extrai módulos NestJS hotels/partners |
| Múltiplos PartnerUser | P2 |
| Fotos de quarto | P2 |
| Tarifas/disponibilidade | Release 0.5 |
