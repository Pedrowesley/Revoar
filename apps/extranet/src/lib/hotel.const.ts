export type HotelStatus = "DRAFT" | "IN_REVIEW" | "ACTIVE" | "INACTIVE" | "REJECTED";

export const HOTEL_STATUS_LABELS: Record<HotelStatus, string> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em análise",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  REJECTED: "Rejeitado",
};

export const HOTEL_STATUS_COLORS: Record<HotelStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-warning-soft text-warning",
  ACTIVE: "bg-success-soft text-success",
  INACTIVE: "bg-muted text-muted-foreground",
  REJECTED: "bg-danger-soft text-danger",
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
