"use client";

import { useState } from "react";
import { BedDouble, CalendarDays, CreditCard, MapPin, QrCode, Search, Star, Users } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "buscar", label: "Buscar", icon: Search },
  { id: "reservar", label: "Reservar", icon: BedDouble },
  { id: "pagar", label: "Pagar", icon: CreditCard },
  { id: "avaliar", label: "Avaliar", icon: Star },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Bar({ className }: { className?: string }) {
  return <div className={cn("h-2.5 rounded-full bg-muted", className)} />;
}

function SearchPanel() {
  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Busca por destino e datas</h3>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          { icon: MapPin, label: "Destino" },
          { icon: CalendarDays, label: "Datas" },
          { icon: Users, label: "Hóspedes" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 rounded-xl border border-border px-3 py-3">
            <Icon className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {[0, 1, 2].map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-xl border border-border/80 p-3 transition-colors hover:border-primary/30 hover:bg-primary-soft"
          >
            <div className="size-12 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <Bar className="w-2/3" />
              <Bar className="w-1/3" />
            </div>
            <span className="text-sm font-semibold text-primary">Ver quartos</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function BookPanel() {
  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Escolha do quarto</h3>
      <div className="mt-4 space-y-2">
        {["Quarto duplo", "Suíte com varanda"].map((room, index) => (
          <div
            key={room}
            className={cn(
              "flex items-center justify-between rounded-xl border p-4",
              index === 0 ? "border-primary bg-primary-soft" : "border-border",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "size-4 rounded-full border-2",
                  index === 0 ? "border-primary bg-primary" : "border-border",
                )}
              />
              <span className="text-sm font-semibold text-foreground">{room}</span>
            </div>
            <Bar className="w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-muted p-4">
        <p className="text-sm font-semibold text-foreground">Resumo da estadia</p>
        <div className="mt-3 space-y-2">
          <Bar className="w-1/2 bg-surface" />
          <Bar className="w-1/3 bg-surface" />
        </div>
      </div>
    </>
  );
}

function PayPanel() {
  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Pagamento na Revoar</h3>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          { icon: QrCode, label: "Pix" },
          { icon: CreditCard, label: "Cartão" },
        ].map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4",
              index === 0 ? "border-primary bg-primary-soft" : "border-border",
            )}
          >
            <Icon className="size-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-4">
        <span className="text-sm font-medium text-muted-foreground">Confirmação da reserva</span>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Na hora
        </span>
      </div>
    </>
  );
}

function ReviewPanel() {
  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Avaliação depois da estadia</h3>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2, 3, 4].map((star) => (
          <Star key={star} className="size-7 fill-primary text-primary" aria-hidden />
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border p-4">
        <p className="text-sm font-medium text-muted-foreground">Conte como foi a estadia</p>
        <div className="mt-3 space-y-2">
          <Bar className="w-full" />
          <Bar className="w-5/6" />
          <Bar className="w-2/3" />
        </div>
      </div>
    </>
  );
}

const PANELS: Record<TabId, () => React.JSX.Element> = {
  buscar: SearchPanel,
  reservar: BookPanel,
  pagar: PayPanel,
  avaliar: ReviewPanel,
};

export function GuestPreview() {
  const [active, setActive] = useState<TabId>("buscar");
  const Panel = PANELS[active];

  const move = (step: number) => {
    const index = TABS.findIndex((tab) => tab.id === active);
    const next = TABS[(index + step + TABS.length) % TABS.length];
    setActive(next.id);
    document.getElementById(`guest-tab-${next.id}`)?.focus();
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-5 lg:items-center">
      <div className="lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Para o hóspede</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
          Veja o que o hóspede vai encontrar
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          O hotel publicado hoje entra na vitrine da Revoar. Toque nas abas e veja busca, reserva,
          pagamento e avaliação.
        </p>
      </div>

      <Surface className="overflow-hidden lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="ml-2 text-sm font-semibold text-foreground">Revoar para hóspedes</span>
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
            Em breve
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Prévia do app do hóspede"
          className="grid grid-cols-4 gap-1 border-b border-border/80 bg-muted/60 p-1.5"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") move(1);
            if (event.key === "ArrowLeft") move(-1);
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = id === active;
            return (
              <button
                key={id}
                id={`guest-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="guest-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all sm:flex-row sm:justify-center sm:text-sm",
                  selected
                    ? "bg-surface text-primary shadow-soft"
                    : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div
          key={active}
          id="guest-panel"
          role="tabpanel"
          aria-labelledby={`guest-tab-${active}`}
          className="animate-fade-up p-4 sm:p-6"
        >
          <Panel />
        </div>
      </Surface>
    </section>
  );
}
