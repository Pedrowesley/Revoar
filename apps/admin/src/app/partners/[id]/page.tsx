"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCnpj, formatPhone, getToken } from "@/lib/auth";
import { adminKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

type PartnerSheet = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  legalName: string;
  cnpj: string;
  tradeName: string | null;
  logoUrl: string | null;
  phone: string;
  contactName: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  detailsConfirmedAt: string | null;
};

function confirmationLabel(value: string | null) {
  if (!value) return "Ainda não confirmou";
  return `Confirmou em ${new Date(value).toLocaleString("pt-BR")}`;
}

export default function PartnerSheetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useRequireAuth();
  const queryClient = useQueryClient();

  const sheetQuery = useQuery({
    queryKey: adminKeys.partner(params.id),
    enabled: Boolean(token),
    queryFn: () => apiFetch<PartnerSheet>(`/admin/partners/${params.id}`, { token: getToken()! }),
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/partners/${params.id}/approve`, { method: "PATCH", token: getToken()! }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.partner(params.id) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.pendingPartners });
      router.refresh();
    },
  });

  if (!token || sheetQuery.isLoading) return <PageSkeleton rows={4} />;

  if (sheetQuery.error instanceof ApiError && sheetQuery.error.status === 401) return null;

  if (!sheetQuery.data) {
    return (
      <PageShell>
        <Alert variant="danger">Parceiro não encontrado.</Alert>
      </PageShell>
    );
  }

  const sheet = sheetQuery.data;

  return (
    <PageShell>
      <Link href="/partners/pending" className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar à fila
      </Link>
      <Surface className="space-y-3 p-5">
        {sheet.avatarUrl ? (
          <img src={sheet.avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
        ) : null}
        {sheet.logoUrl ? <img src={sheet.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover" /> : null}
        <p className="text-lg font-semibold">{sheet.name}</p>
        <p>{sheet.email}</p>
        <p>{sheet.legalName}</p>
        <p>CNPJ: {formatCnpj(sheet.cnpj)}</p>
        <p>Nome fantasia: {sheet.tradeName ?? "—"}</p>
        <p>Telefone: {formatPhone(sheet.phone)}</p>
        <p>Responsável: {sheet.contactName}</p>
        <p>Status: {sheet.status}</p>
        <p>{confirmationLabel(sheet.detailsConfirmedAt)}</p>
        {sheet.status === "PENDING" && (
          <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
            <Check className="mr-2 h-4 w-4" />
            Aprovar
          </Button>
        )}
      </Surface>
    </PageShell>
  );
}
