"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/forgot-password", "/reset-password"]);

export function SessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setToken(getToken());
    sync();
    setReady(true);
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!PUBLIC_PATHS.has(pathname) && ready && !token) return null;
  return children;
}
