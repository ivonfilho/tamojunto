import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const SENHA_COMPLEXIDADE_TEXTO =
  'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um número.';

/** Mínimo 8, pelo menos uma maiúscula e um dígito (Unicode). */
const SENHA_COMPLEXIDADE_REGEX = /^(?=.*\p{Lu})(?=.*\d).{8,}$/u;

export function senhaComplexidadeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value || '';
    if (!v) {
      return null;
    }
    if (!SENHA_COMPLEXIDADE_REGEX.test(v)) {
      return { senhaComplexidade: true };
    }
    return null;
  };
}
