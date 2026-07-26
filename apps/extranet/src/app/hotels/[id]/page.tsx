"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateHotelInput } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatHotelPhone, formatZipCode } from "@/lib/hotel";
import { HotelStatus } from "@/lib/hotel.const";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { HotelDetailHeader } from "@/components/hotels/hotel-detail-header";
import { HotelDetailNav } from "@/components/hotels/hotel-detail-nav";
import { HotelSetupChecklist } from "@/components/hotels/hotel-setup-checklist";
import { HotelForm } from "@/components/hotels/hotel-form";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function HotelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
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
      await queryClient.invalidateQueries({ queryKey: ["extranet", "hotels"] });
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
      await queryClient.invalidateQueries({ queryKey: ["extranet", "hotels"] });
      router.push("/hotels");
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      }
      setDeleting(false);
    }
  }

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

  return (
    <PageShell width="md">
      <HotelDetailHeader hotel={hotel} onDelete={handleDelete} deleting={deleting} />
      <HotelDetailNav
        hotelId={hotel.id}
        activeTab="dados"
        roomCount={hotel.roomCount}
        imageCount={hotel.imageCount}
      />
      <HotelSetupChecklist hotel={hotel} />

      {partialEdit && (
        <Alert variant="info" className="mb-6">
          Hotel em análise. Você pode editar descrição, telefone e horários, mas não nome ou endereço.
        </Alert>
      )}

      {saveError && (
        <Alert variant="danger" className="mb-4">
          {saveError}
        </Alert>
      )}

      <Surface className="p-6">
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
      </Surface>
    </PageShell>
  );
}
