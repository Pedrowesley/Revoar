"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, LogOut, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Button } from "@/components/ui/button";

type PendingPartner = { id: string; legalName: string };
type PendingHotel = { id: string; name: string };

export default function AdminDashboardPage() {
  const router = useRouter();
  const token = useRequireAuth();
  const [pendingPartners, setPendingPartners] = useState(0);
  const [pendingHotels, setPendingHotels] = useState(0);

  useEffect(() => {
    const authToken = getToken();
    if (!authToken) return;

    Promise.all([
      apiFetch<PendingPartner[]>("/admin/partners/pending", { token: authToken }),
      apiFetch<PendingHotel[]>("/admin/hotels/pending", { token: authToken }),
    ]).then(([partners, hotels]) => {
      setPendingPartners(partners.length);
      setPendingHotels(hotels.length);
    });
  }, [token]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (!token) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">
            Moderação Revoar
          </p>
          <h1 className="text-3xl font-bold">Painel administrativo</h1>
          <p className="mt-2 text-muted-foreground">
            Aprove parceiros e hotéis cadastrados pela extranet.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Parceiros pendentes</p>
          <p className="mt-1 text-3xl font-bold">{pendingPartners}</p>
        </div>
        <div className="rounded-xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Hotéis em revisão</p>
          <p className="mt-1 text-3xl font-bold">{pendingHotels}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/partners/pending"
          className="flex items-center gap-3 rounded-xl border border-border p-5 hover:bg-muted"
        >
          <Users className="h-6 w-6 text-primary" />
          <div>
            <p className="font-medium">Parceiros pendentes</p>
            <p className="text-sm text-muted-foreground">{pendingPartners} aguardando</p>
          </div>
        </Link>
        <Link
          href="/hotels/pending"
          className="flex items-center gap-3 rounded-xl border border-border p-5 hover:bg-muted"
        >
          <Clock className="h-6 w-6 text-primary" />
          <div>
            <p className="font-medium">Hotéis em revisão</p>
            <p className="text-sm text-muted-foreground">{pendingHotels} aguardando</p>
          </div>
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-md bg-muted p-4 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4" />
        Aprovações registram histórico de status para auditoria.
      </div>
    </div>
  );
}
