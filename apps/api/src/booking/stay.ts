import { createHash, randomBytes } from "crypto";
import { BadRequestException } from "@nestjs/common";
import { CancellationPolicy } from "@revoar/database";

const MAX_STAY_NIGHTS = 30;
const MAX_RANGE_DAYS = 120;

export function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function todayInBrazil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function eachDateInclusive(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  for (let cursor = from; cursor.getTime() <= to.getTime(); cursor = addUtcDays(cursor, 1)) {
    days.push(cursor);
    if (days.length > MAX_RANGE_DAYS) {
      throw new BadRequestException("O intervalo pode ter no máximo 120 dias");
    }
  }
  return days;
}

export function stayNights(checkInIso: string, checkOutIso: string): Date[] {
  if (checkInIso < todayInBrazil()) {
    throw new BadRequestException("O check-in não pode ser no passado");
  }
  if (checkOutIso <= checkInIso) {
    throw new BadRequestException("O check-out vem depois do check-in");
  }
  const nights = eachDateInclusive(utcDate(checkInIso), addUtcDays(utcDate(checkOutIso), -1));
  if (nights.length > MAX_STAY_NIGHTS) {
    throw new BadRequestException("A estadia máxima é de 30 noites");
  }
  return nights;
}

export function checkInInstant(date: Date, time: string): Date {
  return new Date(`${isoDate(date)}T${time}:00-03:00`);
}

export function refundPercent(input: {
  policy: CancellationPolicy;
  confirmedAt: Date;
  checkInAt: Date;
  now: Date;
}): number {
  const daysUntil = (input.checkInAt.getTime() - input.now.getTime()) / 86_400_000;
  const daysSinceConfirm = (input.now.getTime() - input.confirmedAt.getTime()) / 86_400_000;
  if (daysSinceConfirm <= 7 && daysUntil > 7) return 100;
  if (input.policy === "FLEXIBLE") return daysUntil >= 1 ? 100 : 0;
  if (input.policy === "MODERATE") return daysUntil >= 7 ? 100 : 0;
  if (input.policy === "STRICT") return daysUntil >= 7 ? 50 : 0;
  return 0;
}

export function policyLabel(policy: CancellationPolicy): string {
  switch (policy) {
    case "FLEXIBLE":
      return "Cancelamento grátis até 24 horas antes do check-in";
    case "MODERATE":
      return "Cancelamento grátis até 7 dias antes do check-in";
    case "STRICT":
      return "Reembolso de 50% até 7 dias antes do check-in";
    case "NON_REFUNDABLE":
      return "Não reembolsável, salvo o direito de arrependimento";
  }
}

export function mealLabel(meal: string): string {
  if (meal === "BREAKFAST") return "Café da manhã";
  if (meal === "HALF_BOARD") return "Meia pensão";
  return "Só o quarto";
}

export function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashCpf(cpf: string): string {
  const salt = process.env.CPF_HASH_SALT ?? "revoar-dev-cpf-salt";
  return createHash("sha256").update(`${salt}:${cpf}`).digest("hex");
}

export function newBookingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `REV-${suffix}`;
}

export function newAccessToken(): string {
  return randomBytes(24).toString("hex");
}
