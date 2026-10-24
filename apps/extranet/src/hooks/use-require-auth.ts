"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth";

export function useRequireAuth(): string | null {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const current = getToken();
      setToken(current);
      if (!current) router.replace("/login");
    };

    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [router]);

  return token;
}
