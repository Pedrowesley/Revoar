"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BottomBar } from "@/components/bottom-bar";
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
  payment: { id: string; method: string; status: string; pixCopyPaste: string | null; sandbox: boolean; installments?: number } | null;
  refundedCents?: number;
  refundPercent?: number;
  holdExtended?: boolean;
  refundPreview?: { percent: number; refundedCents: number } | null;
};

const STATUS: Record<string, string> = {
  HELD: "Quase lá! Seu quarto está reservado temporariamente.",
  PAYMENT_PENDING: "Pagamento iniciado.",
  REQUESTED: "Pedido enviado. O hotel tem até 24 horas.",
  AWAITING_PAYMENT: "O hotel aceitou. Pague para confirmar.",
  CONFIRMED: "Reserva confirmada.",
  DECLINED: "O hotel recusou. Nada foi cobrado.",
  EXPIRED: "O prazo acabou. Nada foi cobrado.",
  CANCELLED: "Reserva cancelada.",
};

function countdown(iso: string | null, now: number) {
  if (!iso) return null;
  const diff = Math.max(0, new Date(iso).getTime() - now);
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function icsDate(iso: string) {
  return iso.replaceAll("-", "");
}

function downloadIcs(booking: BookingView) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Revoar//Reserva//PT",
    "BEGIN:VEVENT",
    `UID:${booking.code}@revoar`,
    `DTSTART;VALUE=DATE:${icsDate(booking.checkIn)}`,
    `DTEND;VALUE=DATE:${icsDate(booking.checkOut)}`,
    `SUMMARY:Reserva ${booking.code} · ${booking.snapshot.hotelName ?? "Revoar"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${booking.code}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Reservation() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [installments, setInstallments] = useState(1);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function pay() {
    if (!booking) return;
    setError(null);
    setBusy(true);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/pay`, {
        method: "POST",
        body: JSON.stringify({ email, method, installments: method === "CREDIT_CARD" ? installments : 1 }),
      });
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar o pagamento");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!booking?.payment) return;
    setError(null);
    setBusy(true);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/pay/${booking.payment.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível confirmar");
    } finally {
      setBusy(false);
    }
  }

  async function extend() {
    setError(null);
    setBusy(true);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/extend`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível estender o tempo");
    } finally {
      setBusy(false);
    }
  }

  async function regeneratePix() {
    setError(null);
    setBusy(true);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/pay`, {
        method: "POST",
        body: JSON.stringify({ email, method: "PIX", installments: 1 }),
      });
      setBooking(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível gerar outro PIX");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setError(null);
    setBusy(true);
    try {
      const data = await apiFetch<BookingView>(`/guest/bookings/${params.code}/cancel`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setBooking(data);
      setCancelOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cancelar");
    } finally {
      setBusy(false);
    }
  }

  if (!email) return <p className="mx-auto max-w-3xl px-4 py-10">Abra a reserva pelo link do e-mail, com o código e o e-mail do hóspede.</p>;
  if (!booking) return <p className="mx-auto max-w-3xl px-4 py-10">{error ?? "Carregando reserva..."}</p>;

  const canPay = booking.status === "HELD" || booking.status === "AWAITING_PAYMENT";
  const pendingSandbox = booking.payment?.status === "PENDING" && booking.payment.sandbox;
  const canCancel = ["HELD", "PAYMENT_PENDING", "REQUESTED", "AWAITING_PAYMENT", "CONFIRMED"].includes(booking.status);
  const payDeadline = booking.bookingMode === "INSTANT" ? booking.holdExpiresAt : booking.payBy;
  const paying = canPay || booking.status === "PAYMENT_PENDING";
  const remaining = paying ? countdown(payDeadline, now) : null;
  const canExtend = booking.status === "HELD" && booking.bookingMode === "INSTANT" && !booking.holdExtended;
  const canRegeneratePix = booking.payment?.method === "PIX" && booking.payment.status === "PENDING" && remaining != null && remaining !== "0:00";
  const preview = booking.refundPreview;
  const refundCopy =
    booking.status === "CONFIRMED" && preview
      ? preview.percent === 100
        ? `Se cancelar agora, o reembolso é integral: ${brl(preview.refundedCents)}.`
        : `Se cancelar agora, o reembolso é de ${brl(preview.refundedCents)}.`
      : "Se cancelar agora, nada é cobrado.";
  const step = booking.status === "CONFIRMED" ? "Passo 3 de 3" : canPay || booking.status === "PAYMENT_PENDING" ? "Passo 2 de 3" : "Sua reserva";
  const shareText = encodeURIComponent(
    `Reserva ${booking.code} em ${booking.snapshot.hotelName ?? "Revoar"}, de ${booking.checkIn} a ${booking.checkOut}.`,
  );
  const installmentChoices = [1, 3, 6].filter((count) => count === 1 || booking.totalCents >= 10_000);

  return (
    <div className={`mx-auto max-w-3xl px-4 py-6 ${canPay || pendingSandbox ? "pb-40 lg:pb-10" : "pb-10"}`}>
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">{step}</p>
      <p className="mt-2 text-sm font-semibold text-primary">{booking.code}</p>
      <h1 className="mt-1 text-3xl font-bold">{booking.snapshot.hotelName}</h1>
      <p className="mt-2 text-muted-foreground">
        {booking.snapshot.roomName} · {booking.snapshot.rateName} · {booking.checkIn} a {booking.checkOut} · {booking.quantity} quarto(s)
      </p>
      <p className="mt-4 text-lg font-semibold">{brl(booking.totalCents)} total · {booking.nights} noites · impostos inclusos</p>
      <p className="mt-3 text-base">{STATUS[booking.status] ?? booking.status}</p>
      {remaining && <p className="mt-1 text-sm font-semibold">Reservamos seu quarto por {remaining}</p>}
      {canExtend && (
        <button type="button" onClick={extend} disabled={busy} className="mt-4 h-12 rounded-xl border border-border bg-surface px-4 text-sm font-semibold disabled:opacity-60">
          Mais 10 minutos
        </button>
      )}
      <p className="text-sm text-muted-foreground">{booking.snapshot.cancellationLabel}</p>
      {booking.declineReason && <p className="mt-2 text-sm">Motivo da recusa: {booking.declineReason}</p>}
      {typeof booking.refundedCents === "number" && booking.status === "CANCELLED" && (
        <p className="mt-2 text-sm">Reembolso de {brl(booking.refundedCents)}.</p>
      )}
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}

      {canPay && !booking.payment && (
        <div className="mt-6">
          <div role="tablist" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={method === "PIX"}
              onClick={() => setMethod("PIX")}
              className={`h-12 rounded-xl border text-base font-semibold ${method === "PIX" ? "border-primary bg-primary-soft" : "border-border bg-surface"}`}
            >
              PIX
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === "CREDIT_CARD"}
              onClick={() => setMethod("CREDIT_CARD")}
              className={`h-12 rounded-xl border text-base font-semibold ${method === "CREDIT_CARD" ? "border-primary bg-primary-soft" : "border-border bg-surface"}`}
            >
              Cartão
            </button>
          </div>
          {method === "PIX" ? (
            <p className="mt-4 text-sm text-muted-foreground">Pague em até 30 min para garantir. No teste, a confirmação não passa por um banco.</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {installmentChoices.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setInstallments(count)}
                  className={`h-12 rounded-xl border px-4 text-left text-sm font-semibold ${installments === count ? "border-primary bg-primary-soft" : "border-border bg-surface"}`}
                >
                  {count}x {brl(Math.round(booking.totalCents / count))}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {booking.payment?.status === "PENDING" && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <p className="font-semibold">{booking.payment.method === "PIX" ? "PIX" : "Cartão"}</p>
          {booking.payment.pixCopyPaste && (
            <p className="mt-3 break-all rounded-xl bg-muted px-4 py-5 text-base font-medium leading-relaxed">{booking.payment.pixCopyPaste}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Ambiente de teste: esta confirmação não cobra um banco de verdade.</p>
          {canRegeneratePix && (
            <button type="button" onClick={regeneratePix} disabled={busy} className="mt-4 h-12 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-60">
              Gerar outro PIX de teste
            </button>
          )}
        </div>
      )}

      {booking.status === "CONFIRMED" && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-success-soft p-4">
          <p className="font-semibold">Voucher {booking.code}</p>
          <p className="text-sm">
            {booking.snapshot.addressLine}, {booking.snapshot.city}
          </p>
          <div className="mt-4 grid gap-2">
            <a href={`https://wa.me/?text=${shareText}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-surface px-4 text-sm font-semibold">
              Compartilhar no WhatsApp
            </a>
            <button type="button" onClick={() => downloadIcs(booking)} className="h-12 rounded-xl border border-border bg-surface px-4 text-sm font-semibold">
              Adicionar ao calendário
            </button>
          </div>
        </div>
      )}

      {canCancel && !cancelOpen && (
        <button type="button" onClick={() => setCancelOpen(true)} className="mt-6 inline-flex h-11 items-center text-sm font-medium text-danger">
          Cancelar reserva
        </button>
      )}
      {canCancel && cancelOpen && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm">{refundCopy}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={cancel} disabled={busy} className="h-12 rounded-xl bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60">
              Confirmar cancelamento
            </button>
            <button type="button" onClick={() => setCancelOpen(false)} className="h-12 rounded-xl border border-border px-4 text-sm font-semibold">
              Voltar
            </button>
          </div>
        </div>
      )}

      {canPay && !booking.payment && (
        <BottomBar
          eyebrow={method === "PIX" ? "PIX" : `Cartão · ${installments}x`}
          price={remaining ? remaining : undefined}
          action={busy ? "Enviando..." : "Confirmar reserva"}
          onAction={pay}
          disabled={busy}
        />
      )}
      {pendingSandbox && (
        <BottomBar eyebrow="Ambiente de teste" action={busy ? "Confirmando..." : "Confirmar pagamento de teste"} onAction={confirm} disabled={busy} />
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
