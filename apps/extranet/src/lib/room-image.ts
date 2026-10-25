import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@revoar/shared";
import { apiFetch } from "@/lib/api";
import { PresignResponse } from "@/lib/image";

export type RoomImageDetail = {
  id: string;
  roomTypeId: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
  altText: string | null;
  createdAt: string;
};

export function roomImageError(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Formato inválido. Use JPG, PNG ou WebP.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Arquivo deve ter no máximo 5MB.";
  }
  return null;
}

export async function uploadRoomImage(hotelId: string, roomId: string, file: File, token: string) {
  const presign = await apiFetch<PresignResponse>(
    `/extranet/hotels/${hotelId}/rooms/${roomId}/images/presign`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        contentType: file.type,
        fileSize: file.size,
        fileName: file.name,
      }),
    },
  );

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Falha no upload para o storage");
  }

  await apiFetch<RoomImageDetail>(`/extranet/hotels/${hotelId}/rooms/${roomId}/images`, {
    method: "POST",
    token,
    body: JSON.stringify({
      url: presign.publicUrl,
      altText: file.name.replace(/\.[^.]+$/, ""),
    }),
  });
}
