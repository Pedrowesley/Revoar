"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Hotel, Plus } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelSummary } from "@/lib/hotel";
import { HOTEL_STATUS_FILTERS, HotelStatus } from "@/lib/hotel.const";
import { extranetKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { HotelStatusBadge } from "@/components/hotels/hotel-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { LastUpdated } from "@/components/last-updated";

export default function HotelsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useRequireAuth();

  const statusFilter = (searchParams.get("status") as HotelStatus | null) ?? "ALL";

  const hotelsQuery = useQuery({
    queryKey: extranetKeys.hotels(statusFilter),
    enabled: Boolean(token),
    refetchInterval: (query) => {
      const hasInReview = query.state.data?.some((hotel) => hotel.status === "IN_REVIEW");
      return hasInReview ? 30_000 : false;
    },
    queryFn: async () => {
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      return apiFetch<HotelSummary[]>(`/extranet/hotels${query}`, { token: getToken()! });
    },
  });

  function setStatusFilter(status: HotelStatus | "ALL") {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/hotels?${params.toString()}`);
  }

  if (!token || hotelsQuery.isPending) return <PageSkeleton rows={4} />;

  const hotels = hotelsQuery.data ?? [];
  const error =
    hotelsQuery.error instanceof ApiError
      ? hotelsQuery.error.message
      : hotelsQuery.isError
        ? "Não foi possível carregar os hotéis."
        : null;

  return (
    <PageShell>
      <PageHeader
        title="Meus hotéis"
        description="Gerencie suas propriedades cadastradas"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <LastUpdated updatedAt={hotelsQuery.dataUpdatedAt} />
            <Link href="/hotels/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo hotel
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {HOTEL_STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              statusFilter === filter.value
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-surface text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {!error && hotels.length === 0 && (
        <EmptyState
          icon={Hotel}
          title="Nenhum hotel encontrado"
          description={
            statusFilter !== "ALL"
              ? "Tente outro filtro ou cadastre um novo hotel."
              : "Comece cadastrando sua primeira propriedade."
          }
          action={
            <Link href="/hotels/new">
              <Button>Cadastrar hotel</Button>
            </Link>
          }
        />
      )}

      {hotels.length > 0 && (
        <ul className="space-y-3">
          {hotels.map((hotel) => (
            <li key={hotel.id}>
              <Link href={`/hotels/${hotel.id}`}>
                <Surface interactive className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="font-semibold">{hotel.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {hotel.city}, {hotel.state} · {hotel.roomCount} quarto(s) · {hotel.imageCount}{" "}
                      foto(s)
                    </p>
                  </div>
                  <HotelStatusBadge status={hotel.status} />
                </Surface>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
