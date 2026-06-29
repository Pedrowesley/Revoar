import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const hotelSchema = z.object({
  name: z.string().min(2, { message: "Nome do hotel é obrigatório" }),
  description: z.string().min(20, { message: "Descrição deve ter ao menos 20 caracteres" }),
  starRating: z.number().min(1).max(5).optional(),
  addressLine: z.string().min(5, { message: "Endereço é obrigatório" }),
  city: z.string().min(2, { message: "Cidade é obrigatória" }),
  state: z.string().length(2, { message: "UF inválida" }),
  zipCode: z.string().min(8, { message: "CEP inválido" }),
  phone: z.string().min(10, { message: "Telefone é obrigatório" }),
  checkInTime: z.string().regex(timeRegex, { message: "Horário inválido" }),
  checkOutTime: z.string().regex(timeRegex, { message: "Horário inválido" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const createHotelSchema = hotelSchema;
export const updateHotelSchema = hotelSchema.partial();

export const hotelListQuerySchema = z.object({
  status: z.enum(["DRAFT", "IN_REVIEW", "ACTIVE", "INACTIVE", "REJECTED"]).optional(),
});

export type HotelInput = z.infer<typeof hotelSchema>;
export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
export type HotelListQuery = z.infer<typeof hotelListQuerySchema>;

