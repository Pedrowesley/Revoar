export const adminKeys = {
  stats: ["admin", "stats"] as const,
  pendingPartners: ["admin", "partners", "pending"] as const,
  pendingHotels: ["admin", "hotels", "pending"] as const,
  hotel: (id: string) => ["admin", "hotels", id] as const,
};
