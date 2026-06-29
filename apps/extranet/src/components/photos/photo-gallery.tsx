"use client";

import { useRef, useState } from "react";
import { Star, Trash2, Upload } from "lucide-react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { ACCEPTED_IMAGE_TYPES, HotelImageDetail, MAX_IMAGE_SIZE_MB, PresignResponse } from "@/lib/image";
import { Button } from "@/components/ui/button";

type PhotoGalleryProps = {
  hotelId: string;
  images: HotelImageDetail[];
  readOnly: boolean;
  onChange: () => void;
};

export function PhotoGallery({ hotelId, images, readOnly, onChange }: PhotoGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setError("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Arquivo deve ter no máximo 5MB.");
      return;
    }

    const token = getToken();
    if (!token) return;

    setUploading(true);

    try {
      const presign = await apiFetch<PresignResponse>(
        `/extranet/hotels/${hotelId}/images/presign`,
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

      await apiFetch<HotelImageDetail>(`/extranet/hotels/${hotelId}/images`, {
        method: "POST",
        token,
        body: JSON.stringify({
          url: presign.publicUrl,
          altText: file.name.replace(/\.[^.]+$/, ""),
          isPrimary: images.length === 0,
        }),
      });

      onChange();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Não foi possível enviar a foto. Tente novamente.");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSetPrimary(imageId: string) {
    const token = getToken();
    if (!token) return;

    try {
      await apiFetch(`/extranet/hotels/${hotelId}/images/${imageId}/primary`, {
        method: "PATCH",
        token,
      });
      onChange();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Excluir esta foto?")) return;
    const token = getToken();
    if (!token) return;

    try {
      await apiFetch(`/extranet/hotels/${hotelId}/images/${imageId}`, {
        method: "DELETE",
        token,
      });
      onChange();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  return (
    <div>
      {!readOnly && (
        <div className="mb-6">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Enviando..." : "Adicionar foto"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG ou WebP · máximo {MAX_IMAGE_SIZE_MB}MB
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">Nenhuma foto cadastrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione fotos do hotel e defina uma como principal.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-border"
            >
              <div className="relative aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.altText ?? "Foto do hotel"}
                  className="h-full w-full object-cover"
                />
                {image.isPrimary && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Principal
                  </span>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-2 p-3">
                  {!image.isPrimary && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleSetPrimary(image.id)}
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Definir principal
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDelete(image.id)}
                    aria-label="Excluir foto"
                  >
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
