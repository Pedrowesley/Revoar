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
