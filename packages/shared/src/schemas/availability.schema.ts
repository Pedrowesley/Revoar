import { z } from "zod";

export const stayDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a data no formato AAAA-MM-DD");

export const HOTEL_AMENITIES = [
  "POOL",
  "PARKING",
  "BREAKFAST_AREA",
  "GYM",
  "RESTAURANT",
  "BEACH",
  "FRONT_DESK_24H",
] as const;

export const cancellationPolicySchema = z.enum(["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"]);
export const mealPlanSchema = z.enum(["ROOM_ONLY", "BREAKFAST", "HALF_BOARD"]);
export const blockReasonSchema = z.enum(["UNAVAILABLE", "RENTED_OFFLINE"]);

export const updateBookingModeSchema = z.object({
  bookingMode: z.enum(["INSTANT", "REQUEST"]),
  houseRules: z.string().trim().max(2000).optional().nullable(),
  amenities: z.array(z.enum(HOTEL_AMENITIES)).max(HOTEL_AMENITIES.length).optional(),
});

export const updateRoomBookingModeSchema = z.object({
  bookingMode: z.enum(["INHERIT", "INSTANT", "REQUEST"]),
});

export const createRatePlanSchema = z.object({
  roomTypeId: z.string().uuid("Quarto inválido"),
  name: z.string().trim().min(2, "Dê um nome à tarifa").max(80),
  cancellationPolicy: cancellationPolicySchema,
  mealPlan: mealPlanSchema,
  minNights: z.coerce.number().int().min(1).max(30).default(1),
  payAtProperty: z.string().trim().max(200).optional().nullable(),
});

export const calendarRangeSchema = z
  .object({
    action: z.enum(["open", "block"]),
    roomTypeId: z.string().uuid("Quarto inválido"),
    ratePlanId: z.string().uuid("Tarifa inválida").optional(),
    from: stayDateSchema,
    to: stayDateSchema,
    priceCents: z.number().int().min(1000, "A diária mínima é R$ 10").max(5_000_000).optional(),
    unitsForSale: z.number().int().min(1).max(500).optional(),
    blockedUnits: z.number().int().min(0).max(500).optional(),
    blockAll: z.boolean().optional(),
    blockReason: blockReasonSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.to < value.from) {
      context.addIssue({ code: "custom", message: "A data final vem depois da inicial", path: ["to"] });
    }
    if (value.action === "open") {
      if (!value.ratePlanId) {
        context.addIssue({ code: "custom", message: "Escolha a tarifa", path: ["ratePlanId"] });
      }
      if (value.priceCents == null) {
        context.addIssue({ code: "custom", message: "Informe o preço da diária", path: ["priceCents"] });
      }
      if (value.unitsForSale == null) {
        context.addIssue({ code: "custom", message: "Informe quantos quartos ficam à venda", path: ["unitsForSale"] });
      }
    }
    if (value.action === "block") {
      if (!value.blockReason) {
        context.addIssue({ code: "custom", message: "Diga por que a noite fica bloqueada", path: ["blockReason"] });
      }
      if (!value.blockAll && value.blockedUnits == null) {
        context.addIssue({
          code: "custom",
          message: "Informe quantas unidades bloquear ou bloqueie o dia inteiro",
          path: ["blockedUnits"],
        });
      }
    }
  });

export const calendarQuerySchema = z.object({
  from: stayDateSchema,
  to: stayDateSchema,
});

export type UpdateBookingModeInput = z.infer<typeof updateBookingModeSchema>;
export type UpdateRoomBookingModeInput = z.infer<typeof updateRoomBookingModeSchema>;
export type CreateRatePlanInput = z.infer<typeof createRatePlanSchema>;
export type CalendarRangeInput = z.infer<typeof calendarRangeSchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
