"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SearchForm } from "@/components/search-form";
import { apiFetch, ApiError } from "@/lib/api";
import { brl, SearchValues } from "@/lib/format";

type HotelCard = {
  slug: string;
  name: string;
  city: string;
  addressLine: string;
  starRating: number | null;
  nights: number;
  totalCents: number;
  bookingMode: "INSTANT" | "REQUEST";
};

function Results() {
  const params = useSearchParams();
  const search: SearchValues = {
    city: params.get("city") ?? "",
    checkIn: params.get("checkIn") ?? "",
    checkOut: params.get("checkOut") ?? "",
    adults: params.get("adults") ?? "2",
    children: params.get("children") ?? "0",
    rooms: params.get("rooms") ?? "1",
  };
  const [hotels, setHotels] = useState<HotelCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = params.toString();
    if (!search.city || !search.checkIn || !search.checkOut) return;
    apiFetch<{ hotels: HotelCard[] }>(`/guest/search?${query}`)
      .then((data) => {
        setHotels(data.hotels);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Não foi possível buscar"));
  }, [params, search.city, search.checkIn, search.checkOut]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchForm initial={search} />
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}
      <div className="mt-6 grid gap-3">
        {hotels?.map((hotel) => (
          <Link
            key={hotel.slug}
            href={`/hoteis/${hotel.slug}?${params.toString()}`}
            className="rounded-2xl border border-border bg-surface p-5 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{hotel.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {hotel.addressLine} · {hotel.city}
                  {hotel.starRating ? ` · ${hotel.starRating} estrelas` : ""}
                </p>
                <p className="mt-2 text-sm">
                  {hotel.bookingMode === "INSTANT" ? "Reserva imediata" : "Sob consulta · resposta em até 24 h"}
                </p>
              </div>
              <p className="text-right">
                <span className="block text-lg font-bold">{brl(hotel.totalCents)} total</span>
                <span className="text-sm text-muted-foreground">{hotel.nights} noites · impostos inclusos</span>
              </p>
            </div>
          </Link>
        ))}
        {hotels && hotels.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada livre nessas datas. Tente outro período.</p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <Results />
    </Suspense>
  );
}
