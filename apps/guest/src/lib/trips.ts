export type TripRef = { code: string; email: string; hotelName: string };

const KEY = "revoar.guest.trips";

export function rememberTrip(trip: TripRef) {
  const current = readTrips().filter((item) => item.code !== trip.code);
  localStorage.setItem(KEY, JSON.stringify([trip, ...current].slice(0, 20)));
}

export function readTrips(): TripRef[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as TripRef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
