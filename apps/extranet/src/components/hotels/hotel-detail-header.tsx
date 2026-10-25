"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelDetail } from "@/lib/hotel";
import { HOTEL_STATUS_LABELS, HotelStatus } from "@/lib/hotel.const";
import { extranetKeys } from "@/lib/query-keys";
import { HotelStatusBadge } from "@/components/hotels/hotel-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LastUpdated } from "@/components/last-updated";
import { useToast } from "@/components/ui/toaster";

type HotelDetailHeaderProps = {
  hotel: HotelDetail;
  onDelete?: () => void;
  deleting?: boolean;
  updatedAt?: number;
};

export function HotelDetailHeader({ hotel, onDelete, deleting, updatedAt }: HotelDetailHeaderProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [correcting, setCorrecting] = useState(false);
  const fullyLocked = !(["DRAFT", "REJECTED", "IN_REVIEW"] as HotelStatus[]).includes(hotel.status);

  async function handleCorrect() {
    if (!confirm("A ficha sai do ar até a equipe Revoar aprovar de novo.")) return;
    const token = getToken();
    if (!token) return;

    setCorrecting(true);
    try {
      await apiFetch(`/extranet/hotels/${hotel.id}/correction`, { method: "POST", token });
      await queryClient.invalidateQueries({ queryKey: extranetKeys.hotel(hotel.id) });
      await queryClient.invalidateQueries({ queryKey: ["extranet", "hotels"] });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Não foi possível abrir a correção.";
      toast.error("Não foi possível corrigir", message);
    } finally {
      setCorrecting(false);
    }
  }

  return (
    <>
      <Link
        href="/hotels"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para meus hotéis
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{hotel.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <HotelStatusBadge status={hotel.status} />
            <LastUpdated updatedAt={updatedAt} />
          </div>
        </div>
        {hotel.status === "ACTIVE" && (
          <Button variant="outline" onClick={handleCorrect} disabled={correcting}>
            Corrigir ficha
          </Button>
        )}
        {hotel.status === "DRAFT" && onDelete && (
          <Button variant="outline" onClick={onDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        )}
      </div>

      {hotel.status === "IN_REVIEW" && (
        <Alert variant="info" className="mb-6">
          Hotel em análise. Alguns campos podem ser editados na aba Dados.
        </Alert>
      )}

      {fullyLocked && (
        <Alert variant="warning" className="mb-6">
          Este hotel está {HOTEL_STATUS_LABELS[hotel.status].toLowerCase()} e não pode ser editado
          no momento.
        </Alert>
      )}

      {hotel.rejectionReason && (
        <Alert variant="danger" title="Motivo da rejeição" className="mb-6">
          {hotel.rejectionReason}
        </Alert>
      )}

      {hotel.statusHistory.length > 0 && (
        <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
          {hotel.statusHistory.map((entry, index) => (
            <li key={index}>
              {entry.fromStatus ? HOTEL_STATUS_LABELS[entry.fromStatus] : "—"} →{" "}
              {HOTEL_STATUS_LABELS[entry.toStatus]} ({entry.actorType})
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
