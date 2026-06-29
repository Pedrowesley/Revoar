/** Gera CNPJ válido para testes (apenas dígitos). */
export function generateValidCnpjDigits(): string {
  const randomDigit = () => Math.floor(Math.random() * 10);

  const base = Array.from({ length: 8 }, randomDigit);
  base.unshift(randomDigit(), randomDigit());
  base.splice(8, 0, 0, 0, 1);

  const calc = (digits: number[], weights: number[]) => {
    const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(base, w1);
  const d2 = calc([...base, d1], w2);

  return [...base, d1, d2].join("");
}

export function formatCnpj(digits: string): string {
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
