import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarParceiroPageRoutingModule } from './editar-parceiro-routing.module';

import { EditarParceiroPage } from './editar-parceiro.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditarParceiroPageRoutingModule
  ],
  declarations: [EditarParceiroPage]
})
export class EditarParceiroPageModule {}
