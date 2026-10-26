import { Luggage } from "lucide-react";
import { HeroCollage } from "@/components/landing/hero-collage";
import { HeroCta } from "@/components/landing/hero-cta";

export function LandingHero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 pb-10 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-16">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary motion-safe:animate-rise motion-reduce:animate-none">
          Para quem vai viajar
        </p>

        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance text-foreground motion-safe:animate-rise-2 motion-reduce:animate-none sm:text-6xl">
          Encontre um lugar para ficar e <span className="text-primary sm:block">reserve.</span>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground motion-safe:animate-rise-3 motion-reduce:animate-none">
          Busque o destino, veja os quartos e o preço, e confirme a reserva.
        </p>

        <div className="mt-8 border-t border-border pt-5 motion-safe:animate-rise-4 motion-reduce:animate-none">
          <p className="text-sm font-semibold text-foreground">Tem um hotel ou pousada? Publique na Revoar.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <HeroCta />
            <a
              href={process.env.NEXT_PUBLIC_GUEST_URL ?? "http://127.0.0.1:3003"}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-base font-semibold text-foreground sm:w-auto"
            >
              <Luggage className="size-5" aria-hidden />
              Área do hóspede
            </a>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-muted-foreground motion-safe:animate-rise-5 motion-reduce:animate-none">
          Cadastro, revisão da equipe Revoar e hotel no ar.
        </p>
      </div>

      <HeroCollage />
    </section>
  );
}
