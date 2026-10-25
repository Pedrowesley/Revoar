import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const MAX_ROOM_IMAGES = 8;

export const ROOM_IMAGE_LIMIT_MESSAGE = "Este quarto já tem 8 fotos.";

export const ROOM_IMAGE_SELECTION_LIMIT_MESSAGE = "Escolha no máximo 8 fotos.";

export const presignImageSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_TYPES, { message: "Formato inválido. Use JPG, PNG ou WebP." }),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_SIZE_BYTES, { message: "Arquivo deve ter no máximo 5MB" }),
  fileName: z.string().optional(),
});

export const registerImageSchema = z.object({
  url: z.string().url({ message: "URL inválida" }),
  altText: z.string().max(200).optional(),
  isPrimary: z.boolean().optional(),
});

export type PresignImageInput = z.infer<typeof presignImageSchema>;
export type RegisterImageInput = z.infer<typeof registerImageSchema>;
