"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Users } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCnpj, getToken } from "@/lib/auth";
import { adminKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { LastUpdated } from "@/components/last-updated";

type PendingPartner = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  email: string;
  phone: string;
  contactName: string;
  hotelCount: number;
  createdAt: string;
};

export default function PendingPartnersPage() {
  const token = useRequireAuth();
  const queryClient = useQueryClient();

  const partnersQuery = useQuery({
    queryKey: adminKeys.pendingPartners,
    enabled: Boolean(token),
    refetchInterval: 15_000,
    queryFn: () =>
      apiFetch<PendingPartner[]>("/admin/partners/pending", { token: getToken()! }),
  });

  const approveMutation = useMutation({
    mutationFn: (partnerId: string) =>
      apiFetch(`/admin/partners/${partnerId}/approve`, {
        method: "PATCH",
        token: getToken()!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.pendingPartners });
      await queryClient.invalidateQueries({ queryKey: adminKeys.pendingHotels });
      await queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });

  if (!token || partnersQuery.isLoading) return <PageSkeleton rows={3} />;

  const partners = partnersQuery.data ?? [];
  const error =
    partnersQuery.error instanceof ApiError
      ? partnersQuery.error.message
      : approveMutation.error instanceof ApiError
        ? approveMutation.error.message
        : partnersQuery.isError
          ? "Não foi possível carregar os parceiros."
          : approveMutation.isError
            ? "Não foi possível aprovar o parceiro."
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
        title="Parceiros pendentes"
        description="Analise e aprove contas de parceiros hoteleiros. A lista atualiza sozinha."
        actions={<LastUpdated updatedAt={partnersQuery.dataUpdatedAt} />}
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {partners.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum parceiro pendente"
          description="Quando houver novos cadastros, eles aparecerão aqui."
        />
      )}

      <ul className="space-y-4">
        {partners.map((partner) => (
          <Surface as="li" key={partner.id} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{partner.legalName}</p>
                {partner.tradeName && (
                  <p className="text-sm text-muted-foreground">{partner.tradeName}</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  CNPJ: {formatCnpj(partner.cnpj)} · {partner.contactName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {partner.email} · {partner.hotelCount} hotel(is) cadastrado(s)
                </p>
              </div>
              <Button
                onClick={() => approveMutation.mutate(partner.id)}
                disabled={approveMutation.isPending && approveMutation.variables === partner.id}
              >
                <Check className="mr-2 h-4 w-4" />
                {approveMutation.isPending && approveMutation.variables === partner.id
                  ? "Aprovando..."
                  : "Aprovar"}
              </Button>
            </div>
          </Surface>
        ))}
      </ul>
    </PageShell>
  );
}
