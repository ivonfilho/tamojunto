import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** DDDs válidos no Brasil (sem 20, 23, 25, 26, 29, 30, 36, 39, 40, 50, 52, 56–60, 70, 72, 76, 78, 80, 90). */
const DDD_VALIDOS = new Set<string>([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77',
  '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

export function onlyDigits(s: string | null | undefined): string {
  return (s || '').replace(/\D/g, '');
}

/** Máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX. */
export function applyMaskTelefoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function isTodosDigitosIguais(d: string): boolean {
  return /^(\d)\1+$/.test(d);
}

/** Heurística: sequências óbvias no número local (8 ou 9 dígitos). */
function isSequenciaSuspeita(local: string): boolean {
  if (local.length < 8) return false;
  const seq = '01234567890123456789';
  for (let i = 0; i <= local.length - 4; i++) {
    const slice = local.slice(i, i + 4);
    if (seq.includes(slice) || seq.includes(slice.split('').reverse().join(''))) {
      return true;
    }
  }
  return false;
}

export function validarTelefoneBrDigitos(d: string): string | null {
  if (!d) return 'Informe o telefone com DDD.';
  if (d.length < 10 || d.length > 11) {
    return 'Use DDD + número (10 dígitos para fixo ou 11 para celular).';
  }
  const ddd = d.slice(0, 2);
  if (!DDD_VALIDOS.has(ddd)) {
    return 'DDD inválido.';
  }
  if (isTodosDigitosIguais(d)) {
    return 'Número inválido.';
  }

  if (d.length === 11) {
    if (d[2] !== '9') {
      return 'Celular deve começar com 9 após o DDD: (XX) 9XXXX-XXXX.';
    }
    const localMovel = d.slice(3);
    if (isSequenciaSuspeita(localMovel)) {
      return 'Número parece inválido. Verifique os dígitos.';
    }
    return null;
  }

  // Fixo: 10 dígitos — não começa com 9 no primeiro dígito local (seria celular antigo inválido)
  const primeiroLocal = d[2];
  if (primeiroLocal === '9') {
    return 'Para número com 9 na primeira posição, use 11 dígitos (celular).';
  }
  if (primeiroLocal === '0' || primeiroLocal === '1') {
    return 'Número fixo inválido para este DDD.';
  }
  const local = d.slice(2);
  if (isSequenciaSuspeita(local)) {
    return 'Número parece inválido. Verifique os dígitos.';
  }
  return null;
}

export function telefoneBrValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = onlyDigits(control.value);
    if (!raw) {
      return null;
    }
    const msg = validarTelefoneBrDigitos(raw);
    return msg ? { telefoneBr: msg } : null;
  };
}
