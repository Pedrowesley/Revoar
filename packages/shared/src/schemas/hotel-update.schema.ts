import { z } from "zod";

/** Campos editáveis quando hotel está IN_REVIEW */
export const hotelPartialUpdateSchema = z.object({
  description: z.string().min(20, { message: "Descrição deve ter ao menos 20 caracteres" }).optional(),
  starRating: z.number().min(1).max(5).optional(),
  phone: z.string().min(10, { message: "Telefone é obrigatório" }).optional(),
  checkInTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Horário inválido" })
    .optional(),
  checkOutTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Horário inválido" })
    .optional(),
});

export type HotelPartialUpdateInput = z.infer<typeof hotelPartialUpdateSchema>;

export const HOTEL_CRITICAL_FIELDS = [
  "name",
  "addressLine",
  "city",
  "state",
  "zipCode",
  "latitude",
  "longitude",
] as const;
