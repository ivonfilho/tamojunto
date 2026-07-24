import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrlCurrencyPipe } from './brl-currency.pipe';

@NgModule({
  declarations: [BrlCurrencyPipe],
  imports: [CommonModule],
  exports: [BrlCurrencyPipe],
})
export class PipesModule {}

