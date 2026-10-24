"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RevoarEvent } from "@revoar/shared";
import { getToken } from "@/lib/auth";
import { extranetKeys } from "@/lib/query-keys";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

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

async function consumePartnerEventStream(
  token: string,
  onEvent: (event: RevoarEvent) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`${API_URL}/extranet/notifications/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  });

  if (!response.ok || !response.body) return;

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

export function usePartnerRevoarEvents(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const token = getToken();
    if (!token) return;

    const controller = new AbortController();

    const handleEvent = (event: RevoarEvent) => {
      if (event.type === "partner.approved") {
        queryClient.invalidateQueries({ queryKey: extranetKeys.me });
      }

      if (
        event.type === "hotel.approved" ||
        event.type === "hotel.rejected" ||
        event.type === "hotel.submitted"
      ) {
        queryClient.invalidateQueries({ queryKey: extranetKeys.hotel(event.hotelId) });
        queryClient.invalidateQueries({ queryKey: ["extranet", "hotels"] });
      }
    };

    void (async () => {
      while (!controller.signal.aborted) {
        try {
          await consumePartnerEventStream(token, handleEvent, controller.signal);
        } catch {
          if (controller.signal.aborted) break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3_000));
      }
    })();

    return () => controller.abort();
  }, [enabled, queryClient]);
}
