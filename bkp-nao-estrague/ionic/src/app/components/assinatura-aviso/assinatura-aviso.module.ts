import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AssinaturaAvisoComponent } from './assinatura-aviso.component';

@NgModule({
  declarations: [AssinaturaAvisoComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [AssinaturaAvisoComponent]
})
export class AssinaturaAvisoModule { } 