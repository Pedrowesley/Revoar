"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";

type PendingHotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  partner: { legalName: string; tradeName: string | null };
  roomCount: number;
  imageCount: number;
  updatedAt: string;
};

export default function PendingHotelsPage() {
  useRequireAuth();
  const [hotels, setHotels] = useState<PendingHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHotels = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<PendingHotel[]>("/admin/hotels/pending", { token });
      setHotels(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar ao painel
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Hotéis em revisão</h1>

      {loading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && hotels.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">Nenhum hotel em revisão</p>
        </div>
      )}

      <ul className="space-y-3">
        {hotels.map((hotel) => (
          <li key={hotel.id}>
            <Link
              href={`/hotels/${hotel.id}`}
              className="block rounded-xl border border-border p-5 hover:bg-muted"
            >
              <p className="font-semibold">{hotel.name}</p>
              <p className="text-sm text-muted-foreground">
                {hotel.city}, {hotel.state} · {hotel.partner.legalName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hotel.roomCount} quarto(s) · {hotel.imageCount} foto(s)
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
