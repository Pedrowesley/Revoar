"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { HotelDetail } from "@/lib/hotel";

export function useHotel(hotelId: string) {
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<HotelDetail>(`/extranet/hotels/${hotelId}`, { token });
      setHotel(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Você não tem acesso a este hotel.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Hotel não encontrado.");
      }
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { hotel, loading, error, reload };
}
