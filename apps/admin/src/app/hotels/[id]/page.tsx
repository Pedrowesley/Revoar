"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { ROOM_AMENITY_LABELS, RoomAmenity } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCnpj, getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

type HotelPreview = {
  id: string;
  name: string;
  description: string;
  starRating: number | null;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  partner: {
    legalName: string;
    tradeName: string | null;
    cnpj: string;
    email: string;
    contactName: string;
  };
  roomTypes: {
    id: string;
    name: string;
    description: string;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;
    bedConfiguration: string;
    amenities: string[];
    sizeSqm: number | null;
  }[];
  images: { id: string; url: string; isPrimary: boolean; altText: string | null }[];
  statusHistory: {
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    actorType: string;
    createdAt: string;
  }[];
};

export default function AdminHotelPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useRequireAuth();

  const [hotel, setHotel] = useState<HotelPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadHotel = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<HotelPreview>(`/admin/hotels/${params.id}`, { token });
      setHotel(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadHotel();
  }, [loadHotel]);

  async function handleApprove() {
    const token = getToken();
    if (!token || !hotel) return;

    setActionLoading(true);
    try {
      await apiFetch(`/admin/hotels/${hotel.id}/approve`, { method: "PATCH", token });
      router.push("/hotels/pending");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      setActionLoading(false);
    }
  }

  async function handleReject() {
    const token = getToken();
    if (!token || !hotel || rejectReason.trim().length < 5) return;

    setActionLoading(true);
    try {
      await apiFetch(`/admin/hotels/${hotel.id}/reject`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      router.push("/hotels/pending");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      setActionLoading(false);
    }
  }

  if (loading) {
    return <PageSkeleton rows={5} />;
  }

  if (error || !hotel) {
    return (
      <PageShell className="py-16 text-center">
        <p className="text-danger">{error ?? "Hotel não encontrado"}</p>
      </PageShell>
    );
  }

  const statusLabels: Record<string, string> = {
    DRAFT: "Rascunho",
    IN_REVIEW: "Em análise",
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    REJECTED: "Rejeitado",
  };

  return (
    <PageShell>
      <Link
        href="/hotels/pending"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para fila
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{hotel.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {hotel.city}, {hotel.state} ·{" "}
            <span className="inline-flex rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
              {statusLabels[hotel.status] ?? hotel.status}
            </span>
          </p>
        </div>
        {hotel.status === "IN_REVIEW" && !showReject && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => setShowReject(true)} disabled={actionLoading}>
              <X className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              <Check className="mr-2 h-4 w-4" />
              {actionLoading ? "Processando..." : "Aprovar"}
            </Button>
          </div>
        )}
      </div>

      {showReject && (
        <Alert variant="danger" className="mb-6" title="Motivo da rejeição">
          <Label htmlFor="reason">Descreva o que o parceiro precisa corrigir</Label>
          <Textarea
            id="reason"
            className="mt-2 bg-surface"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Descreva o que o parceiro precisa corrigir..."
          />
          <div className="mt-3 flex gap-2">
            <Button variant="danger" onClick={handleReject} disabled={actionLoading || rejectReason.trim().length < 5}>
              Confirmar rejeição
            </Button>
            <Button variant="outline" onClick={() => setShowReject(false)}>
              Cancelar
            </Button>
          </div>
        </Alert>
      )}

      <Surface className="mb-8 p-5">
        <h2 className="mb-3 font-semibold">Parceiro</h2>
        <p>{hotel.partner.legalName}</p>
        <p className="text-sm text-muted-foreground">
          CNPJ: {formatCnpj(hotel.partner.cnpj)} · {hotel.partner.contactName} · {hotel.partner.email}
        </p>
      </Surface>

      <Surface className="mb-8 p-5">
        <h2 className="mb-3 font-semibold">Dados do hotel</h2>
        <p className="text-sm whitespace-pre-wrap">{hotel.description}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {hotel.addressLine} — {hotel.city}/{hotel.state} · CEP {hotel.zipCode}
        </p>
        <p className="text-sm text-muted-foreground">
          Tel: {hotel.phone} · Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}
          {hotel.starRating ? ` · ${hotel.starRating} estrelas` : ""}
        </p>
      </Surface>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Quartos ({hotel.roomTypes.length})</h2>
        <ul className="space-y-3">
          {hotel.roomTypes.map((room) => (
            <Surface as="li" key={room.id} className="p-4">
              <p className="font-medium">{room.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {room.maxAdults} adulto(s) · {room.maxChildren} criança(s) · {room.bedConfiguration}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {room.amenities.map((a) => (
                  <span key={a} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {ROOM_AMENITY_LABELS[a as RoomAmenity]}
                  </span>
                ))}
              </div>
            </Surface>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Fotos ({hotel.images.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {hotel.images.map((image) => (
            <Surface key={image.id} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.altText ?? hotel.name} className="aspect-video w-full object-cover" />
              {image.isPrimary && (
                <p className="p-2 text-xs font-medium text-primary">Foto principal</p>
              )}
            </Surface>
          ))}
        </div>
      </section>

      {hotel.statusHistory.length > 0 && (
        <Surface className="p-5">
          <h2 className="mb-3 font-semibold">Histórico de status</h2>
          <ul className="space-y-2 text-sm">
            {hotel.statusHistory.map((entry, index) => (
              <li key={index} className="text-muted-foreground">
                {entry.fromStatus ?? "—"} → {entry.toStatus} ({entry.actorType}){" "}
                {entry.reason ? `— ${entry.reason}` : ""}
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </PageShell>
  );
}
