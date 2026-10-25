"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
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

type HotelRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: "DRAFT" | "IN_REVIEW" | "REJECTED" | "ACTIVE" | "INACTIVE";
  partner: { legalName: string };
};

const STATUS_LABELS: Record<HotelRow["status"], string> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em análise",
  REJECTED: "Rejeitado",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export default function HotelsPage() {
  const token = useRequireAuth();
  const [status, setStatus] = useState("");

  const hotelsQuery = useQuery({
    queryKey: [...adminKeys.pendingHotels, "all", status],
    enabled: Boolean(token),
    queryFn: () =>
      apiFetch<HotelRow[]>(`/admin/hotels${status ? `?status=${status}` : ""}`, { token: getToken()! }),
  });

  if (!token || hotelsQuery.isLoading) return <PageSkeleton rows={3} />;

  const hotels = hotelsQuery.data ?? [];
  const error = hotelsQuery.error instanceof ApiError ? hotelsQuery.error.message : null;

  return (
    <PageShell>
      <PageHeader
        title="Hotéis"
        description="Todas as fichas. Aprovar e rejeitar continua no dossiê, só quando o hotel está em análise."
        actions={
          <Link href="/hotels/pending" className="text-sm font-medium text-primary">
            Fila de análise
          </Link>
        }
      />
      <label className="mb-4 block text-sm">
        Status
        <select
          className="ml-2 rounded-lg border border-border bg-surface px-2 py-1"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="DRAFT">Rascunho</option>
          <option value="IN_REVIEW">Em análise</option>
          <option value="REJECTED">Rejeitado</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
        </select>
      </label>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {hotels.length === 0 && (
        <EmptyState icon={Building2} title="Nenhum hotel" description="O filtro não encontrou fichas." />
      )}
      <ul className="space-y-3">
        {hotels.map((hotel) => (
          <Surface as="li" key={hotel.id} className="p-5">
            <Link href={`/hotels/${hotel.id}`} className="font-semibold hover:text-primary">
              {hotel.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {STATUS_LABELS[hotel.status]} · {hotel.city}/{hotel.state} · {hotel.partner.legalName}
            </p>
          </Surface>
        ))}
      </ul>
    </PageShell>
  );
}
