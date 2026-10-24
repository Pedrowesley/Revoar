"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { adminKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { LastUpdated } from "@/components/last-updated";

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
  const token = useRequireAuth();

  const hotelsQuery = useQuery({
    queryKey: adminKeys.pendingHotels,
    enabled: Boolean(token),
    refetchInterval: 15_000,
    queryFn: () => apiFetch<PendingHotel[]>("/admin/hotels/pending", { token: getToken()! }),
  });

  if (!token || hotelsQuery.isLoading) return <PageSkeleton rows={3} />;

  if (hotelsQuery.error instanceof ApiError && hotelsQuery.error.status === 401) {
    return null;
  }

  const hotels = hotelsQuery.data ?? [];
  const error =
    hotelsQuery.error instanceof ApiError
      ? hotelsQuery.error.message
      : hotelsQuery.isError
        ? "Não foi possível carregar os hotéis."
        : null;

  return (
    <PageShell>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar ao painel
      </Link>

      <PageHeader
        title="Hotéis em revisão"
        description="Revise o inventário enviado pelos parceiros. A fila atualiza sozinha."
        actions={<LastUpdated updatedAt={hotelsQuery.dataUpdatedAt} />}
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {hotels.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Nenhum hotel em revisão"
          description="A fila está vazia no momento."
        />
      )}

      <ul className="space-y-3">
        {hotels.map((hotel) => (
          <li key={hotel.id}>
            <Link href={`/hotels/${hotel.id}`}>
              <Surface interactive className="block p-5">
                <p className="font-semibold">{hotel.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hotel.city}, {hotel.state} · {hotel.partner.legalName}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {hotel.roomCount} quarto(s) · {hotel.imageCount} foto(s)
                </p>
              </Surface>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
