"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { CreateHotelInput } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelDetail } from "@/lib/hotel";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { HotelForm } from "@/components/hotels/hotel-form";

export default function NewHotelPage() {
  const router = useRouter();
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
      router.push(`/hotels/${hotel.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Não foi possível criar o hotel.");
      }
    }
  }

  if (!token) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/hotels"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para meus hotéis
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Cadastrar hotel</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="rounded-xl border border-border p-6">
        <HotelForm submitLabel="Criar hotel" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
