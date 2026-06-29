"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Hotel, LogOut, Clock } from "lucide-react";
import { apiFetch, PartnerProfile } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const STATUS_LABELS = {
  PENDING: { label: "Aguardando aprovação", color: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Conta ativa", color: "bg-green-100 text-green-800" },
  SUSPENDED: { label: "Conta suspensa", color: "bg-red-100 text-red-800" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch<PartnerProfile>("/extranet/auth/me", { token })
      .then(setProfile)
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const status = STATUS_LABELS[profile.partner.status];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Olá, {profile.name}</h1>
          <p className="text-muted-foreground">{profile.partner.legalName}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
        {profile.partner.status === "PENDING" && <Clock className="h-4 w-4" />}
        {status.label}
      </div>

      {profile.partner.status === "PENDING" && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Sua conta está em análise pela equipe Revoar. Você já pode preparar o cadastro do hotel,
          mas só poderá enviar para revisão após aprovação.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/hotels"
          className="flex items-center gap-3 rounded-xl border border-border p-5 hover:bg-muted"
        >
          <Hotel className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">Meus hotéis</p>
            <p className="text-sm text-muted-foreground">Cadastrar e gerenciar propriedades</p>
          </div>
        </Link>
      </div>

      <div className="mt-8 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Dados da empresa</p>
        <p>CNPJ: {profile.partner.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</p>
        <p>Responsável: {profile.partner.contactName}</p>
        <p>E-mail: {profile.partner.email}</p>
      </div>
    </div>
  );
}
