"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Hotel } from "lucide-react";
import { apiFetch, ApiError, PartnerProfile } from "@/lib/api";
import { expireSession, getToken } from "@/lib/auth";
import { extranetKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { LastUpdated } from "@/components/last-updated";

const STATUS_LABELS = {
  PENDING: { label: "Aguardando aprovação", color: "bg-warning-soft text-warning" },
  ACTIVE: { label: "Conta ativa", color: "bg-success-soft text-success" },
  SUSPENDED: { label: "Conta suspensa", color: "bg-danger-soft text-danger" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const authToken = getToken();
    if (!authToken) {
      router.replace("/login");
      return;
    }
    setToken(authToken);
  }, [router]);

  const profileQuery = useQuery({
    queryKey: extranetKeys.me,
    enabled: Boolean(token),
    refetchInterval: (query) =>
      query.state.data?.partner.status === "PENDING" ? 30_000 : false,
    queryFn: () => apiFetch<PartnerProfile>("/extranet/auth/me", { token: getToken()! }),
    retry: false,
  });

  useEffect(() => {
    if (!token || profileQuery.isFetching || !profileQuery.isError) return;
    const unauthorized =
      profileQuery.error instanceof ApiError && profileQuery.error.status === 401;
    if (!unauthorized) return;
    expireSession();
  }, [token, profileQuery.isError, profileQuery.isFetching, profileQuery.error]);

  if (!token || profileQuery.isLoading || (profileQuery.isFetching && !profileQuery.data)) {
    return <PageSkeleton rows={2} />;
  }

  if (
    profileQuery.error instanceof ApiError &&
    profileQuery.error.status === 401
  ) {
    return null;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageShell>
        <Alert variant="danger" title="Não foi possível carregar o painel">
          Tente de novo em instantes. A sessão só encerra quando o acesso é recusado.
        </Alert>
      </PageShell>
    );
  }

  const profile = profileQuery.data;
  const status = STATUS_LABELS[profile.partner.status];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Painel do parceiro"
        title={`Olá, ${profile.name}`}
        description={profile.partner.legalName}
        actions={<LastUpdated updatedAt={profileQuery.dataUpdatedAt} />}
      />

      <div
        className={`mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
      >
        {profile.partner.status === "PENDING" && <Clock className="h-4 w-4" />}
        {status.label}
      </div>

      {profile.partner.status === "PENDING" && (
        <Alert variant="warning" className="mb-8">
          Sua conta está em análise pela equipe Revoar. Você já pode preparar o cadastro do hotel,
          mas só poderá enviar para revisão após aprovação. Este status atualiza automaticamente.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/hotels">
          <Surface interactive className="flex h-full items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Hotel className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Meus hotéis</p>
              <p className="text-sm text-muted-foreground">Cadastrar e gerenciar propriedades</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Surface>
        </Link>
      </div>

      <Link href="/profile" aria-label="Dados da empresa" className="mt-8 block">
      <Surface className="p-5 text-sm">
        <p className="mb-3 font-semibold text-foreground">Dados da empresa</p>
        <dl className="grid gap-2 text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide">CNPJ</dt>
            <dd className="text-foreground">
              {profile.partner.cnpj.replace(
                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                "$1.$2.$3/$4-$5",
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide">Responsável</dt>
            <dd className="text-foreground">{profile.partner.contactName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide">E-mail</dt>
            <dd className="text-foreground">{profile.partner.email}</dd>
          </div>
        </dl>
      </Surface>
      </Link>
    </PageShell>
  );
}
