"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth";

const PRIMARY =
  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto";
const PRIMARY_ON_PRIMARY =
  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-foreground px-6 text-base font-semibold text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground sm:w-auto";
const SECONDARY =
  "inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto";
const SECONDARY_ON_PRIMARY =
  "inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary-foreground/40 px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground sm:w-auto";

export function HeroCta({ tone = "default" }: { tone?: "default" | "onPrimary" }) {
  const primary = tone === "onPrimary" ? PRIMARY_ON_PRIMARY : PRIMARY;
  const secondary = tone === "onPrimary" ? SECONDARY_ON_PRIMARY : SECONDARY;
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(Boolean(getToken()));
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (authed) {
    return (
      <Link href="/dashboard" className={primary}>
        Ir para o painel
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      <Link href="/signup" className={primary}>
        Cadastrar hotel
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
      <Link href="/login" className={secondary}>
        Já tenho conta
      </Link>
    </div>
  );
}
