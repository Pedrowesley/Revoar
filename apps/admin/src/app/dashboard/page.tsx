"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, Clock, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { adminKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

type PendingPartner = { id: string; legalName: string };
type PendingHotel = { id: string; name: string };

export default function AdminDashboardPage() {
  const token = useRequireAuth();

  const partnersQuery = useQuery({
    queryKey: adminKeys.pendingPartners,
    enabled: Boolean(token),
    refetchInterval: 15_000,
    queryFn: () =>
      apiFetch<PendingPartner[]>("/admin/partners/pending", { token: getToken()! }),
  });

  const hotelsQuery = useQuery({
    queryKey: adminKeys.pendingHotels,
    enabled: Boolean(token),
    refetchInterval: 15_000,
    queryFn: () => apiFetch<PendingHotel[]>("/admin/hotels/pending", { token: getToken()! }),
  });

  if (!token || partnersQuery.isLoading || hotelsQuery.isLoading) {
    return <PageSkeleton rows={2} />;
  }

  const pendingPartners = partnersQuery.data?.length ?? 0;
  const pendingHotels = hotelsQuery.data?.length ?? 0;

  return (
    <PageShell width="xl">
      <PageHeader
        eyebrow="Moderação Revoar"
        title="Painel administrativo"
        description="Aprove parceiros e hotéis cadastrados pela extranet."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Surface className="p-6">
          <p className="text-sm text-muted-foreground">Parceiros pendentes</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">{pendingPartners}</p>
        </Surface>
        <Surface className="p-6">
          <p className="text-sm text-muted-foreground">Hotéis em revisão</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">{pendingHotels}</p>
        </Surface>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/partners/pending">
          <Surface interactive className="flex h-full items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Parceiros pendentes</p>
              <p className="text-sm text-muted-foreground">{pendingPartners} aguardando</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Surface>
        </Link>
        <Link href="/hotels/pending">
          <Surface interactive className="flex h-full items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Hotéis em revisão</p>
              <p className="text-sm text-muted-foreground">{pendingHotels} aguardando</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Surface>
        </Link>
      </div>

      <Alert variant="info" className="mt-8">
        <span className="inline-flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Aprovações registram histórico de status para auditoria. Filas atualizam automaticamente.
        </span>
      </Alert>
    </PageShell>
  );
}
