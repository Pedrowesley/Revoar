"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { ROOM_AMENITY_LABELS, RoomAmenity } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelStatus } from "@/lib/hotel.const";
import { RoomTypeDetail } from "@/lib/room";
import { extranetKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { HotelDetailHeader } from "@/components/hotels/hotel-detail-header";
import { HotelDetailNav } from "@/components/hotels/hotel-detail-nav";
import { HotelSetupChecklist } from "@/components/hotels/hotel-setup-checklist";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function HotelRoomsPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  useRequireAuth();

  const { hotel, loading, error, reload } = useHotel(params.id);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const readOnly = hotel ? !EDITABLE_STATUSES.includes(hotel.status) : true;

  const roomsQuery = useQuery({
    queryKey: extranetKeys.rooms(params.id),
    enabled: Boolean(hotel),
    queryFn: () =>
      apiFetch<RoomTypeDetail[]>(`/extranet/hotels/${params.id}/rooms`, {
        token: getToken()!,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (roomId: string) =>
      apiFetch(`/extranet/hotels/${params.id}/rooms/${roomId}`, {
        method: "DELETE",
        token: getToken()!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: extranetKeys.rooms(params.id) });
      await reload();
      await queryClient.invalidateQueries({ queryKey: ["extranet", "hotels"] });
    },
    onError: (err) => {
      setRoomsError(err instanceof ApiError ? err.message : "Não foi possível excluir o quarto.");
    },
  });

  if (loading) {
    return <PageSkeleton rows={4} />;
  }

  if (error || !hotel) {
    return (
      <PageShell width="md" className="py-16 text-center">
        <p className="text-danger">{error ?? "Hotel não encontrado"}</p>
        <Link href="/hotels" className="mt-4 inline-block text-primary hover:underline">
          Voltar para meus hotéis
        </Link>
      </PageShell>
    );
  }

  const rooms = roomsQuery.data ?? [];
  const loadRoomsError =
    roomsQuery.error instanceof ApiError
      ? roomsQuery.error.message
      : roomsQuery.isError
        ? "Não foi possível carregar os quartos."
        : null;

  return (
    <PageShell width="md">
      <HotelDetailHeader hotel={hotel} />
      <HotelDetailNav
        hotelId={hotel.id}
        activeTab="quartos"
        roomCount={hotel.roomCount}
        imageCount={hotel.imageCount}
      />
      <HotelSetupChecklist hotel={hotel} />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tipos de quarto</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os quartos com informações completas para o viajante.
          </p>
        </div>
        {!readOnly && (
          <Link href={`/hotels/${hotel.id}/rooms/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </Link>
        )}
      </div>

      {roomsQuery.isLoading && <PageSkeleton rows={2} />}
      {(roomsError || loadRoomsError) && (
        <Alert variant="danger" className="mb-4">
          {roomsError ?? loadRoomsError}
        </Alert>
      )}

      {!roomsQuery.isLoading && rooms.length === 0 && (
        <EmptyState
          title="Nenhum quarto cadastrado"
          description="Adicione ao menos 1 quarto para enviar o hotel para revisão."
          action={
            !readOnly ? (
              <Link href={`/hotels/${hotel.id}/rooms/new`}>
                <Button>Cadastrar quarto</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {!roomsQuery.isLoading && rooms.length > 0 && (
        <ul className="space-y-3">
          {rooms.map((room) => (
            <Surface as="li" key={room.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link
                    href={`/hotels/${hotel.id}/rooms/${room.id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {room.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {room.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {room.maxAdults} adulto(s) · {room.maxChildren} criança(s) · ocupação{" "}
                    {room.maxOccupancy} · {room.bedConfiguration}
                    {room.sizeSqm ? ` · ${room.sizeSqm} m²` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {room.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {ROOM_AMENITY_LABELS[amenity as RoomAmenity]}
                      </span>
                    ))}
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!confirm("Excluir este quarto?")) return;
                      setRoomsError(null);
                      deleteMutation.mutate(room.id);
                    }}
                    aria-label={`Excluir ${room.name}`}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Surface>
          ))}
        </ul>
      )}

      {!readOnly && hotel.status === "DRAFT" && (
        <Alert variant="info" className="mt-8">
          Quando terminar o cadastro de quartos, adicione fotos na aba{" "}
          <Link href={`/hotels/${hotel.id}/photos`} className="font-medium underline">
            Fotos
          </Link>{" "}
          e envie o hotel para revisão.
        </Alert>
      )}
    </PageShell>
  );
}
