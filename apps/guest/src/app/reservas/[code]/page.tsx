"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { brl } from "@/lib/format";

type BookingView = {
  code: string;
  status: string;
  bookingMode: "INSTANT" | "REQUEST";
  checkIn: string;
  checkOut: string;
  nights: number;
  quantity: number;
  totalCents: number;
  guestEmail: string;
  holdExpiresAt: string | null;
  respondBy: string | null;
  payBy: string | null;
  declineReason: string | null;
  snapshot: {
    hotelName?: string;
    roomName?: string;
    rateName?: string;
    cancellationLabel?: string;
    mealLabel?: string;
    addressLine?: string;
    city?: string;
  };
  payment: { id: string; method: string; status: string; pixCopyPaste: string | null; sandbox: boolean } | null;
  refundedCents?: number;
  refundPercent?: number;
};

const STATUS: Record<string, string> = {
  HELD: "Quarto segurado. Falta o pagamento.",
  PAYMENT_PENDING: "Pagamento iniciado.",
  REQUESTED: "Pedido enviado. O hotel tem até 24 horas.",
  AWAITING_PAYMENT: "O hotel aceitou. Pague para confirmar.",
  CONFIRMED: "Reserva confirmada.",
  DECLINED: "O hotel recusou. Nada foi cobrado.",
  EXPIRED: "O prazo acabou. Nada foi cobrado.",
  CANCELLED: "Reserva cancelada.",
};

function Reservation() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}?email=${encodeURIComponent(email)}`);
    setBooking(data);
  }

  useEffect(() => {
    if (!email) return;
    load().catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Reserva não encontrada"));
    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [params.code, email]);

  async function pay(method: "PIX" | "CREDIT_CARD") {
    setError(null);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/pay`, {
        method: "POST",
        body: JSON.stringify({ email, method, installments: 1 }),
      });
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar o pagamento");
    }
  }

  async function confirm() {
    if (!booking?.payment) return;
    setError(null);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/pay/${booking.payment.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível confirmar");
    }
  }

  async function cancel() {
    if (!window.confirm("Cancelar esta reserva?")) return;
    setError(null);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/cancel`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cancelar");
    }
  }

  if (!email) return <p className="mx-auto max-w-3xl px-4 py-10">Abra a reserva pelo link do e-mail, com o código e o e-mail do hóspede.</p>;
  if (!booking) return <p className="mx-auto max-w-3xl px-4 py-10">{error ?? "Carregando reserva..."}</p>;

  const canPay = booking.status === "HELD" || booking.status === "AWAITING_PAYMENT";
  const canCancel = ["HELD", "PAYMENT_PENDING", "REQUESTED", "AWAITING_PAYMENT", "CONFIRMED"].includes(booking.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold text-primary">{booking.code}</p>
      <h1 className="mt-2 text-3xl font-bold">{booking.snapshot.hotelName}</h1>
      <p className="mt-2 text-muted-foreground">
        {booking.snapshot.roomName} · {booking.snapshot.rateName} · {booking.checkIn} a {booking.checkOut} · {booking.quantity} quarto(s)
      </p>
      <p className="mt-4 text-lg font-semibold">{brl(booking.totalCents)} total · {booking.nights} noites · impostos inclusos</p>
      <p className="mt-2">{STATUS[booking.status] ?? booking.status}</p>
      <p className="text-sm text-muted-foreground">{booking.snapshot.cancellationLabel}</p>
      {booking.declineReason && <p className="mt-2 text-sm">{booking.declineReason}</p>}
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}

      {canPay && !booking.payment && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => pay("PIX")} className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
            Pagar com PIX
          </button>
          <button type="button" onClick={() => pay("CREDIT_CARD")} className="h-11 rounded-lg border border-border bg-surface px-4 font-semibold">
            Pagar com cartão
          </button>
        </div>
      )}

      {booking.payment?.status === "PENDING" && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <p className="font-semibold">{booking.payment.method === "PIX" ? "PIX" : "Cartão"}</p>
          {booking.payment.pixCopyPaste && <p className="mt-2 break-all text-sm">{booking.payment.pixCopyPaste}</p>}
          {booking.payment.sandbox && (
            <button type="button" onClick={confirm} className="mt-4 h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
              Confirmar pagamento de teste
            </button>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Ambiente de teste: esta confirmação não cobra um banco de verdade.</p>
        </div>
      )}

      {booking.status === "CONFIRMED" && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-success-soft p-4">
          <p className="font-semibold">Voucher {booking.code}</p>
          <p className="text-sm">
            {booking.snapshot.addressLine}, {booking.snapshot.city}
          </p>
        </div>
      )}

      {canCancel && (
        <button type="button" onClick={cancel} className="mt-6 text-sm font-medium text-danger">
          Cancelar reserva
        </button>
      )}
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense>
      <Reservation />
    </Suspense>
  );
}
