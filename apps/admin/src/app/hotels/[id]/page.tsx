"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { ROOM_AMENITY_LABELS, RoomAmenity } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { formatCnpj, getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-red-600">{error ?? "Hotel não encontrado"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/hotels/pending"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para fila
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <p className="text-muted-foreground">
            {hotel.city}, {hotel.state} · Status: {hotel.status}
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
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <Label htmlFor="reason">Motivo da rejeição</Label>
          <Textarea
            id="reason"
            className="mt-2 bg-white"
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
        </div>
      )}

      <section className="mb-8 rounded-xl border border-border p-5">
        <h2 className="mb-3 font-semibold">Parceiro</h2>
        <p>{hotel.partner.legalName}</p>
        <p className="text-sm text-muted-foreground">
          CNPJ: {formatCnpj(hotel.partner.cnpj)} · {hotel.partner.contactName} · {hotel.partner.email}
        </p>
      </section>

      <section className="mb-8 rounded-xl border border-border p-5">
        <h2 className="mb-3 font-semibold">Dados do hotel</h2>
        <p className="text-sm whitespace-pre-wrap">{hotel.description}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {hotel.addressLine} — {hotel.city}/{hotel.state} · CEP {hotel.zipCode}
        </p>
        <p className="text-sm text-muted-foreground">
          Tel: {hotel.phone} · Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}
          {hotel.starRating ? ` · ${hotel.starRating} estrelas` : ""}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Quartos ({hotel.roomTypes.length})</h2>
        <ul className="space-y-3">
          {hotel.roomTypes.map((room) => (
            <li key={room.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{room.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {room.maxAdults} adulto(s) · {room.maxChildren} criança(s) · {room.bedConfiguration}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {room.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {ROOM_AMENITY_LABELS[a as RoomAmenity]}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Fotos ({hotel.images.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {hotel.images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.altText ?? hotel.name} className="aspect-video w-full object-cover" />
              {image.isPrimary && (
                <p className="p-2 text-xs font-medium text-primary">Foto principal</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {hotel.statusHistory.length > 0 && (
        <section className="rounded-xl border border-border p-5">
          <h2 className="mb-3 font-semibold">Histórico de status</h2>
          <ul className="space-y-2 text-sm">
            {hotel.statusHistory.map((entry, index) => (
              <li key={index} className="text-muted-foreground">
                {entry.fromStatus ?? "—"} → {entry.toStatus} ({entry.actorType}){" "}
                {entry.reason ? `— ${entry.reason}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
