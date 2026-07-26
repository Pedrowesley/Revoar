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
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

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
        <RoomForm submitLabel="Criar quarto" onSubmit={handleSubmit} />
      </Surface>
    </PageShell>
  );
}
