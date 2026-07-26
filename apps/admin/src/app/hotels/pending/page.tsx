"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

type PendingHotel = {
  id: string;
  name: string;
  city: string;
  state: string;
  partner: { legalName: string; tradeName: string | null };
  roomCount: number;
  imageCount: number;
  updatedAt: string;
};

export default function PendingHotelsPage() {
  useRequireAuth();
  const [hotels, setHotels] = useState<PendingHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHotels = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<PendingHotel[]>("/admin/hotels/pending", { token });
      setHotels(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

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
        title="Hotéis em revisão"
        description="Revise o inventário enviado pelos parceiros antes de publicar."
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {hotels.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Nenhum hotel em revisão"
          description="A fila está vazia no momento."
        />
      )}

      <ul className="space-y-3">
        {hotels.map((hotel) => (
          <li key={hotel.id}>
            <Link href={`/hotels/${hotel.id}`}>
              <Surface interactive className="block p-5">
                <p className="font-semibold">{hotel.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hotel.city}, {hotel.state} · {hotel.partner.legalName}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {hotel.roomCount} quarto(s) · {hotel.imageCount} foto(s)
                </p>
              </Surface>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
