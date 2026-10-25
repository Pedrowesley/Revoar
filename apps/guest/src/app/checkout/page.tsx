"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomBar } from "@/components/bottom-bar";
import { apiFetch, ApiError } from "@/lib/api";
import { brl, searchQuery, SearchValues } from "@/lib/format";
import { rememberTrip } from "@/lib/trips";

type Rate = {
  id: string;
  name: string;
  cancellationLabel: string;
  mealLabel: string;
  totalCents: number;
  bookingMode: "INSTANT" | "REQUEST";
};

type Room = { id: string; name: string; rates: Rate[] };

type Detail = {
  hotel: { name: string; city: string };
  rooms: Room[];
};

const fieldClass = "mt-1 h-12 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base";

function CheckoutStay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug") ?? "";
  const ratePlanId = searchParams.get("ratePlanId") ?? "";
  const search: SearchValues = {
    city: searchParams.get("city") ?? "",
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    adults: searchParams.get("adults") ?? "2",
    children: searchParams.get("children") ?? "0",
    rooms: searchParams.get("rooms") ?? "1",
  };
  const [detail, setDetail] = useState<Detail | null>(null);
  const [rate, setRate] = useState<Rate | null>(null);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug || !search.city || !search.checkIn) return;
    const query = searchQuery(search);
    apiFetch<Detail>(`/guest/hotels/${slug}?${query}`)
      .then((data) => {
        const match = data.rooms.flatMap((room) => room.rates.map((item) => ({ room, item }))).find((entry) => entry.item.id === ratePlanId);
        setDetail(data);
        setRate(match?.item ?? null);
        setRoomName(match?.room.name ?? "");
        setError(match ? null : "Essa tarifa não está mais disponível nessas datas.");
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Não foi possível abrir o checkout"));
  }, [slug, ratePlanId, search.city, search.checkIn, search.checkOut, search.adults, search.children, search.rooms]);

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rate || !detail) return;
    const form = new FormData(event.currentTarget);
    const children = Number(search.children);
    const extraFirst = String(form.get("extraFirst") ?? "").trim();
    const extraLast = String(form.get("extraLast") ?? "").trim();
    setSubmitting(true);
    setError(null);
    const body = {
      ratePlanId: rate.id,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: Number(search.adults),
      children,
      quantity: Number(search.rooms),
      firstName: String(form.get("firstName")),
      lastName: String(form.get("lastName")),
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      cpf: String(form.get("cpf")),
      childAges: Array.from({ length: children }, (_, index) => Number(form.get(`childAge${index}`) || 0)),
      additionalGuests: extraFirst && extraLast ? [{ firstName: extraFirst, lastName: extraLast }] : [],
      guestMessage: String(form.get("guestMessage") || "") || undefined,
      idempotencyKey: crypto.randomUUID(),
      expectedTotalCents: rate.totalCents,
    };
    try {
      const booking = await apiFetch<{ code: string; guestEmail: string }>("/guest/bookings", {
        method: "POST",
        body: JSON.stringify(body),
      });
      rememberTrip({ code: booking.code, email: booking.guestEmail, hotelName: detail.hotel.name });
      router.push(`/reservas/${booking.code}?email=${encodeURIComponent(booking.guestEmail)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && typeof err.body.totalCents === "number") {
        const accepted = window.confirm(err.message);
        if (accepted) {
          const booking = await apiFetch<{ code: string; guestEmail: string }>("/guest/bookings", {
            method: "POST",
            body: JSON.stringify({ ...body, idempotencyKey: crypto.randomUUID(), acceptPriceChange: true, expectedTotalCents: err.body.totalCents }),
          });
          rememberTrip({ code: booking.code, email: booking.guestEmail, hotelName: detail.hotel.name });
          router.push(`/reservas/${booking.code}?email=${encodeURIComponent(booking.guestEmail)}`);
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : "Não foi possível reservar");
    } finally {
      setSubmitting(false);
    }
  }

  const back = `/hoteis/${slug}?${searchQuery(search)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-40 lg:pb-10">
      <Link href={back} className="inline-flex h-11 items-center text-sm font-semibold text-primary">
        Voltar ao quarto
      </Link>
      <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-primary">Passo 1 de 3</p>
      <h1 className="mt-1 text-3xl font-bold">Seus dados</h1>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}
      {rate && detail && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <form id="guest-form" onSubmit={reserve} className="grid min-w-0 scroll-mb-40 gap-3">
            <label className="text-sm font-medium">
              Nome
              <input name="firstName" required autoComplete="given-name" className={fieldClass} />
            </label>
            <label className="text-sm font-medium">
              Sobrenome
              <input name="lastName" required autoComplete="family-name" className={fieldClass} />
            </label>
            <label className="text-sm font-medium">
              E-mail
              <input name="email" type="email" required autoComplete="email" inputMode="email" className={fieldClass} />
            </label>
            <label className="text-sm font-medium">
              Telefone
              <input name="phone" required autoComplete="tel" inputMode="tel" className={fieldClass} />
            </label>
            <label className="text-sm font-medium">
              CPF
              <input name="cpf" required inputMode="numeric" autoComplete="off" className={fieldClass} />
            </label>
            {Array.from({ length: Number(search.children) }, (_, index) => (
              <label key={index} className="text-sm font-medium">
                Idade da criança {index + 1}
                <input name={`childAge${index}`} type="number" min={0} max={17} required inputMode="numeric" className={fieldClass} />
              </label>
            ))}
            <label className="flex scroll-mb-28 items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
              <input name="lgpd" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0" />
              <span>Concordo com o uso dos meus dados para esta reserva.</span>
            </label>
            <details className="rounded-xl border border-border bg-surface px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">Outros hóspedes</summary>
              <div className="mt-3 grid gap-3">
                <label className="text-sm font-medium">
                  Nome do acompanhante
                  <input name="extraFirst" autoComplete="off" className={fieldClass} />
                </label>
                <label className="text-sm font-medium">
                  Sobrenome do acompanhante
                  <input name="extraLast" autoComplete="off" className={fieldClass} />
                </label>
              </div>
            </details>
            {rate.bookingMode === "REQUEST" && (
              <>
                <p className="text-sm text-muted-foreground">O hotel responde em até 24 horas. Você só paga se ele aceitar.</p>
                <label className="text-sm font-medium">
                  Mensagem ao hotel (opcional)
                  <textarea name="guestMessage" className="mt-1 min-h-24 w-full scroll-mb-28 rounded-lg border border-border bg-surface px-3 py-2 text-base" />
                </label>
              </>
            )}
          </form>
          <div className="lg:sticky lg:top-24">
            <aside className="hidden rounded-2xl border border-border bg-surface p-5 lg:block">
              <p className="font-semibold">{detail.hotel.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {roomName} · {rate.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search.checkIn} a {search.checkOut} · {search.rooms} quarto(s)
              </p>
              <p className="mt-3 text-sm">{rate.mealLabel}</p>
              <p className="text-sm text-muted-foreground">{rate.cancellationLabel}</p>
            </aside>
            <BottomBar
              eyebrow={`${detail.hotel.name} · ${roomName}`}
              price={`${brl(rate.totalCents)} total`}
              action={submitting ? "Enviando..." : rate.bookingMode === "INSTANT" ? "Continuar" : "Enviar pedido"}
              type="submit"
              form="guest-form"
              disabled={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutStay />
    </Suspense>
  );
}
