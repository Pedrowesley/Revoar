"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SearchForm } from "@/components/search-form";
import { Sheet } from "@/components/sheet";
import { apiFetch, ApiError } from "@/lib/api";
import { brl, SearchValues } from "@/lib/format";
import { mediaUrl } from "@/lib/media";

type HotelCard = {
  slug: string;
  name: string;
  city: string;
  addressLine: string;
  imageUrl: string | null;
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [instantOnly, setInstantOnly] = useState(false);

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

  const visible = hotels?.filter((hotel) => !instantOnly || hotel.bookingMode === "INSTANT") ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8">
      <div className="sticky top-16 z-20 -mx-4 bg-background px-4 py-3">
        <SearchForm compact initial={search} />
        <button type="button" onClick={() => setFiltersOpen(true)} className="mt-2 h-11 rounded-xl px-1 text-sm font-semibold text-primary">
          Filtros
        </button>
      </div>
      <Sheet open={filtersOpen} title="Filtros" onClose={() => setFiltersOpen(false)}>
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input type="checkbox" checked={instantOnly} onChange={(event) => setInstantOnly(event.target.checked)} className="h-5 w-5" />
          Só reserva imediata
        </label>
        <button type="button" onClick={() => setFiltersOpen(false)} className="mt-4 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground">
          Ver resultados
        </button>
      </Sheet>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}
      <div className="mt-2 grid gap-3">
        {visible?.map((hotel) => (
          <Link
            key={hotel.slug}
            href={`/hoteis/${hotel.slug}?${params.toString()}`}
            className="block min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
          >
            {hotel.imageUrl && <img src={mediaUrl(hotel.imageUrl)} alt="" className="aspect-[16/10] w-full object-cover" />}
            <div className="p-4">
            <h2 className="text-xl font-semibold">{hotel.name}</h2>
            <p className="text-sm text-muted-foreground">
              {hotel.addressLine} · {hotel.city}
              {hotel.starRating ? ` · ${hotel.starRating} estrelas` : ""}
            </p>
            <p className="mt-2 text-sm">{hotel.bookingMode === "INSTANT" ? "Reserva imediata" : "Sob consulta · resposta em até 24 h"}</p>
            <p className="mt-3">
              <span className="block text-lg font-bold">{brl(hotel.totalCents)} total</span>
              <span className="text-sm text-muted-foreground">{hotel.nights} noites · impostos inclusos</span>
            </p>
            </div>
          </Link>
        ))}
        {visible && visible.length === 0 && <p className="text-sm text-muted-foreground">Nada livre nessas datas. Tente outro período.</p>}
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
