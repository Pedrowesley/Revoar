"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hotel, LayoutDashboard, LogOut } from "lucide-react";
import { apiFetch, PartnerProfile } from "@/lib/api";
import { AUTH_CHANGE_EVENT, expireSession, getToken } from "@/lib/auth";
import { extranetKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AUTH_LINKS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/hotels", label: "Hotéis", icon: Hotel },
];

export function AppHeader() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showApp = authed && pathname !== "/login" && pathname !== "/signup";
  const profileQuery = useQuery({
    queryKey: extranetKeys.me,
    enabled: showApp,
    queryFn: () => apiFetch<PartnerProfile>("/extranet/auth/me", { token: getToken()! }),
    retry: false,
  });
  const profile = profileQuery.data;
  const initial = profile?.name.slice(0, 1) ?? "P";

  useEffect(() => {
    const sync = () => setAuthed(Boolean(getToken()));
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pathname]);

  function handleLogout() {
    expireSession();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link href={showApp ? "/dashboard" : "/"} className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform group-hover:scale-[1.03]">
              R
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-foreground">Revoar</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Extranet
              </span>
            </span>
          </Link>

          {showApp && (
            <nav className="flex items-center gap-1 overflow-x-auto">
              {AUTH_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-soft text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showApp ? (
            <div className="relative">
              <button
                type="button"
                aria-label="Conta"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-semibold text-primary"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-surface p-1 shadow-soft">
                  <Link
                    href="/profile"
                    className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Meu perfil
                  </Link>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
