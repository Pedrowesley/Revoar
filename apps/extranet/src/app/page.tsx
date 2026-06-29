import Link from "next/link";
import { Building2, Hotel, LogIn, UserPlus } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">
          Área do parceiro
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Cadastre seus hotéis na Revoar
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Gerencie hotéis, quartos e fotos. Envie para revisão e comece a receber reservas.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Criar conta
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <LogIn className="h-4 w-4" />
            Já tenho conta
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: Building2,
            title: "Cadastre seu hotel",
            desc: "Endereço, descrição, políticas e contatos.",
          },
          {
            icon: Hotel,
            title: "Configure os quartos",
            desc: "Capacidade, camas, comodidades — tudo que o viajante precisa ver.",
          },
          {
            icon: UserPlus,
            title: "Envie para revisão",
            desc: "Nossa equipe aprova e seu hotel fica disponível na plataforma.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-border p-6">
            <Icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-1 font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
