import { z } from "zod";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "./image.schema";

export const updatePartnerProfileSchema = z
  .object({
    name: z.string().min(2, { message: "Nome é obrigatório" }).optional(),
    tradeName: z.string().min(1, { message: "Nome fantasia é obrigatório" }).optional(),
    phone: z.string().min(10, { message: "Telefone inválido" }).optional(),
    contactName: z.string().min(2, { message: "Responsável é obrigatório" }).optional(),
    avatarUrl: z.string().url({ message: "URL inválida" }).optional(),
    logoUrl: z.string().url({ message: "URL inválida" }).optional(),
  })
  .strict();

export const confirmPartnerProfileSchema = z.object({}).strict();

export const presignProfileImageSchema = z
  .object({
    contentType: z.enum(ALLOWED_IMAGE_TYPES, { message: "Formato inválido. Use JPG, PNG ou WebP." }),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(MAX_IMAGE_SIZE_BYTES, { message: "Arquivo deve ter no máximo 5MB" }),
    fileName: z.string().optional(),
    partnerId: z.string().uuid().optional(),
  })
  .strict();

export type UpdatePartnerProfileInput = z.infer<typeof updatePartnerProfileSchema>;
export type ConfirmPartnerProfileInput = z.infer<typeof confirmPartnerProfileSchema>;
export type PresignProfileImageInput = z.infer<typeof presignProfileImageSchema>;
