"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { searchQuery, SearchValues, shortDate, tomorrow } from "@/lib/format";

const fieldClass = "mt-1 h-12 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base";

function readForm(form: FormData): SearchValues {
  return {
    city: String(form.get("city") ?? ""),
    checkIn: String(form.get("checkIn") ?? ""),
    checkOut: String(form.get("checkOut") ?? ""),
    adults: String(form.get("adults") ?? "1"),
    children: String(form.get("children") ?? "0"),
    rooms: String(form.get("rooms") ?? "1"),
  };
}

function SearchFields({ values, onSubmit, stacked }: { values: SearchValues; onSubmit: (next: SearchValues) => void; stacked?: boolean }) {
  function handle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(readForm(new FormData(event.currentTarget)));
  }

  return (
    <form
      onSubmit={handle}
      className={stacked ? "grid gap-3" : "grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-6"}
    >
      <label className="min-w-0 text-sm font-medium lg:col-span-2">
        Destino
        <input name="city" defaultValue={values.city} required className={fieldClass} />
      </label>
      <label className="min-w-0 text-sm font-medium">
        Check-in
        <input name="checkIn" type="date" defaultValue={values.checkIn} required className={fieldClass} />
      </label>
      <label className="min-w-0 text-sm font-medium">
        Check-out
        <input name="checkOut" type="date" defaultValue={values.checkOut} required className={fieldClass} />
      </label>
      <label className="min-w-0 text-sm font-medium">
        Adultos
        <input name="adults" type="number" min={1} inputMode="numeric" defaultValue={values.adults} required className={fieldClass} />
      </label>
      <label className="min-w-0 text-sm font-medium">
        Crianças
        <input name="children" type="number" min={0} inputMode="numeric" defaultValue={values.children} required className={fieldClass} />
      </label>
      <label className="min-w-0 text-sm font-medium">
        Quartos
        <input name="rooms" type="number" min={1} inputMode="numeric" defaultValue={values.rooms} required className={fieldClass} />
      </label>
      <button type="submit" className="h-12 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground sm:col-span-2 lg:col-span-6">
        Buscar
      </button>
    </form>
  );
}

function summary(values: SearchValues) {
  const dates = values.checkIn && values.checkOut ? `${shortDate(values.checkIn)}–${shortDate(values.checkOut)}` : "Datas";
  const adults = Number(values.adults || "2");
  const rooms = Number(values.rooms || "1");
  return `${values.city || "Destino"} · ${dates} · ${adults} adulto${adults === 1 ? "" : "s"} · ${rooms} quarto${rooms === 1 ? "" : "s"}`;
}

export function SearchForm({ initial, compact }: { initial?: Partial<SearchValues>; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const values: SearchValues = {
    city: initial?.city ?? "Fortaleza",
    checkIn: initial?.checkIn ?? tomorrow(7),
    checkOut: initial?.checkOut ?? tomorrow(10),
    adults: initial?.adults ?? "2",
    children: initial?.children ?? "0",
    rooms: initial?.rooms ?? "1",
  };

  function go(next: SearchValues) {
    setOpen(false);
    router.push(`/busca?${searchQuery(next)}`);
  }

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-full min-w-0 items-center rounded-xl border border-border bg-surface px-4 text-left text-sm font-medium"
        >
          <span className="truncate">{summary(values)}</span>
        </button>
        <Sheet open={open} title="Buscar estadia" onClose={() => setOpen(false)}>
          <SearchFields key={String(open)} values={values} stacked onSubmit={go} />
        </Sheet>
      </>
    );
  }

  return <SearchFields values={values} onSubmit={go} />;
}
