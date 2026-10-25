"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";

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
  respondBy: string | null;
  snapshot: { roomName?: string; rateName?: string };
};

function responseClock(iso: string | null, now: number) {
  if (!iso) return "Prazo de 24 horas";
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "O prazo de 24 horas acabou";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `Faltam ${hours} h ${String(minutes).padStart(2, "0")} min das 24 horas`;
}

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
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const token = getToken();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ["extranet", "bookings"],
    enabled: Boolean(token),
    queryFn: () => apiFetch<PartnerBooking[]>("/extranet/bookings", { token: token! }),
  });

  async function decide(id: string, decision: "accept" | "decline", reason?: string) {
    setError(null);
    try {
      await apiFetch(`/extranet/bookings/${id}/decision`, {
        method: "POST",
        token: getToken()!,
        body: JSON.stringify({ decision, reason: reason?.trim() || undefined }),
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
          <Surface key={booking.id} as="article" aria-label={booking.code} className="p-4">
            <p className="font-semibold">
              {booking.code} · {STATUS_LABEL[booking.status] ?? booking.status}
            </p>
            <p className="text-sm text-muted-foreground">
              {booking.hotelName} · {booking.snapshot.roomName} · {booking.checkIn} a {booking.checkOut} · {booking.quantity} quarto(s) ·{" "}
              {(booking.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-sm">{booking.guestEmail}</p>
            {booking.guestMessage && <p className="mt-1 text-sm text-muted-foreground">“{booking.guestMessage}”</p>}
            {booking.status === "REQUESTED" && (
              <div className="mt-4 grid max-w-xl gap-3">
                <p className="text-sm font-semibold">{responseClock(booking.respondBy, now)}</p>
                <label className="grid gap-1 text-sm font-medium">
                  Motivo da recusa (opcional)
                  <Textarea
                    value={reasons[booking.id] ?? ""}
                    maxLength={300}
                    onChange={(event) => setReasons((current) => ({ ...current, [booking.id]: event.target.value }))}
                  />
                </label>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => decide(booking.id, "accept")}>
                    Aceitar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => decide(booking.id, "decline", reasons[booking.id])}>
                    Recusar
                  </Button>
                </div>
              </div>
            )}
          </Surface>
        ))}
        {query.data && query.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma reserva ainda.</p>}
      </div>
    </PageShell>
  );
}
