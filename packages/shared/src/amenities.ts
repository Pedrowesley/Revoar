export const ROOM_AMENITIES = [
  "WIFI",
  "AC",
  "TV",
  "MINIBAR",
  "SAFE",
  "PRIVATE_BATH",
  "BALCONY",
  "BATHTUB",
  "DESK",
  "BLACKOUT_CURTAINS",
  "CRIB_AVAILABLE",
] as const;

export type RoomAmenity = (typeof ROOM_AMENITIES)[number];

export const ROOM_AMENITY_LABELS: Record<RoomAmenity, string> = {
  WIFI: "Wi-Fi",
  AC: "Ar-condicionado",
  TV: "TV",
  MINIBAR: "Frigobar",
  SAFE: "Cofre",
  PRIVATE_BATH: "Banheiro privativo",
  BALCONY: "Varanda",
  BATHTUB: "Banheira",
  DESK: "Mesa de trabalho",
  BLACKOUT_CURTAINS: "Cortina blackout",
  CRIB_AVAILABLE: "Berço disponível",
};
