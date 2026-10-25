-- AlterEnum
ALTER TYPE "ActorType" ADD VALUE 'GUEST';
ALTER TYPE "ActorType" ADD VALUE 'SYSTEM';

-- CreateEnum
CREATE TYPE "BookingMode" AS ENUM ('INSTANT', 'REQUEST');
CREATE TYPE "RoomBookingMode" AS ENUM ('INHERIT', 'INSTANT', 'REQUEST');
CREATE TYPE "CancellationPolicy" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'NON_REFUNDABLE');
CREATE TYPE "MealPlan" AS ENUM ('ROOM_ONLY', 'BREAKFAST', 'HALF_BOARD');
CREATE TYPE "BlockReason" AS ENUM ('UNAVAILABLE', 'RENTED_OFFLINE');
CREATE TYPE "BookingStatus" AS ENUM ('HELD', 'PAYMENT_PENDING', 'CONFIRMED', 'REQUESTED', 'AWAITING_PAYMENT', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CAPTURED', 'REFUNDED', 'PARTIAL_REFUND', 'FAILED');

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN "booking_mode" "BookingMode" NOT NULL DEFAULT 'INSTANT',
ADD COLUMN "amenities" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "house_rules" TEXT;

ALTER TABLE "room_types" ADD COLUMN "booking_mode" "RoomBookingMode" NOT NULL DEFAULT 'INHERIT';

-- CreateTable
CREATE TABLE "rate_plans" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cancellation_policy" "CancellationPolicy" NOT NULL,
    "meal_plan" "MealPlan" NOT NULL DEFAULT 'ROOM_ONLY',
    "min_nights" INTEGER NOT NULL DEFAULT 1,
    "pay_at_property" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_rates" (
    "id" TEXT NOT NULL,
    "rate_plan_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price_cents" INTEGER NOT NULL,

    CONSTRAINT "daily_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "room_inventory" (
    "id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "units_for_sale" INTEGER NOT NULL DEFAULT 0,
    "blocked_units" INTEGER NOT NULL DEFAULT 0,
    "block_reason" "BlockReason",

    CONSTRAINT "room_inventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "booking_code" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "booking_mode" "BookingMode" NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "rate_plan_id" TEXT NOT NULL,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "guest_email" TEXT NOT NULL,
    "guest_phone" TEXT NOT NULL,
    "guest_cpf_hash" TEXT NOT NULL,
    "guest_message" TEXT,
    "decline_reason" TEXT,
    "cancel_reason" TEXT,
    "snapshot" JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "access_token_hash" TEXT NOT NULL,
    "hold_expires_at" TIMESTAMP(3),
    "respond_by" TIMESTAMP(3),
    "pay_by" TIMESTAMP(3),
    "hold_extended" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_locks" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_locks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_guests" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "age" INTEGER,

    CONSTRAINT "booking_guests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_status_history" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus" NOT NULL,
    "reason" TEXT,
    "actor_type" "ActorType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "pix_copy_paste" TEXT,
    "sandbox" BOOLEAN NOT NULL DEFAULT true,
    "captured_at" TIMESTAMP(3),
    "refunded_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_plans_room_type_id_idx" ON "rate_plans"("room_type_id");
CREATE INDEX "rate_plans_hotel_id_idx" ON "rate_plans"("hotel_id");
CREATE UNIQUE INDEX "daily_rates_rate_plan_id_date_key" ON "daily_rates"("rate_plan_id", "date");
CREATE INDEX "daily_rates_date_idx" ON "daily_rates"("date");
CREATE UNIQUE INDEX "room_inventory_room_type_id_date_key" ON "room_inventory"("room_type_id", "date");
CREATE INDEX "room_inventory_date_idx" ON "room_inventory"("date");
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");
CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings"("idempotency_key");
CREATE UNIQUE INDEX "bookings_access_token_hash_key" ON "bookings"("access_token_hash");
CREATE INDEX "bookings_guest_email_idx" ON "bookings"("guest_email");
CREATE INDEX "bookings_hotel_id_status_idx" ON "bookings"("hotel_id", "status");
CREATE INDEX "bookings_room_type_id_status_check_in_check_out_idx" ON "bookings"("room_type_id", "status", "check_in", "check_out");
CREATE INDEX "inventory_locks_room_type_id_date_idx" ON "inventory_locks"("room_type_id", "date");
CREATE INDEX "inventory_locks_booking_id_idx" ON "inventory_locks"("booking_id");
CREATE INDEX "booking_guests_booking_id_idx" ON "booking_guests"("booking_id");
CREATE INDEX "booking_status_history_booking_id_idx" ON "booking_status_history"("booking_id");
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- AddForeignKey
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_rates" ADD CONSTRAINT "daily_rates_rate_plan_id_fkey" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "room_inventory" ADD CONSTRAINT "room_inventory_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rate_plan_id_fkey" FOREIGN KEY ("rate_plan_id") REFERENCES "rate_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_locks" ADD CONSTRAINT "inventory_locks_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_locks" ADD CONSTRAINT "inventory_locks_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_guests" ADD CONSTRAINT "booking_guests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
