"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { RoomTypeInput } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelStatus } from "@/lib/hotel.const";
import { RoomTypeDetail } from "@/lib/room";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { RoomForm } from "@/components/rooms/room-form";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function EditRoomPage() {
  const params = useParams<{ id: string; roomId: string }>();
  useRequireAuth();

  const { hotel, loading: hotelLoading, error: hotelError } = useHotel(params.id);
  const [room, setRoom] = useState<RoomTypeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const readOnly = hotel ? !EDITABLE_STATUSES.includes(hotel.status) : true;

  const loadRoom = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const rooms = await apiFetch<RoomTypeDetail[]>(`/extranet/hotels/${params.id}/rooms`, {
        token,
      });
      const found = rooms.find((item) => item.id === params.roomId);
      if (!found) {
        setError("Quarto não encontrado.");
      } else {
        setRoom(found);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Quarto não encontrado.");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, params.roomId]);

  useEffect(() => {
    if (hotel) loadRoom();
  }, [hotel, loadRoom]);

  async function handleSubmit(data: RoomTypeInput) {
    const token = getToken();
    if (!token || !room) return;
    setSaveError(null);

    try {
      const updated = await apiFetch<RoomTypeDetail>(
        `/extranet/hotels/${params.id}/rooms/${room.id}`,
        { method: "PATCH", token, body: JSON.stringify(data) },
      );
      setRoom(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Não foi possível salvar as alterações.");
      }
    }
  }

  if (hotelLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (hotelError || error || !hotel || !room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-red-600">{hotelError ?? error ?? "Quarto não encontrado"}</p>
        <Link
          href={`/hotels/${params.id}/rooms`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          Voltar para quartos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/hotels/${params.id}/rooms`}
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para quartos
      </Link>

      <h1 className="mb-2 text-2xl font-bold">{room.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{hotel.name}</p>

      {saveError && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{saveError}</p>
      )}

      <div className="rounded-xl border border-border p-6">
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
      </div>
    </div>
  );
}
