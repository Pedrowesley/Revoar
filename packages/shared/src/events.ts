export type RevoarEvent =
  | { type: "partner.approved"; partnerId: string }
  | { type: "hotel.submitted"; hotelId: string; partnerId: string }
  | { type: "hotel.approved"; hotelId: string; partnerId: string }
  | { type: "hotel.rejected"; hotelId: string; partnerId: string; reason: string };
