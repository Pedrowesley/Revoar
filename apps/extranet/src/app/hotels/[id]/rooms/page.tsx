"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ROOM_AMENITY_LABELS, RoomAmenity } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelStatus } from "@/lib/hotel.const";
import { RoomTypeDetail } from "@/lib/room";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { HotelDetailHeader } from "@/components/hotels/hotel-detail-header";
import { HotelDetailNav } from "@/components/hotels/hotel-detail-nav";
import { Button } from "@/components/ui/button";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function HotelRoomsPage() {
  const params = useParams<{ id: string }>();
  useRequireAuth();

  const { hotel, loading, error, reload } = useHotel(params.id);
  const [rooms, setRooms] = useState<RoomTypeDetail[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const readOnly = hotel ? !EDITABLE_STATUSES.includes(hotel.status) : true;

  const loadRooms = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setRoomsLoading(true);
    setRoomsError(null);

    try {
      const data = await apiFetch<RoomTypeDetail[]>(`/extranet/hotels/${params.id}/rooms`, {
        token,
      });
      setRooms(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setRoomsError(err.message);
      } else {
        setRoomsError("Não foi possível carregar os quartos.");
      }
    } finally {
      setRoomsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (hotel) loadRooms();
  }, [hotel, loadRooms]);

  async function handleDeleteRoom(roomId: string) {
    const token = getToken();
    if (!token || !confirm("Excluir este quarto?")) return;

    try {
      await apiFetch(`/extranet/hotels/${params.id}/rooms/${roomId}`, {
        method: "DELETE",
        token,
      });
      await loadRooms();
      await reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setRoomsError(err.message);
      }
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-red-600">{error ?? "Hotel não encontrado"}</p>
        <Link href="/hotels" className="mt-4 inline-block text-primary hover:underline">
          Voltar para meus hotéis
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <HotelDetailHeader hotel={hotel} />
      <HotelDetailNav
        hotelId={hotel.id}
        activeTab="quartos"
        roomCount={hotel.roomCount}
        imageCount={hotel.imageCount}
      />

      <div className="mb-6 flex items-center justify-between">
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

      {roomsLoading && <p className="text-muted-foreground">Carregando quartos...</p>}
      {roomsError && <p className="text-sm text-red-600">{roomsError}</p>}

      {!roomsLoading && rooms.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">Nenhum quarto cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione ao menos 1 quarto para enviar o hotel para revisão.
          </p>
          {!readOnly && (
            <Link href={`/hotels/${hotel.id}/rooms/new`} className="mt-4 inline-block">
              <Button>Cadastrar quarto</Button>
            </Link>
          )}
        </div>
      )}

      {!roomsLoading && rooms.length > 0 && (
        <ul className="space-y-3">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link
                    href={`/hotels/${hotel.id}/rooms/${room.id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {room.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
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
                        className="rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {ROOM_AMENITY_LABELS[amenity as RoomAmenity]}
                      </span>
                    ))}
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteRoom(room.id)}
                    aria-label={`Excluir ${room.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && hotel.status === "DRAFT" && (
        <div className="mt-8 rounded-xl border border-border p-4 text-sm text-muted-foreground">
          Quando terminar o cadastro de quartos, adicione fotos na aba{" "}
          <Link href={`/hotels/${hotel.id}/photos`} className="font-medium text-primary hover:underline">
            Fotos
          </Link>{" "}
          e envie o hotel para revisão.
        </div>
      )}
    </div>
  );
}
