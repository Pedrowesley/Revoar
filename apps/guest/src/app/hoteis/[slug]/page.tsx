"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SearchForm } from "@/components/search-form";
import { apiFetch, ApiError } from "@/lib/api";
import { brl, SearchValues } from "@/lib/format";
import { rememberTrip } from "@/lib/trips";

type Rate = {
  id: string;
  name: string;
  cancellationLabel: string;
  mealLabel: string;
  totalCents: number;
  freeUnits: number;
  bookingMode: "INSTANT" | "REQUEST";
  payAtProperty: string | null;
};

type Room = {
  id: string;
  name: string;
  description: string;
  bedConfiguration: string;
  maxOccupancy: number;
  rates: Rate[];
};

type Detail = {
  hotel: { name: string; description: string; addressLine: string; city: string; checkInTime: string; checkOutTime: string; houseRules: string | null };
  rooms: Room[];
};

function HotelStay() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search: SearchValues = {
    city: searchParams.get("city") ?? "",
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    adults: searchParams.get("adults") ?? "2",
    children: searchParams.get("children") ?? "0",
    rooms: searchParams.get("rooms") ?? "1",
  };
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Rate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!search.city || !search.checkIn) return;
    apiFetch<Detail>(`/guest/hotels/${params.slug}?${searchParams.toString()}`)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Não foi possível abrir o hotel"));
  }, [params.slug, search.city, search.checkIn, search.checkOut, searchParams]);

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !detail) return;
    const form = new FormData(event.currentTarget);
    const children = Number(search.children);
    setSubmitting(true);
    setError(null);
    const body = {
      ratePlanId: selected.id,
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
      additionalGuests: [],
      guestMessage: String(form.get("guestMessage") || "") || undefined,
      idempotencyKey: crypto.randomUUID(),
      expectedTotalCents: selected.totalCents,
    };
    try {
      const booking = await apiFetch<{ code: string; guestEmail: string; totalCents: number }>("/guest/bookings", {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchForm initial={search} />
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}
      {detail && (
        <div className="mt-8 grid gap-6">
          <div>
            <h1 className="text-3xl font-bold">{detail.hotel.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {detail.hotel.addressLine} · check-in {detail.hotel.checkInTime} · check-out {detail.hotel.checkOutTime}
            </p>
            <p className="mt-4 max-w-3xl leading-relaxed">{detail.hotel.description}</p>
            {detail.hotel.houseRules && <p className="mt-3 text-sm text-muted-foreground">{detail.hotel.houseRules}</p>}
          </div>
          {detail.rooms.length === 0 && <p>Nenhum quarto livre nessas datas.</p>}
          {detail.rooms.map((room) => (
            <section key={room.id} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-xl font-semibold">{room.name}</h2>
              <p className="text-sm text-muted-foreground">
                {room.bedConfiguration} · até {room.maxOccupancy} hóspedes
              </p>
              <p className="mt-2 text-sm">{room.description}</p>
              <div className="mt-4 grid gap-3">
                {room.rates.map((rate) => (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => setSelected(rate)}
                    className={`rounded-xl border px-4 py-3 text-left ${selected?.id === rate.id ? "border-primary bg-primary-soft" : "border-border"}`}
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="block font-semibold">{rate.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          {rate.mealLabel} · {rate.cancellationLabel}
                        </span>
                        <span className="block text-sm">
                          {rate.bookingMode === "INSTANT" ? "Reserva imediata" : "Sob consulta · resposta em até 24 h"} · {rate.freeUnits} livre(s)
                        </span>
                      </span>
                      <span className="font-bold">{brl(rate.totalCents)} total</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {selected && (
            <form onSubmit={reserve} className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
              <h2 className="sm:col-span-2 text-lg font-semibold">
                {selected.bookingMode === "INSTANT" ? "Reservar" : "Solicitar reserva"} · {brl(selected.totalCents)}
              </h2>
              {selected.bookingMode === "REQUEST" && (
                <p className="sm:col-span-2 text-sm text-muted-foreground">O hotel responde em até 24 horas. Você só paga se ele aceitar.</p>
              )}
              <input name="firstName" required placeholder="Nome" className="h-11 rounded-lg border border-border px-3" />
              <input name="lastName" required placeholder="Sobrenome" className="h-11 rounded-lg border border-border px-3" />
              <input name="email" type="email" required placeholder="E-mail" className="h-11 rounded-lg border border-border px-3" />
              <input name="phone" required placeholder="Telefone" className="h-11 rounded-lg border border-border px-3" />
              <input name="cpf" required placeholder="CPF" className="h-11 rounded-lg border border-border px-3 sm:col-span-2" />
              {Array.from({ length: Number(search.children) }, (_, index) => (
                <input key={index} name={`childAge${index}`} type="number" min={0} max={17} required placeholder={`Idade da criança ${index + 1}`} className="h-11 rounded-lg border border-border px-3" />
              ))}
              {selected.bookingMode === "REQUEST" && (
                <textarea name="guestMessage" placeholder="Mensagem ao hotel (opcional)" className="min-h-20 rounded-lg border border-border px-3 py-2 sm:col-span-2" />
              )}
              <button type="submit" disabled={submitting} className="h-11 rounded-lg bg-primary font-semibold text-primary-foreground sm:col-span-2">
                {submitting ? "Enviando..." : selected.bookingMode === "INSTANT" ? "Continuar para o pagamento" : "Enviar pedido"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function HotelPage() {
  return (
    <Suspense>
      <HotelStay />
    </Suspense>
  );
}
