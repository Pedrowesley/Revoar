"use client";

import { useState } from "react";
import { Sheet } from "@/components/sheet";
import { mediaUrl, StayPhoto } from "@/lib/media";

export function PhotoCover({ photos, title, emptyLabel }: { photos: StayPhoto[]; title: string; emptyLabel: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center bg-muted px-4 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  const current = photos[index] ?? photos[0];

  return (
    <>
      <button type="button" onClick={() => { setIndex(0); setOpen(true); }} className="block w-full min-w-0 text-left">
        <img src={mediaUrl(photos[0].url)} alt={photos[0].altText || title} className="aspect-[16/10] w-full object-cover" />
        {photos.length > 1 && <span className="block px-4 py-2 text-sm font-semibold text-primary">Ver {photos.length} fotos</span>}
      </button>
      <Sheet open={open} title={title} onClose={() => setOpen(false)}>
        <img src={mediaUrl(current.url)} alt={current.altText || title} className="aspect-[16/10] w-full rounded-xl object-cover" />
        {photos.length > 1 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)} className="h-12 rounded-xl border border-border text-sm font-semibold disabled:opacity-40">
              Anterior
            </button>
            <button type="button" disabled={index === photos.length - 1} onClick={() => setIndex((value) => value + 1)} className="h-12 rounded-xl border border-border text-sm font-semibold disabled:opacity-40">
              Próxima
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
