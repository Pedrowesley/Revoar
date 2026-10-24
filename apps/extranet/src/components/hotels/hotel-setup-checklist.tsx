import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { HotelDetail } from "@/lib/hotel";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

type HotelSetupChecklistProps = {
  hotel: HotelDetail;
};

export function HotelSetupChecklist({ hotel }: HotelSetupChecklistProps) {
  if (hotel.status !== "DRAFT" && hotel.status !== "REJECTED") return null;

  const steps = [
    {
      label: "Dados do hotel",
      done: Boolean(hotel.addressLine && hotel.city && hotel.state),
      href: `/hotels/${hotel.id}`,
    },
    {
      label: "Pelo menos 1 quarto",
      done: hotel.roomCount > 0,
      href: `/hotels/${hotel.id}/rooms`,
    },
    {
      label: "Fotos + capa",
      done: hotel.imageCount > 0 && hotel.hasPrimaryImage,
      href: `/hotels/${hotel.id}/photos`,
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const ready = completed === steps.length;
  const missingCover = hotel.imageCount > 0 && !hotel.hasPrimaryImage;

  return (
    <Surface className="mb-8 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Progresso do cadastro</p>
          <p className="text-xs text-muted-foreground">
            {ready
              ? "Tudo pronto — envie para revisão na aba Fotos."
              : missingCover
                ? "Defina uma foto principal para concluir o cadastro."
                : `${completed} de ${steps.length} etapas concluídas`}
          </p>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                step.done ? "text-success" : "text-muted-foreground",
              )}
            >
              {step.done ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </Surface>
  );
}
