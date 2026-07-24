import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Nome com pelo menos duas palavras, letras (inclui acentos), espaços e hífen/apóstrofo entre letras. */
export function nomeCompletoBrValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value || '').trim();
    if (!v) {
      return null;
    }
    const words = v.split(/\s+/).filter((w: string) => w.length > 0);
    if (words.length < 2) {
      return { nomeCompleto: true };
    }
    const wordOk = /^[a-zA-ZÀ-ÿ]+([-'][a-zA-ZÀ-ÿ]+)*$/u;
    for (const w of words) {
      if (!wordOk.test(w)) {
        return { nomeCompleto: true };
      }
    }
    return null;
  };
}
