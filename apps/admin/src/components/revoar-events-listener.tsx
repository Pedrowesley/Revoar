"use client";

import { useEffect, useState } from "react";
import { useAdminRevoarEvents } from "@/hooks/use-revoar-events";
import { AUTH_CHANGE_EVENT, getToken } from "@/lib/auth";

export function RevoarEventsListener() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const sync = () => setHasToken(Boolean(getToken()));
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useAdminRevoarEvents(hasToken);
  return null;
}
