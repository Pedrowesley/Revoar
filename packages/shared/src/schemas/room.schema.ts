import { z } from "zod";
import { ROOM_AMENITIES } from "../amenities";

export const roomTypeSchema = z
  .object({
    name: z.string().min(2, { message: "Nome do quarto é obrigatório" }),
    description: z.string().min(10, { message: "Descrição é obrigatória" }),
    maxAdults: z.number().int().min(1, { message: "Mínimo 1 adulto" }),
    maxChildren: z.number().int().min(0, { message: "Valor inválido" }),
    maxOccupancy: z.number().int().min(1, { message: "Ocupação inválida" }),
    bedConfiguration: z.string().min(3, { message: "Informe a configuração de camas" }),
    amenities: z
      .array(z.enum(ROOM_AMENITIES))
      .min(1, { message: "Selecione ao menos 1 comodidade" }),
    sizeSqm: z.number().int().positive().optional(),
  })
  .refine((data) => data.maxOccupancy >= data.maxAdults + data.maxChildren, {
    message: "Ocupação máxima deve ser ≥ adultos + crianças",
    path: ["maxOccupancy"],
  });

export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
