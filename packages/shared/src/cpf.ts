export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
