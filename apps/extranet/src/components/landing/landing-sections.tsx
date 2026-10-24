import {
  BedDouble,
  CircleCheck,
  CreditCard,
  ListChecks,
  MessageSquareText,
  RefreshCw,
  Search,
  Star,
  Ticket,
} from "lucide-react";
import { HeroCta } from "@/components/landing/hero-cta";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Cadastre seu hotel",
    text: "Dados da empresa, endereço, comodidades e políticas em uma ficha guiada.",
  },
  {
    title: "Configure os quartos",
    text: "Tipos de quarto, capacidade e fotos, com uma capa para cada hotel.",
  },
  {
    title: "Envie para revisão",
    text: "A equipe Revoar confere e publica. Se algo faltar, você recebe o motivo.",
  },
];

const CHECKLIST = ["Dados do hotel", "Endereço e políticas", "Quartos", "Foto de capa"];

const LIVE = [
  {
    icon: ListChecks,
    title: "Cadastro guiado",
    text: "Um checklist mostra o que falta até o hotel ficar pronto para revisão.",
    className: "sm:col-span-2 lg:row-span-2",
    featured: true,
  },
  {
    icon: BedDouble,
    title: "Quartos e fotos",
    text: "Cada tipo de quarto com capacidade, comodidades e galeria própria.",
    className: "sm:col-span-2",
  },
  {
    icon: MessageSquareText,
    title: "Revisão com retorno",
    text: "Rejeição sempre vem com o motivo.",
    className: "",
  },
  {
    icon: RefreshCw,
    title: "Status sem recarregar",
    text: "Aprovação aparece no painel na hora.",
    className: "",
  },
];

const SOON = [
  { icon: Search, title: "Busca", text: "Hóspede encontra o hotel por destino e datas." },
  { icon: Ticket, title: "Reserva", text: "Escolha do quarto e confirmação online." },
  { icon: CreditCard, title: "Pagamento", text: "Pix e cartão dentro da Revoar." },
  { icon: Star, title: "Avaliação", text: "Nota e comentário depois da estadia." },
];

export function LandingSections() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Como funciona</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
          Três passos até o hotel no ar
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Surface interactive className="h-full p-6">
                <span className="text-5xl font-extrabold tracking-tight text-primary/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </Surface>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="capabilities-title" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A plataforma</p>
        <h2
          id="capabilities-title"
          className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl"
        >
          O que já funciona e o que vem
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIVE.map(({ icon: Icon, title, text, className, featured }) => (
            <article
              key={title}
              className={cn(
                "group flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift",
                featured
                  ? "justify-between border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border/80 bg-surface shadow-soft hover:border-primary/25",
                className,
              )}
            >
              <span
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                  featured ? "bg-primary-foreground/15" : "bg-primary-soft text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              {featured ? (
                <ul className="mt-6 space-y-2">
                  {CHECKLIST.map((item, index) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/20"
                    >
                      <CircleCheck
                        className={cn("size-4", index < 3 ? "opacity-100" : "opacity-40")}
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-6">
                <h3 className={cn("font-bold", featured ? "text-2xl sm:text-3xl" : "text-lg text-foreground")}>
                  {title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    featured ? "text-primary-foreground/85 sm:text-base" : "text-muted-foreground",
                  )}
                >
                  {text}
                </p>
              </div>
            </article>
          ))}

          {SOON.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex flex-col rounded-2xl border border-dashed border-border bg-surface/60 p-5"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                  Em breve
                </span>
              </div>
              <h3 className="mt-4 font-bold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:pb-24">
        <Surface className="flex flex-col items-start gap-6 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-balance text-foreground sm:text-3xl">
              Deixe o hotel pronto antes do hóspede chegar
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hotel, quartos e fotos no mesmo painel. A equipe Revoar revisa e publica.
            </p>
          </div>
          <HeroCta />
        </Surface>
      </section>
    </>
  );
}
