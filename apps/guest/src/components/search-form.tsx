"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { searchQuery, SearchValues, tomorrow } from "@/lib/format";

export function SearchForm({ initial }: { initial?: Partial<SearchValues> }) {
  const router = useRouter();
  const values: SearchValues = {
    city: initial?.city ?? "Fortaleza",
    checkIn: initial?.checkIn ?? tomorrow(7),
    checkOut: initial?.checkOut ?? tomorrow(10),
    adults: initial?.adults ?? "2",
    children: initial?.children ?? "0",
    rooms: initial?.rooms ?? "1",
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: SearchValues = {
      city: String(form.get("city") ?? ""),
      checkIn: String(form.get("checkIn") ?? ""),
      checkOut: String(form.get("checkOut") ?? ""),
      adults: String(form.get("adults") ?? "1"),
      children: String(form.get("children") ?? "0"),
      rooms: String(form.get("rooms") ?? "1"),
    };
    router.push(`/busca?${searchQuery(next)}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-6">
      <label className="text-sm font-medium lg:col-span-2">
        Destino
        <input name="city" defaultValue={values.city} required className="mt-1 h-11 w-full rounded-lg border border-border px-3" />
      </label>
      <label className="text-sm font-medium">
        Check-in
        <input name="checkIn" type="date" defaultValue={values.checkIn} required className="mt-1 h-11 w-full rounded-lg border border-border px-3" />
      </label>
      <label className="text-sm font-medium">
        Check-out
        <input name="checkOut" type="date" defaultValue={values.checkOut} required className="mt-1 h-11 w-full rounded-lg border border-border px-3" />
      </label>
      <label className="text-sm font-medium">
        Adultos
        <input name="adults" type="number" min={1} defaultValue={values.adults} required className="mt-1 h-11 w-full rounded-lg border border-border px-3" />
      </label>
      <label className="text-sm font-medium">
        Crianças
        <input name="children" type="number" min={0} defaultValue={values.children} required className="mt-1 h-11 w-full rounded-lg border border-border px-3" />
      </label>
      <label className="text-sm font-medium">
        Quartos
        <input name="rooms" type="number" min={1} defaultValue={values.rooms} required className="mt-1 h-11 w-full rounded-lg border border-border px-3" />
      </label>
      <button type="submit" className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground sm:col-span-2 lg:col-span-6">
        Buscar
      </button>
    </form>
  );
}
