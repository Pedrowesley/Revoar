export function stayTotal(nightlyCents: number[], quantity: number) {
  return nightlyCents.reduce((sum, price) => sum + price, 0) * quantity;
}

export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  if (!day || !month) return iso;
  return `${day}/${month}`;
}

export function tomorrow(offset = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export type SearchValues = {
  city: string;
  checkIn: string;
  checkOut: string;
  adults: string;
  children: string;
  rooms: string;
};

export function searchQuery(values: SearchValues): string {
  const params = new URLSearchParams(values);
  return params.toString();
}
