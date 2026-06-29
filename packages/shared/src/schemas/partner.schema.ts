import { z } from "zod";

function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCnpj(cnpj: string): boolean {
  const digits = normalizeCnpj(cnpj);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(digits.slice(0, 12), w1);
  const d2 = calc(digits.slice(0, 12) + d1, w2);
  return digits.endsWith(`${d1}${d2}`);
}

export const partnerSignupSchema = z.object({
  legalName: z.string().min(2, { message: "Razão social é obrigatória" }),
  tradeName: z.string().optional(),
  cnpj: z
    .string()
    .min(14, { message: "CNPJ inválido" })
    .refine(isValidCnpj, { message: "CNPJ inválido" }),
  email: z.string().email({ message: "E-mail inválido" }),
  phone: z.string().min(10, { message: "Telefone inválido" }),
  contactName: z.string().min(2, { message: "Responsável é obrigatório" }),
  password: z.string().min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
  name: z.string().min(2, { message: "Nome é obrigatório" }),
});

export type PartnerSignupInput = z.infer<typeof partnerSignupSchema>;

export { normalizeCnpj, isValidCnpj };
