"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { MAX_ROOM_IMAGES, ROOM_IMAGE_LIMIT_MESSAGE, ROOM_IMAGE_SELECTION_LIMIT_MESSAGE, RoomTypeInput } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelStatus } from "@/lib/hotel.const";
import { RoomTypeDetail } from "@/lib/room";
import { extranetKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { RoomForm } from "@/components/rooms/room-form";
import { RoomPhotoPicker } from "@/components/rooms/room-photo-picker";
import { roomImageError, uploadRoomImage } from "@/lib/room-image";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toaster";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function NewRoomPage() {
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  useRequireAuth();

  const { hotel, loading, error } = useHotel(params.id);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const readOnly = hotel ? !EDITABLE_STATUSES.includes(hotel.status) : true;

  async function handleSubmit(data: RoomTypeInput) {
    const token = getToken();
    if (!token) return;
    setSaveError(null);

    if (files.length > MAX_ROOM_IMAGES) {
      toast.error(ROOM_IMAGE_SELECTION_LIMIT_MESSAGE);
      return;
    }
    const invalid = files.map(roomImageError).find((message): message is string => Boolean(message));
    if (invalid) {
      toast.error("Foto não enviada", invalid);
      return;
    }

    try {
      const room = await apiFetch<RoomTypeDetail>(`/extranet/hotels/${params.id}/rooms`, {
        method: "POST",
        token,
        body: JSON.stringify(data),
      });
      await queryClient.invalidateQueries({ queryKey: extranetKeys.rooms(params.id) });
      await queryClient.invalidateQueries({ queryKey: extranetKeys.hotel(params.id) });
      await queryClient.invalidateQueries({ queryKey: ["extranet", "hotels"] });
      toast.success("Quarto criado");
      for (const [index, file] of files.entries()) {
        try {
          await uploadRoomImage(params.id, room.id, file, token);
          toast.success(
            index === 0 ? "Foto principal enviada" : "Foto enviada",
            index === 0 ? "Ela já é a capa do quarto." : undefined,
          );
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Não foi possível enviar a foto. Tente novamente.";
          toast.error(message === ROOM_IMAGE_LIMIT_MESSAGE ? message : "Foto não enviada", message === ROOM_IMAGE_LIMIT_MESSAGE ? undefined : message);
          break;
        }
      }
      router.push(`/hotels/${params.id}/rooms/${room.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Não foi possível criar o quarto.";
      setSaveError(message);
      toast.error("Não foi possível criar o quarto", message);
    }
  }

  if (loading) {
    return <PageSkeleton rows={4} />;
  }

  if (error || !hotel) {
    return (
      <PageShell width="md" className="py-16 text-center">
        <p className="text-danger">{error ?? "Hotel não encontrado"}</p>
      </PageShell>
    );
  }

  if (readOnly) {
    router.replace(`/hotels/${params.id}/rooms`);
    return null;
  }

  return (
    <PageShell width="md">
      <Link
        href={`/hotels/${params.id}/rooms`}
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para quartos
      </Link>

      <PageHeader title="Novo quarto" description={hotel.name} />

      {saveError && (
        <Alert variant="danger" className="mb-4">
          {saveError}
        </Alert>
      )}

      <Surface className="p-6">
        <RoomForm submitLabel="Criar quarto" onSubmit={handleSubmit}>
          <RoomPhotoPicker files={files} onChange={setFiles} />
        </RoomForm>
      </Surface>
    </PageShell>
  );
}
