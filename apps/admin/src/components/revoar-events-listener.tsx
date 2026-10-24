"use client";

import { useAdminRevoarEvents } from "@/hooks/use-revoar-events";
import { getToken } from "@/lib/auth";

export function RevoarEventsListener() {
  useAdminRevoarEvents(Boolean(getToken()));
  return null;
}
