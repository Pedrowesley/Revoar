import { z } from "zod";

export const partnerLoginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type PartnerLoginInput = z.infer<typeof partnerLoginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, { message: "Link inválido ou expirado." }),
  password: z.string().min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
