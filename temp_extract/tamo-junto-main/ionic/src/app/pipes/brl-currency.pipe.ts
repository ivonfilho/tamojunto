import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrencyBRL } from '../utils/currency.util';

@Pipe({
  name: 'brlCurrency',
  standalone: false,
})
export class BrlCurrencyPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    fractionDigits: number = 2
  ): string {
    return formatCurrencyBRL(value, fractionDigits);
  }
}

