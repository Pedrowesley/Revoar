"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelImageDetail } from "@/lib/image";
import { HotelStatus } from "@/lib/hotel.const";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { HotelDetailHeader } from "@/components/hotels/hotel-detail-header";
import { HotelDetailNav } from "@/components/hotels/hotel-detail-nav";
import { HotelSetupChecklist } from "@/components/hotels/hotel-setup-checklist";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

const EDITABLE_STATUSES: HotelStatus[] = ["DRAFT", "REJECTED"];

export default function HotelPhotosPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useRequireAuth();

  const { hotel, loading, error, reload } = useHotel(params.id);
  const [images, setImages] = useState<HotelImageDetail[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const readOnly = hotel ? !EDITABLE_STATUSES.includes(hotel.status) : true;
  const hasPrimary = images.some((image) => image.isPrimary);

  const loadImages = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setImagesLoading(true);
    try {
      const data = await apiFetch<HotelImageDetail[]>(
        `/extranet/hotels/${params.id}/images`,
        { token },
      );
      setImages(data);
    } finally {
      setImagesLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (hotel) loadImages();
  }, [hotel, loadImages]);

  async function handleRefresh() {
    await loadImages();
    await reload();
  }

  async function handleSubmitForReview() {
    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await apiFetch(`/extranet/hotels/${params.id}/submit`, { method: "POST", token });
      await reload();
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Não foi possível enviar para revisão.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <PageSkeleton rows={4} />;
  }

  if (error || !hotel) {
    return (
      <PageShell width="md" className="py-16 text-center">
        <p className="text-danger">{error ?? "Hotel não encontrado"}</p>
        <Link href="/hotels" className="mt-4 inline-block text-primary hover:underline">
          Voltar para meus hotéis
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell width="md">
      <HotelDetailHeader hotel={hotel} />
      <HotelDetailNav
        hotelId={hotel.id}
        activeTab="fotos"
        roomCount={hotel.roomCount}
        imageCount={hotel.imageCount}
      />
      <HotelSetupChecklist hotel={hotel} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Galeria de fotos</h2>
        <p className="text-sm text-muted-foreground">
          Envie fotos do hotel e defina uma como principal.
        </p>
      </div>

      {imagesLoading ? (
        <PageSkeleton rows={2} />
      ) : (
        <PhotoGallery
          hotelId={hotel.id}
          images={images}
          readOnly={readOnly}
          onChange={handleRefresh}
        />
      )}

      {!readOnly && hotel.status === "DRAFT" && (
        <Surface className="mt-8 border-primary/20 bg-primary-soft/40 p-5">
          <p className="text-sm font-semibold text-foreground">Enviar para revisão</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O hotel precisa ter endereço completo, ao menos 1 quarto, 1 foto e uma foto principal.
          </p>
          {submitError && (
            <Alert variant="danger" className="mt-3">
              {submitError}
            </Alert>
          )}
          <Button
            className="mt-4"
            onClick={handleSubmitForReview}
            disabled={
              submitting ||
              hotel.roomCount < 1 ||
              images.length === 0 ||
              !hasPrimary
            }
          >
            {submitting ? "Enviando..." : "Enviar para revisão"}
          </Button>
          {(hotel.roomCount < 1 || images.length === 0 || !hasPrimary) && (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {hotel.roomCount < 1 && <li>· Cadastre ao menos 1 quarto</li>}
              {images.length === 0 && <li>· Adicione ao menos 1 foto</li>}
              {images.length > 0 && !hasPrimary && <li>· Defina uma foto principal</li>}
            </ul>
          )}
        </Surface>
      )}
    </PageShell>
  );
}
