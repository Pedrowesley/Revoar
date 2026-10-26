import { HOTEL_AMENITY_LABELS, ROOM_AMENITY_LABELS } from "@revoar/shared";

function label(map: object, code: string) {
  const value = (map as Record<string, string>)[code];
  return value ?? code;
}

export function hotelAmenityLabel(code: string) {
  return label(HOTEL_AMENITY_LABELS, code);
}

export function roomAmenityLabel(code: string) {
  return label(ROOM_AMENITY_LABELS, code);
}
