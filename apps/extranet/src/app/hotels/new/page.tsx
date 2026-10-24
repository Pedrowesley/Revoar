"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { CreateHotelInput } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelDetail } from "@/lib/hotel";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { HotelForm } from "@/components/hotels/hotel-form";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toaster";

export default function NewHotelPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useRequireAuth();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: CreateHotelInput) {
    if (!token) return;
    setError(null);

    try {
      const hotel = await apiFetch<HotelDetail>("/extranet/hotels", {
        method: "POST",
        token,
        body: JSON.stringify(data),
      });
      await queryClient.invalidateQueries({ queryKey: ["extranet", "hotels"] });
      toast.success(
        "Hotel criado como rascunho",
        "Cadastre um quarto e uma foto principal para enviar à revisão.",
      );
      router.push(`/hotels/${hotel.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Não foi possível criar o hotel.";
      setError(message);
      toast.error("Não foi possível criar o hotel", message);
    }
  }

  if (!token) return <PageSkeleton rows={4} />;

  return (
    <PageShell width="md">
      <Link
        href="/hotels"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para meus hotéis
      </Link>

      <PageHeader
        title="Cadastrar hotel"
        description="Preencha os dados principais. Depois você adiciona quartos e fotos."
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Surface className="p-6">
        <HotelForm submitLabel="Criar hotel" onSubmit={handleSubmit} />
      </Surface>
    </PageShell>
  );
}
