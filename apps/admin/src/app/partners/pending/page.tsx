"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Users } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCnpj, getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

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
  useRequireAuth();
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadPartners = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<PendingPartner[]>("/admin/partners/pending", { token });
      setPartners(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  async function handleApprove(partnerId: string) {
    const token = getToken();
    if (!token) return;

    setApprovingId(partnerId);
    try {
      await apiFetch(`/admin/partners/${partnerId}/approve`, { method: "PATCH", token });
      await loadPartners();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) return <PageSkeleton rows={3} />;

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
        description="Analise e aprove contas de parceiros hoteleiros."
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
                onClick={() => handleApprove(partner.id)}
                disabled={approvingId === partner.id}
              >
                <Check className="mr-2 h-4 w-4" />
                {approvingId === partner.id ? "Aprovando..." : "Aprovar"}
              </Button>
            </div>
          </Surface>
        ))}
      </ul>
    </PageShell>
  );
}
