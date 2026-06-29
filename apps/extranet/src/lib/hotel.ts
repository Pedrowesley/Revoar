import { HotelStatus } from "@/lib/hotel.const";

export type HotelSummary = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: HotelStatus;
  rejectionReason: string | null;
  roomCount: number;
  imageCount: number;
  updatedAt: string;
};

export type HotelDetail = HotelSummary & {
  description: string;
  starRating: number | null;
  addressLine: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  checkInTime: string;
  checkOutTime: string;
  createdAt: string;
};

export type ViaCepResponse = {
  logradouro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export type ViaCepAddress = {
  addressLine: string;
  city: string;
  state: string;
};

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data: ViaCepResponse = await response.json();
    if (data.erro) return null;

    return {
      addressLine: data.logradouro ?? "",
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return null;
  }
}

export function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatHotelPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}
