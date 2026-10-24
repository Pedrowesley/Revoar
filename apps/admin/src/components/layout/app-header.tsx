"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, LayoutDashboard, LogOut, Users } from "lucide-react";
import { AUTH_CHANGE_EVENT, expireSession, getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AUTH_LINKS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/partners/pending", label: "Parceiros", icon: Users },
  { href: "/hotels/pending", label: "Hotéis", icon: Building2 },
];

export function AppHeader() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const showApp = authed && pathname !== "/login";

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
          <Link href={showApp ? "/dashboard" : "/login"} className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform group-hover:scale-[1.03]">
              R
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-foreground">Revoar</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Admin
              </span>
            </span>
          </Link>

          {showApp && (
            <nav className="flex items-center gap-1 overflow-x-auto">
              {AUTH_LINKS.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href.split("/").slice(0, 2).join("/")));
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
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sair
            </Button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
