"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { readTrips, rememberTrip, TripRef } from "@/lib/trips";

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Minhas viagens</h1>
      <p className="mt-2 text-sm text-muted-foreground">As reservas feitas neste navegador ficam aqui. Também dá para abrir pelo código e pelo e-mail.</p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
        <input name="code" required placeholder="Código REV-" className="h-11 rounded-lg border border-border px-3" />
        <input name="email" type="email" required placeholder="E-mail" className="h-11 rounded-lg border border-border px-3" />
        <button type="submit" className="h-11 rounded-lg bg-primary font-semibold text-primary-foreground sm:col-span-2">
          Guardar código
        </button>
      </form>
      <ul className="mt-6 grid gap-3">
        {trips.map((trip) => (
          <li key={trip.code}>
            <Link href={`/reservas/${trip.code}?email=${encodeURIComponent(trip.email)}`} className="block rounded-2xl border border-border bg-surface p-4">
              <span className="font-semibold">{trip.code}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{trip.hotelName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
