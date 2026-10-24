"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { RevoarEventsListener } from "@/components/revoar-events-listener";
import { ApiError } from "@/lib/api";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (failureCount, error) =>
              error instanceof ApiError && error.status === 401 ? false : failureCount < 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <RevoarEventsListener />
      {children}
    </QueryClientProvider>
  );
}
