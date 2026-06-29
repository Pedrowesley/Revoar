export type HotelStatus = "DRAFT" | "IN_REVIEW" | "ACTIVE" | "INACTIVE" | "REJECTED";

export const HOTEL_STATUS_LABELS: Record<HotelStatus, string> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em análise",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  REJECTED: "Rejeitado",
};

export const HOTEL_STATUS_COLORS: Record<HotelStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-slate-100 text-slate-600",
  REJECTED: "bg-red-100 text-red-800",
};

export const HOTEL_STATUS_FILTERS: { value: HotelStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "IN_REVIEW", label: "Em análise" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "REJECTED", label: "Rejeitado" },
];

export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const STAR_OPTIONS = [1, 2, 3, 4, 5] as const;
