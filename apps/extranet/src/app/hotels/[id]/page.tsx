"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CreateHotelInput } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatHotelPhone, formatZipCode } from "@/lib/hotel";
import { HotelStatus } from "@/lib/hotel.const";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { HotelDetailHeader } from "@/components/hotels/hotel-detail-header";
import { HotelDetailNav } from "@/components/hotels/hotel-detail-nav";
import { HotelForm } from "@/components/hotels/hotel-form";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function HotelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useRequireAuth();

  const { hotel, loading, error, reload } = useHotel(params.id);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const readOnly = hotel
    ? !EDITABLE_STATUSES.includes(hotel.status) && hotel.status !== "IN_REVIEW"
    : false;
  const partialEdit = hotel?.status === "IN_REVIEW";

  async function handleSubmit(data: CreateHotelInput) {
    const token = getToken();
    if (!token || !hotel) return;
    setSaveError(null);

    try {
      const payload = partialEdit
        ? {
            description: data.description,
            starRating: data.starRating,
            phone: data.phone,
            checkInTime: data.checkInTime,
            checkOutTime: data.checkOutTime,
          }
        : data;

      await apiFetch(`/extranet/hotels/${hotel.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      });
      await reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Não foi possível salvar as alterações.");
      }
    }
  }

  async function handleDelete() {
    const token = getToken();
    if (!token || !hotel) return;
    if (!confirm("Excluir este hotel? Esta ação não pode ser desfeita.")) return;

    setDeleting(true);
    try {
      await apiFetch(`/extranet/hotels/${hotel.id}`, { method: "DELETE", token });
      router.push("/hotels");
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      }
      setDeleting(false);
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
      <HotelDetailHeader hotel={hotel} onDelete={handleDelete} deleting={deleting} />
      <HotelDetailNav
        hotelId={hotel.id}
        activeTab="dados"
        roomCount={hotel.roomCount}
        imageCount={hotel.imageCount}
      />

      {partialEdit && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Hotel em análise. Você pode editar descrição, telefone e horários, mas não nome ou endereço.
        </div>
      )}

      {saveError && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{saveError}</p>
      )}

      <div className="rounded-xl border border-border p-6">
        <HotelForm
          hotel={hotel}
          readOnly={readOnly}
          partialEdit={partialEdit}
          submitLabel="Salvar alterações"
          onSubmit={handleSubmit}
          defaultValues={{
            name: hotel.name,
            description: hotel.description,
            starRating: hotel.starRating ?? undefined,
            addressLine: hotel.addressLine,
            city: hotel.city,
            state: hotel.state,
            zipCode: formatZipCode(hotel.zipCode),
            phone: formatHotelPhone(hotel.phone),
            checkInTime: hotel.checkInTime,
            checkOutTime: hotel.checkOutTime,
          }}
        />
      </div>
    </div>
  );
}
