"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export function useRequireAuth(): string | null {
  const router = useRouter();
  const token = typeof window !== "undefined" ? getToken() : null;

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  return token;
}
