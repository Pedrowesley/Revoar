import { SearchForm } from "@/components/search-form";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Hotel e pousada</p>
      <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
        Escolha o quarto e feche a reserva.
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground">
        O preço da lista é o total da estadia. Reserva imediata confirma no pagamento. Sob consulta, você só paga se o hotel aceitar.
      </p>
      <div className="mt-5">
        <SearchForm />
      </div>
    </section>
  );
}
