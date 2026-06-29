"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelSummary } from "@/lib/hotel";
import { HOTEL_STATUS_FILTERS, HotelStatus } from "@/lib/hotel.const";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { HotelStatusBadge } from "@/components/hotels/hotel-status-badge";
import { Button } from "@/components/ui/button";

export default function HotelsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useRequireAuth();

  const statusFilter = (searchParams.get("status") as HotelStatus | null) ?? "ALL";

  const [hotels, setHotels] = useState<HotelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHotels = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const data = await apiFetch<HotelSummary[]>(`/extranet/hotels${query}`, { token: getToken()! });
      setHotels(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar os hotéis.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  function setStatusFilter(status: HotelStatus | "ALL") {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/hotels?${params.toString()}`);
  }

  if (!token) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus hotéis</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas propriedades cadastradas</p>
        </div>
        <Link href="/hotels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo hotel
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {HOTEL_STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && hotels.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">Nenhum hotel encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter !== "ALL"
              ? "Tente outro filtro ou cadastre um novo hotel."
              : "Comece cadastrando sua primeira propriedade."}
          </p>
          <Link href="/hotels/new" className="mt-4 inline-block">
            <Button>Cadastrar hotel</Button>
          </Link>
        </div>
      )}

      {!loading && hotels.length > 0 && (
        <ul className="space-y-3">
          {hotels.map((hotel) => (
            <li key={hotel.id}>
              <Link
                href={`/hotels/${hotel.id}`}
                className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted"
              >
                <div>
                  <p className="font-semibold">{hotel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {hotel.city}, {hotel.state} · {hotel.roomCount} quarto(s) · {hotel.imageCount} foto(s)
                  </p>
                </div>
                <HotelStatusBadge status={hotel.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
