"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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

export default function NewRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useRequireAuth();

  const { hotel, loading, error } = useHotel(params.id);
  const [saveError, setSaveError] = useState<string | null>(null);

  const readOnly = hotel ? !EDITABLE_STATUSES.includes(hotel.status) : true;

  async function handleSubmit(data: RoomTypeInput) {
    const token = getToken();
    if (!token) return;
    setSaveError(null);

    try {
      const room = await apiFetch<RoomTypeDetail>(`/extranet/hotels/${params.id}/rooms`, {
        method: "POST",
        token,
        body: JSON.stringify(data),
      });
      router.push(`/hotels/${params.id}/rooms/${room.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Não foi possível criar o quarto.");
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
      </div>
    );
  }

  if (readOnly) {
    router.replace(`/hotels/${params.id}/rooms`);
    return null;
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

      <h1 className="mb-6 text-2xl font-bold">Novo quarto</h1>
      <p className="mb-6 text-sm text-muted-foreground">{hotel.name}</p>

      {saveError && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{saveError}</p>
      )}

      <div className="rounded-xl border border-border p-6">
        <RoomForm submitLabel="Criar quarto" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
