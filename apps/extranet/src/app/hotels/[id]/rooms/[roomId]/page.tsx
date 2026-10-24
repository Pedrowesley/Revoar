"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { RoomTypeInput } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelStatus } from "@/lib/hotel.const";
import { RoomTypeDetail } from "@/lib/room";
import { extranetKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { RoomForm } from "@/components/rooms/room-form";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toaster";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function EditRoomPage() {
  const toast = useToast();
  const params = useParams<{ id: string; roomId: string }>();
  const queryClient = useQueryClient();
  useRequireAuth();

  const { hotel, loading: hotelLoading, error: hotelError } = useHotel(params.id);
  const [saveError, setSaveError] = useState<string | null>(null);

  const readOnly = hotel ? !EDITABLE_STATUSES.includes(hotel.status) : true;

  const roomsQuery = useQuery({
    queryKey: extranetKeys.rooms(params.id),
    enabled: Boolean(hotel),
    queryFn: () =>
      apiFetch<RoomTypeDetail[]>(`/extranet/hotels/${params.id}/rooms`, {
        token: getToken()!,
      }),
  });

  const room = roomsQuery.data?.find((item) => item.id === params.roomId) ?? null;
  const roomError =
    roomsQuery.error instanceof ApiError
      ? roomsQuery.error.message
      : roomsQuery.isError
        ? "Quarto não encontrado."
        : roomsQuery.isSuccess && !room
          ? "Quarto não encontrado."
          : null;

  async function handleSubmit(data: RoomTypeInput) {
    const token = getToken();
    if (!token || !room) return;
    setSaveError(null);

    try {
      await apiFetch<RoomTypeDetail>(`/extranet/hotels/${params.id}/rooms/${room.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(data),
      });
      await queryClient.invalidateQueries({ queryKey: extranetKeys.rooms(params.id) });
      await queryClient.invalidateQueries({ queryKey: extranetKeys.hotel(params.id) });
      toast.success("Quarto salvo");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Não foi possível salvar as alterações.";
      setSaveError(message);
      toast.error("Não foi possível salvar o quarto", message);
    }
  }

  if (hotelLoading || roomsQuery.isLoading) {
    return <PageSkeleton rows={4} />;
  }

  if (hotelError || roomError || !hotel || !room) {
    return (
      <PageShell width="md" className="py-16 text-center">
        <p className="text-danger">{hotelError ?? roomError ?? "Quarto não encontrado"}</p>
        <Link
          href={`/hotels/${params.id}/rooms`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          Voltar para quartos
        </Link>
      </PageShell>
    );
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

      <PageHeader title={room.name} description={hotel.name} />

      {saveError && (
        <Alert variant="danger" className="mb-4">
          {saveError}
        </Alert>
      )}

      <Surface className="p-6">
        <RoomForm
          readOnly={readOnly}
          submitLabel="Salvar alterações"
          onSubmit={handleSubmit}
          defaultValues={{
            name: room.name,
            description: room.description,
            maxAdults: room.maxAdults,
            maxChildren: room.maxChildren,
            maxOccupancy: room.maxOccupancy,
            bedConfiguration: room.bedConfiguration,
            amenities: room.amenities,
            sizeSqm: room.sizeSqm ?? undefined,
          }}
        />
      </Surface>
    </PageShell>
  );
}
