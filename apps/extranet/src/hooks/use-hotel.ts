"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelDetail } from "@/lib/hotel";
import { extranetKeys } from "@/lib/query-keys";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function useHotel(hotelId: string) {
  const token = useRequireAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: extranetKeys.hotel(hotelId),
    enabled: Boolean(hotelId && token),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "IN_REVIEW" ? 30_000 : false;
    },
    queryFn: async () => {
      const authToken = getToken();
      if (!authToken) throw new Error("Não autenticado");
      return apiFetch<HotelDetail>(`/extranet/hotels/${hotelId}`, { token: authToken });
    },
  });

  const error =
    query.error instanceof ApiError && query.error.status === 403
      ? "Você não tem acesso a este hotel."
      : query.error instanceof ApiError
        ? query.error.message
        : query.isError
          ? "Hotel não encontrado."
          : null;

  async function reload() {
    await queryClient.invalidateQueries({ queryKey: extranetKeys.hotel(hotelId) });
  }

  return {
    hotel: query.data ?? null,
    loading: !token || query.isLoading,
    error,
    reload,
  };
}
