"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BottomBar } from "@/components/bottom-bar";
import { SearchForm } from "@/components/search-form";
import { apiFetch, ApiError } from "@/lib/api";
import { brl, SearchValues } from "@/lib/format";

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

  useEffect(() => {
    if (!search.city || !search.checkIn) return;
    apiFetch<Detail>(`/guest/hotels/${params.slug}?${searchParams.toString()}`)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Não foi possível abrir o hotel"));
  }, [params.slug, search.city, search.checkIn, search.checkOut, searchParams]);

  function continueToCheckout() {
    if (!selected) return;
    const query = new URLSearchParams({
      slug: params.slug,
      ratePlanId: selected.id,
      ...search,
    });
    router.push(`/checkout?${query.toString()}`);
  }

  return (
    <div className={`mx-auto max-w-6xl px-4 py-4 ${selected ? "pb-36 lg:pb-10" : "pb-8"}`}>
      <div className="sticky top-16 z-20 -mx-4 bg-background px-4 py-3">
        <SearchForm compact initial={search} />
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}
      {detail && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="grid min-w-0 gap-4">
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
              <section key={room.id} className="rounded-2xl border border-border bg-surface p-4">
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
                      className={`min-h-12 rounded-xl border px-4 py-3 text-left ${selected?.id === rate.id ? "border-primary bg-primary-soft" : "border-border"}`}
                    >
                      <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0">
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
          </div>
          {selected && (
            <div className="lg:sticky lg:top-24">
              <BottomBar
                eyebrow={selected.bookingMode === "INSTANT" ? "Reserva imediata" : "Você só paga se o hotel aceitar"}
                price={`${brl(selected.totalCents)} total`}
                action={selected.bookingMode === "INSTANT" ? "Reservar" : "Solicitar reserva"}
                onAction={continueToCheckout}
              />
            </div>
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
