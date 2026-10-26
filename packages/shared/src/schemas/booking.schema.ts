import { z } from "zod";
import { isValidCpf, onlyDigits } from "../cpf";
import { stayDateSchema } from "./availability.schema";

const personName = z.string().trim().min(2, "Informe o nome").max(80);

export const guestSearchSchema = z.object({
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  checkIn: stayDateSchema,
  checkOut: stayDateSchema,
  adults: z.coerce.number().int().min(1, "Informe ao menos um adulto").max(16),
  children: z.coerce.number().int().min(0).max(10).default(0),
  rooms: z.coerce.number().int().min(1).max(8).default(1),
});

export const createGuestBookingSchema = z.object({
  ratePlanId: z.string().uuid(),
  checkIn: stayDateSchema,
  checkOut: stayDateSchema,
  adults: z.coerce.number().int().min(1).max(16),
  children: z.coerce.number().int().min(0).max(10).default(0),
  quantity: z.coerce.number().int().min(1).max(8),
  firstName: personName,
  lastName: personName,
  email: z.string().trim().email("E-mail inválido").max(160),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  cpf: z.string().trim().refine((value) => isValidCpf(value), "CPF inválido"),
  additionalGuests: z
    .array(z.object({ firstName: personName, lastName: personName }))
    .max(10)
    .default([]),
  childAges: z.array(z.coerce.number().int().min(0).max(17)).max(10).default([]),
  guestMessage: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().uuid(),
  expectedTotalCents: z.coerce.number().int().min(0).optional(),
  acceptPriceChange: z.boolean().optional(),
});

export const payBookingSchema = z.object({
  email: z.string().trim().email(),
  method: z.enum(["PIX", "CREDIT_CARD"]),
  installments: z.coerce.number().int().min(1).max(10).default(1),
});

export const bookingAccessSchema = z.object({
  email: z.string().trim().email(),
});

export const cancelBookingSchema = z.object({
  email: z.string().trim().email(),
});

export const partnerBookingDecisionSchema = z.object({
  decision: z.enum(["accept", "decline"]),
  reason: z.string().trim().max(300).optional(),
});

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeCpf(cpf: string): string {
  return onlyDigits(cpf);
}

export type GuestSearchQuery = z.infer<typeof guestSearchSchema>;
export type CreateGuestBookingInput = z.infer<typeof createGuestBookingSchema>;
export type PayBookingInput = z.infer<typeof payBookingSchema>;
export type PartnerBookingDecisionInput = z.infer<typeof partnerBookingDecisionSchema>;
