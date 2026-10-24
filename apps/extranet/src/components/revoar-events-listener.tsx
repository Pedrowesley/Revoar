"use client";

import { usePartnerRevoarEvents } from "@/hooks/use-revoar-events";
import { getToken } from "@/lib/auth";

export function RevoarEventsListener() {
  usePartnerRevoarEvents(Boolean(getToken()));
  return null;
}
