"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { adminKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

type PartnerRow = {
  id: string;
  legalName: string;
  tradeName: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  detailsConfirmed: boolean;
  hotelCount: number;
};

const STATUS_LABELS: Record<PartnerRow["status"], string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
};

export default function PartnersPage() {
  const token = useRequireAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");

  const partnersQuery = useQuery({
    queryKey: [...adminKeys.pendingPartners, "all", status],
    enabled: Boolean(token),
    queryFn: () =>
      apiFetch<PartnerRow[]>(`/admin/partners${status ? `?status=${status}` : ""}`, {
        token: getToken()!,
      }),
  });

  const moderate = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "suspend" }) =>
      apiFetch(`/admin/partners/${id}/${action}`, { method: "PATCH", token: getToken()! }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.pendingPartners });
    },
  });

  if (!token || partnersQuery.isLoading) return <PageSkeleton rows={3} />;

  const partners = partnersQuery.data ?? [];
  const error =
    partnersQuery.error instanceof ApiError
      ? partnersQuery.error.message
      : moderate.error instanceof ApiError
        ? moderate.error.message
        : null;

  return (
    <PageShell>
      <PageHeader
        title="Parceiros"
        description="Todas as contas. A fila de pendentes continua em separado."
        actions={
          <Link href="/partners/pending" className="text-sm font-medium text-primary">
            Fila de pendentes
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
          <option value="PENDING">Pendente</option>
          <option value="ACTIVE">Ativo</option>
          <option value="SUSPENDED">Suspenso</option>
        </select>
      </label>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {partners.length === 0 && (
        <EmptyState icon={Users} title="Nenhum parceiro" description="O filtro não encontrou contas." />
      )}
      <ul className="space-y-3">
        {partners.map((partner) => (
          <Surface as="li" key={partner.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/partners/${partner.id}`} className="font-semibold hover:text-primary">
                {partner.legalName}
              </Link>
              <p className="text-sm text-muted-foreground">
                {STATUS_LABELS[partner.status]} · {partner.detailsConfirmed ? "Confirmou" : "Não confirmou"} ·{" "}
                {partner.hotelCount} hotel(is)
              </p>
            </div>
            {partner.status === "PENDING" && (
              <Button onClick={() => moderate.mutate({ id: partner.id, action: "approve" })}>Aprovar</Button>
            )}
            {partner.status === "ACTIVE" && (
              <Button variant="outline" onClick={() => moderate.mutate({ id: partner.id, action: "suspend" })}>
                Suspender
              </Button>
            )}
          </Surface>
        ))}
      </ul>
    </PageShell>
  );
}
