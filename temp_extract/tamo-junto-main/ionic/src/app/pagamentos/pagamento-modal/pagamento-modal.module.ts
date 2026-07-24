import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular'; 

import { PagamentoModalPage } from './pagamento-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, 
  ],
  declarations: [PagamentoModalPage],
  exports: [PagamentoModalPage], 
})
export class PagamentoModalPageModule {}
