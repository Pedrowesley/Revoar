"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCnpj, getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar ao painel
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Parceiros pendentes</h1>

      {loading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && partners.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">Nenhum parceiro pendente</p>
        </div>
      )}

      <ul className="space-y-4">
        {partners.map((partner) => (
          <li key={partner.id} className="rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4">
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
          </li>
        ))}
      </ul>
    </div>
  );
}
