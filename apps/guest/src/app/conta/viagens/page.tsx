"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { brl, shortDate } from "@/lib/format";
import { readTrips } from "@/lib/trips";

const fieldClass = "mt-1 h-12 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base";

type Trip = {
  code: string;
  status: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalCents: number;
};

type TripLists = {
  upcoming: Trip[];
  past: Trip[];
  cancelled: Trip[];
};

const STATUS: Record<string, string> = {
  HELD: "Quarto reservado temporariamente",
  PAYMENT_PENDING: "Pagamento iniciado",
  REQUESTED: "Pedido enviado",
  AWAITING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmada",
  DECLINED: "Recusada",
  EXPIRED: "Prazo encerrado",
  CANCELLED: "Cancelada",
};

function TripGroup({ title, trips, email }: { title: string; trips: Trip[]; email: string }) {
  return (
    <section aria-label={title} className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      {trips.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhuma reserva aqui.</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {trips.map((trip) => (
            <li key={trip.code}>
              <Link href={`/reservas/${trip.code}?email=${encodeURIComponent(email)}`} className="block min-h-12 rounded-2xl border border-border bg-surface p-4">
                <span className="font-semibold">{trip.hotelName}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {trip.code} · {shortDate(trip.checkIn)} a {shortDate(trip.checkOut)}
                </span>
                <span className="mt-1 block text-sm">
                  {STATUS[trip.status] ?? trip.status} · {brl(trip.totalCents)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Trips() {
  const search = useSearchParams();
  const router = useRouter();
  const [lists, setLists] = useState<TripLists | null>(null);
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readTrips()[0];
    const nextEmail = search.get("email") || saved?.email || "";
    const code = search.get("code") || saved?.code || "";
    if (!nextEmail || !code) return;
    setEmail(nextEmail);
    apiFetch<TripLists>(`/guest/trips?email=${encodeURIComponent(nextEmail)}&code=${encodeURIComponent(code)}`)
      .then((data) => {
        setLists(data);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Não foi possível abrir as viagens"));
  }, [search]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      code: String(form.get("code") ?? "").trim().toUpperCase(),
      email: String(form.get("email") ?? "").trim(),
    });
    router.push(`/conta/viagens?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Minhas viagens</h1>
      <p className="mt-2 text-sm text-muted-foreground">Abra pelo código e pelo e-mail, ou pelo link enviado na reserva.</p>
      <form key={search.toString()} onSubmit={onSubmit} className="mt-6 grid gap-3">
        <label className="text-sm font-medium">
          Código
          <input name="code" required defaultValue={search.get("code") ?? ""} placeholder="REV-" autoCapitalize="characters" className={fieldClass} />
        </label>
        <label className="text-sm font-medium">
          E-mail
          <input name="email" type="email" required defaultValue={search.get("email") ?? ""} inputMode="email" autoComplete="email" className={fieldClass} />
        </label>
        <button type="submit" className="h-12 rounded-xl bg-primary text-base font-semibold text-primary-foreground">
          Abrir viagens
        </button>
      </form>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft px-4 py-3 text-sm">{error}</p>}
      {lists && (
        <>
          <TripGroup title="Próximas" trips={lists.upcoming} email={email} />
          <TripGroup title="Anteriores" trips={lists.past} email={email} />
          <TripGroup title="Canceladas" trips={lists.cancelled} email={email} />
        </>
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense>
      <Trips />
    </Suspense>
  );
}
