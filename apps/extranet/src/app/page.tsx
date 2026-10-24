import Link from "next/link";
import { Building2, Hotel, LogIn, Send, UserPlus } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Surface } from "@/components/ui/surface";

const STEPS = [
  {
    icon: Building2,
    title: "Cadastre seu hotel",
    desc: "Endereço, descrição, políticas e contatos.",
  },
  {
    icon: Hotel,
    title: "Configure os quartos",
    desc: "Capacidade, camas e comodidades para o viajante.",
  },
  {
    icon: Send,
    title: "Envie para revisão",
    desc: "Nossa equipe aprova e o hotel entra na plataforma.",
  },
];

export default function HomePage() {
  return (
    <PageShell width="xl" className="py-14 sm:py-20">
      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Área do parceiro
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Revoar
          <span className="mt-2 block text-2xl font-semibold text-muted-foreground sm:text-3xl">
            Cadastre seus hotéis com clareza
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground sm:text-lg">
          Gerencie hotéis, quartos e fotos. Envie para revisão e comece a receber reservas.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Criar conta
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium shadow-soft transition hover:bg-muted"
          >
            <LogIn className="h-4 w-4" />
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, desc }, index) => (
          <Surface key={title} className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Passo {index + 1}
              </span>
            </div>
            <h3 className="mb-1.5 text-base font-semibold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </Surface>
        ))}
      </section>
    </PageShell>
  );
}
