"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Star, Trash2, Upload } from "lucide-react";
import { MAX_ROOM_IMAGES, ROOM_IMAGE_LIMIT_MESSAGE } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { MAX_IMAGE_SIZE_MB, resolveMediaUrl } from "@/lib/image";
import { extranetKeys } from "@/lib/query-keys";
import { RoomImageDetail, roomImageError, uploadRoomImage } from "@/lib/room-image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

function RoomPhoto({ image }: { image: RoomImageDetail }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center" aria-hidden>
        <Building2 className="h-10 w-10 text-muted-foreground/60" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveMediaUrl(image.url)}
      alt={image.altText ?? "Foto do quarto"}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

type RoomPhotoGalleryProps = {
  hotelId: string;
  roomId: string;
  readOnly: boolean;
};

export function RoomPhotoGallery({ hotelId, roomId, readOnly }: RoomPhotoGalleryProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imagesQuery = useQuery({
    queryKey: extranetKeys.roomImages(hotelId, roomId),
    queryFn: () =>
      apiFetch<RoomImageDetail[]>(`/extranet/hotels/${hotelId}/rooms/${roomId}/images`, {
        token: getToken()!,
      }),
  });

  const images = imagesQuery.data ?? [];

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (images.length >= MAX_ROOM_IMAGES) {
      toast.error(ROOM_IMAGE_LIMIT_MESSAGE);
      return;
    }

    const invalid = roomImageError(file);
    if (invalid) {
      setError(invalid);
      toast.error("Foto não enviada", invalid);
      return;
    }

    const token = getToken();
    if (!token) return;

    setError(null);
    setUploading(true);
    try {
      await uploadRoomImage(hotelId, roomId, file, token);
      await imagesQuery.refetch();
      toast.success(
        images.length === 0 ? "Foto principal enviada" : "Foto enviada",
        images.length === 0 ? "Ela já é a capa do quarto." : undefined,
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message === "Falha no upload para o storage"
            ? "Não foi possível enviar a foto. Tente novamente."
            : "Não foi possível enviar a foto. Tente novamente.";
      setError(message);
      toast.error(message === ROOM_IMAGE_LIMIT_MESSAGE ? message : "Foto não enviada", message === ROOM_IMAGE_LIMIT_MESSAGE ? undefined : message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSetPrimary(imageId: string) {
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch(`/extranet/hotels/${hotelId}/rooms/${roomId}/images/${imageId}/primary`, {
        method: "PATCH",
        token,
      });
      await imagesQuery.refetch();
      toast.success("Foto principal definida");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Não foi possível definir a capa.";
      setError(message);
      toast.error("Não foi possível definir a capa", message);
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Excluir esta foto?")) return;
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch(`/extranet/hotels/${hotelId}/rooms/${roomId}/images/${imageId}`, {
        method: "DELETE",
        token,
      });
      await imagesQuery.refetch();
      toast.success("Foto excluída");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Não foi possível excluir a foto.";
      setError(message);
      toast.error("Não foi possível excluir a foto", message);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">Fotos do quarto</p>
      {!readOnly && (
        <div className="mt-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            onClick={() => {
              if (images.length >= MAX_ROOM_IMAGES) {
                toast.error(ROOM_IMAGE_LIMIT_MESSAGE);
                return;
              }
              inputRef.current?.click();
            }}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Enviando..." : "Adicionar foto"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG ou WebP · máximo {MAX_IMAGE_SIZE_MB}MB · até {MAX_ROOM_IMAGES} fotos
          </p>
        </div>
      )}

      {error && <p className="mt-4 rounded-md bg-danger-soft p-3 text-sm text-danger">{error}</p>}

      {imagesQuery.isLoading ? null : images.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-muted" aria-hidden>
            <Building2 className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <p className="mt-3 font-medium">Nenhuma foto cadastrada</p>
          <p className="mt-1 text-sm text-muted-foreground">A primeira foto enviada vira a capa do quarto.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-border">
              <div className="relative aspect-video bg-muted">
                <RoomPhoto image={image} />
                {image.isPrimary && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Principal
                  </span>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-2 p-3">
                  {!image.isPrimary && (
                    <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => handleSetPrimary(image.id)}>
                      <Star className="mr-1 h-3 w-3" />
                      Definir principal
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={() => handleDelete(image.id)} aria-label="Excluir foto">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
