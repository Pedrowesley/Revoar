import { Luggage } from "lucide-react";
import { HeroCta } from "@/components/landing/hero-cta";

export function LandingHero() {
  return (
    <section className="mx-auto max-w-6xl animate-fade-up px-4 pt-12 pb-10 sm:pt-20 sm:pb-14">
      <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
        Para hotéis e pousadas
      </p>

      <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
        Publique seu hotel.{" "}
        <span className="text-primary sm:block">O hóspede vai reservar aqui.</span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
        Cadastre o hotel, os quartos e as fotos. A equipe Revoar revisa e publica. Busca, reserva e
        pagamento para o hóspede chegam na sequência.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <HeroCta />
        <button
          type="button"
          disabled
          className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 text-base font-semibold text-muted-foreground sm:w-auto"
        >
          <Luggage className="size-5" aria-hidden />
          Área do hóspede
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
            Em breve
          </span>
        </button>
      </div>

      <p className="mt-5 text-sm font-medium text-muted-foreground">
        Cadastro, revisão da equipe Revoar e hotel no ar.
      </p>
    </section>
  );
}
