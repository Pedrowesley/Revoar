import { SearchForm } from "@/components/search-form";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Hotel e pousada</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
        Escolha o quarto e feche a reserva.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        O preço da lista é o total da estadia. Reserva imediata confirma no pagamento. Sob consulta, você só paga se o hotel aceitar.
      </p>
      <div className="mt-8">
        <SearchForm />
      </div>
    </section>
  );
}
