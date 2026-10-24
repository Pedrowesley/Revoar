export type HotelImageDetail = {
  id: string;
  hotelId: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
  altText: string | null;
  createdAt: string;
};

export type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MAX_IMAGE_SIZE_MB = 5;

/** Keep loopback media hosts aligned with the tab (localhost vs 127.0.0.1). */
export function resolveMediaUrl(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    const parsed = new URL(url);
    const host = window.location.hostname;
    const mediaIsLoopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const pageIsLoopback = host === "localhost" || host === "127.0.0.1";
    if (mediaIsLoopback && pageIsLoopback) {
      parsed.hostname = host;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
