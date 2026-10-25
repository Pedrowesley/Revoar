export const extranetKeys = {
  me: ["extranet", "auth", "me"] as const,
  hotels: (status?: string) =>
    status && status !== "ALL"
      ? (["extranet", "hotels", { status }] as const)
      : (["extranet", "hotels"] as const),
  hotel: (id: string) => ["extranet", "hotels", id] as const,
  rooms: (hotelId: string) => ["extranet", "hotels", hotelId, "rooms"] as const,
  images: (hotelId: string) => ["extranet", "hotels", hotelId, "images"] as const,
  roomImages: (hotelId: string, roomId: string) =>
    ["extranet", "hotels", hotelId, "rooms", roomId, "images"] as const,
};
