import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type HotelDetailNavProps = {
  hotelId: string;
  activeTab: "dados" | "quartos" | "fotos";
  roomCount: number;
  imageCount: number;
};

export function HotelDetailNav({ hotelId, activeTab, roomCount, imageCount }: HotelDetailNavProps) {
  const tabs = [
    {
      id: "dados" as const,
      href: `/hotels/${hotelId}`,
      label: "Dados",
      hint: "Informações do hotel",
      done: true,
    },
    {
      id: "quartos" as const,
      href: `/hotels/${hotelId}/rooms`,
      label: "Quartos",
      hint: roomCount > 0 ? `${roomCount} cadastrado(s)` : "Cadastre ao menos 1",
      done: roomCount > 0,
      count: roomCount,
    },
    {
      id: "fotos" as const,
      href: `/hotels/${hotelId}/photos`,
      label: "Fotos",
      hint: imageCount > 0 ? `${imageCount} enviada(s)` : "Envie fotos e a capa",
      done: imageCount > 0,
      count: imageCount,
    },
  ];

  return (
    <nav className="mb-8 grid gap-2 sm:grid-cols-3">
      {tabs.map((tab, index) => {
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "group relative rounded-xl border px-4 py-3 transition-all",
              active
                ? "border-primary/40 bg-primary-soft shadow-soft"
                : "border-border/80 bg-surface hover:border-primary/25 hover:shadow-soft",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    active
                      ? "bg-primary text-primary-foreground"
                      : tab.done
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.done && !active ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                  {tab.label}
                  {typeof tab.count === "number" ? ` (${tab.count})` : ""}
                </span>
              </span>
            </div>
            <p className="mt-1.5 pl-8 text-xs text-muted-foreground">{tab.hint}</p>
          </Link>
        );
      })}
    </nav>
  );
}
