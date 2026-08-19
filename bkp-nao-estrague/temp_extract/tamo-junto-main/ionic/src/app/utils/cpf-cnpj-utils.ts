// Máscara de CPF
export function applyMaskCPF(value: string): string {
  const input = value.replace(/\D/g, ''); // Remove tudo que não for número
  return input
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Validação de CPF
export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, ''); // Remove tudo que não for número
  if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, remainder;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf[i - 1]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf[i - 1]) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf[10]);
}

// Máscara de CNPJ
export function applyMaskCNPJ(value: string): string {
  const input = value.replace(/\D/g, ''); // Remove tudo que não for número
  return input
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// Validação de CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, ''); // Remove tudo que não for número
  if (!cnpj || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (x: number) => {
    const slice = cnpj.slice(0, x);
    let factor = x - 7, sum = 0;
    for (let i = x; i >= 1; i--) {
      sum += parseInt(slice[x - i]) * factor--;
      if (factor < 2) factor = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calc(12) === parseInt(cnpj[12]) && calc(13) === parseInt(cnpj[13]);
}
