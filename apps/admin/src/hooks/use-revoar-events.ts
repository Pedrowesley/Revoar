"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RevoarEvent } from "@revoar/shared";
import { expireSession, getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

function parseSseChunk(chunk: string): RevoarEvent[] {
  const events: RevoarEvent[] = [];
  for (const block of chunk.split("\n\n")) {
    const dataLine = block.split("\n").find((line) => line.startsWith("data:"));
    if (!dataLine) continue;
    try {
      const payload = JSON.parse(dataLine.replace(/^data:\s*/, ""));
      events.push(payload as RevoarEvent);
    } catch {
      // ignore malformed events
    }
  }
  return events;
}

async function consumeAdminEventStream(
  token: string,
  onEvent: (event: RevoarEvent) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`${getApiUrl()}/admin/notifications/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  });

  if (response.status === 401) return "unauthorized" as const;
  if (!response.ok || !response.body) return "retry" as const;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      for (const event of parseSseChunk(part)) {
        onEvent(event);
      }
    }
  }
}

export function useAdminRevoarEvents(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const token = getToken();
    if (!token) return;

    const controller = new AbortController();

    const handleEvent = (event: RevoarEvent) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.stats });
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingPartners });
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingHotels });

      if ("hotelId" in event && event.hotelId) {
        queryClient.invalidateQueries({ queryKey: adminKeys.hotel(event.hotelId) });
      }
    };

    void (async () => {
      while (!controller.signal.aborted) {
        try {
          const result = await consumeAdminEventStream(token, handleEvent, controller.signal);
          if (result === "unauthorized") {
            expireSession();
            break;
          }
        } catch {
          if (controller.signal.aborted) break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3_000));
      }
    })();

    return () => controller.abort();
  }, [enabled, queryClient]);
}
