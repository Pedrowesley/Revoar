import { z } from "zod";

export const partnerLoginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type PartnerLoginInput = z.infer<typeof partnerLoginSchema>;
