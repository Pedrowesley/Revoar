"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

type PartnerBooking = {
  id: string;
  code: string;
  status: string;
  bookingMode: string;
  hotelName: string | null;
  checkIn: string;
  checkOut: string;
  quantity: number;
  totalCents: number;
  guestEmail: string;
  guestMessage: string | null;
  snapshot: { roomName?: string; rateName?: string };
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Aguardando você",
  AWAITING_PAYMENT: "Aceito, aguardando pagamento",
  HELD: "Checkout em andamento",
  PAYMENT_PENDING: "Pagamento em andamento",
  CONFIRMED: "Confirmada",
  DECLINED: "Recusada",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};

export default function ReservationsPage() {
  useRequireAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const token = getToken();
  const query = useQuery({
    queryKey: ["extranet", "bookings"],
    enabled: Boolean(token),
    queryFn: () => apiFetch<PartnerBooking[]>("/extranet/bookings", { token: token! }),
  });

  async function decide(id: string, decision: "accept" | "decline") {
    setError(null);
    try {
      await apiFetch(`/extranet/bookings/${id}/decision`, {
        method: "POST",
        token: getToken()!,
        body: JSON.stringify({ decision }),
      });
      await queryClient.invalidateQueries({ queryKey: ["extranet", "bookings"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível responder o pedido");
    }
  }

  return (
    <PageShell width="xl">
      <h1 className="text-2xl font-bold">Reservas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pedidos sob consulta esperam sua resposta por 24 horas. Reserva já confirmada na plataforma não precisa ser bloqueada.
      </p>
      {error && (
        <div className="mt-4">
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
      {query.isLoading && <PageSkeleton />}
      <div className="mt-6 grid gap-3">
        {(query.data ?? []).map((booking) => (
          <Surface key={booking.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {booking.code} · {STATUS_LABEL[booking.status] ?? booking.status}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.hotelName} · {booking.snapshot.roomName} · {booking.checkIn} a {booking.checkOut} ·{" "}
                  {booking.quantity} quarto(s) · {(booking.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-sm">{booking.guestEmail}</p>
                {booking.guestMessage && <p className="mt-1 text-sm text-muted-foreground">“{booking.guestMessage}”</p>}
              </div>
              {booking.status === "REQUESTED" && (
                <div className="flex gap-2">
                  <Button type="button" onClick={() => decide(booking.id, "accept")}>
                    Aceitar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => decide(booking.id, "decline")}>
                    Recusar
                  </Button>
                </div>
              )}
            </div>
          </Surface>
        ))}
        {query.data && query.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma reserva ainda.</p>}
      </div>
    </PageShell>
  );
}
