import { RoomAmenity } from "@revoar/shared";

export type RoomTypeDetail = {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  bedConfiguration: string;
  amenities: RoomAmenity[];
  sizeSqm: number | null;
  sortOrder: number;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
