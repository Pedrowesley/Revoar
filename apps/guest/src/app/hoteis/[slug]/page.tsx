"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BottomBar } from "@/components/bottom-bar";
import { PhotoCover } from "@/components/photo-cover";
import { SearchForm } from "@/components/search-form";
import { hotelAmenityLabel, roomAmenityLabel } from "@/lib/amenities";
import { apiFetch, ApiError } from "@/lib/api";
import { brl, SearchValues, stayTotal } from "@/lib/format";
import { StayPhoto } from "@/lib/media";

type Rate = {
  id: string;
  name: string;
  cancellationLabel: string;
  mealLabel: string;
  totalCents: number;
  nightlyCents: number[];
  freeUnits: number;
  maxQuantity: number;
  bookingMode: "INSTANT" | "REQUEST";
  payAtProperty: string | null;
};

type Room = {
  id: string;
  name: string;
  description: string;
  bedConfiguration: string;
  sizeSqm: number | null;
  maxOccupancy: number;
  amenities: string[];
  images: StayPhoto[];
  rates: Rate[];
};

type Detail = {
  hotel: {
    name: string;
    description: string;
    addressLine: string;
    city: string;
    checkInTime: string;
    checkOutTime: string;
    houseRules: string | null;
    amenities: string[];
    images: StayPhoto[];
  };
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
  const [quantity, setQuantity] = useState(1);

  function choose(rate: Rate) {
    setSelected(rate);
    setQuantity(rate.maxQuantity);
  }

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
      quantity: String(quantity),
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
            <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
              <PhotoCover photos={detail.hotel.images} title={detail.hotel.name} emptyLabel="As fotos deste hotel ainda não foram enviadas." />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{detail.hotel.name}</h1>
              <p className="mt-2 text-muted-foreground">
                {detail.hotel.addressLine} · check-in {detail.hotel.checkInTime} · check-out {detail.hotel.checkOutTime}
              </p>
              <p className="mt-4 max-w-3xl leading-relaxed">{detail.hotel.description}</p>
              {detail.hotel.amenities.length > 0 && (
                <ul aria-label="Comodidades do hotel" className="mt-4 flex flex-wrap gap-2">
                  {detail.hotel.amenities.map((code) => (
                    <li key={code} className="rounded-full border border-border bg-muted px-3 py-1 text-sm">
                      {hotelAmenityLabel(code)}
                    </li>
                  ))}
                </ul>
              )}
              {detail.hotel.houseRules && <p className="mt-3 text-sm text-muted-foreground">{detail.hotel.houseRules}</p>}
            </div>
            {detail.rooms.length === 0 && <p>Nenhum quarto livre nessas datas.</p>}
            {detail.rooms.map((room) => (
              <section key={room.id} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
                <PhotoCover photos={room.images} title={room.name} emptyLabel="As fotos deste quarto ainda não foram enviadas." />
                <div className="p-4">
                <h2 className="text-xl font-semibold">{room.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {room.sizeSqm ? `${room.sizeSqm} m² · ` : ""}
                  {room.bedConfiguration} · até {room.maxOccupancy} hóspedes
                </p>
                <p className="mt-2 text-sm">{room.description}</p>
                {room.amenities.length > 0 && (
                  <ul aria-label={`Comodidades de ${room.name}`} className="mt-3 flex flex-wrap gap-2">
                    {room.amenities.map((code) => (
                      <li key={code} className="rounded-full border border-border bg-muted px-3 py-1 text-sm">
                        {roomAmenityLabel(code)}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 grid gap-3">
                  {room.rates.map((rate) => {
                    const shown = selected?.id === rate.id ? stayTotal(rate.nightlyCents, quantity) : rate.totalCents;
                    return (
                    <button
                      key={rate.id}
                      type="button"
                      onClick={() => choose(rate)}
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
                        <span className="font-bold">{brl(shown)} total</span>
                      </span>
                    </button>
                    );
                  })}
                </div>
                {selected && room.rates.some((rate) => rate.id === selected.id) && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{quantity === 1 ? "1 quarto" : `${quantity} quartos`}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Menos um quarto"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        className="h-12 w-12 rounded-xl border border-border text-lg font-semibold disabled:opacity-40"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        aria-label="Mais um quarto"
                        disabled={quantity >= selected.maxQuantity}
                        onClick={() => setQuantity((current) => Math.min(selected.maxQuantity, current + 1))}
                        className="h-12 w-12 rounded-xl border border-border text-lg font-semibold disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </section>
            ))}
          </div>
          {selected && (
            <div className="lg:sticky lg:top-24">
              <BottomBar
                eyebrow={selected.bookingMode === "INSTANT" ? "Reserva imediata" : "Você só paga se o hotel aceitar"}
                price={`${brl(stayTotal(selected.nightlyCents, quantity))} total`}
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
