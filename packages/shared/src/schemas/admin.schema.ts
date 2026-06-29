import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const rejectHotelSchema = z.object({
  reason: z.string().min(5, { message: "Informe o motivo da rejeição" }),
});

export type RejectHotelInput = z.infer<typeof rejectHotelSchema>;
