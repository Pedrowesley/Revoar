"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { readTrips, rememberTrip, TripRef } from "@/lib/trips";

const fieldClass = "mt-1 h-12 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base";

export default function TripsPage() {
  const [trips, setTrips] = useState<TripRef[]>([]);

  useEffect(() => {
    setTrips(readTrips());
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const trip = {
      code: String(form.get("code") ?? "").toUpperCase(),
      email: String(form.get("email") ?? ""),
      hotelName: "Reserva",
    };
    rememberTrip(trip);
    setTrips(readTrips());
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Minhas viagens</h1>
      <p className="mt-2 text-sm text-muted-foreground">As reservas feitas neste navegador ficam aqui. Também dá para abrir pelo código e pelo e-mail.</p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <label className="text-sm font-medium">
          Código
          <input name="code" required placeholder="REV-" autoCapitalize="characters" className={fieldClass} />
        </label>
        <label className="text-sm font-medium">
          E-mail
          <input name="email" type="email" required inputMode="email" autoComplete="email" className={fieldClass} />
        </label>
        <button type="submit" className="h-12 rounded-xl bg-primary text-base font-semibold text-primary-foreground">
          Guardar código
        </button>
      </form>
      <ul className="mt-6 grid gap-3">
        {trips.map((trip) => (
          <li key={trip.code}>
            <Link href={`/reservas/${trip.code}?email=${encodeURIComponent(trip.email)}`} className="block min-h-12 rounded-2xl border border-border bg-surface p-4">
              <span className="font-semibold">{trip.code}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{trip.hotelName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
