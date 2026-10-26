import { getApiUrl } from "@/lib/api";

export type StayPhoto = { url: string; altText: string | null };

export function mediaUrl(url: string): string {
  const absolute = url.startsWith("/") ? `${getApiUrl()}${url}` : url;
  if (typeof window === "undefined") return absolute;
  try {
    const parsed = new URL(absolute);
    const host = window.location.hostname;
    const mediaIsLoopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const pageIsLoopback = host === "localhost" || host === "127.0.0.1";
    if (mediaIsLoopback && pageIsLoopback) parsed.hostname = host;
    return parsed.toString();
  } catch {
    return absolute;
  }
}
