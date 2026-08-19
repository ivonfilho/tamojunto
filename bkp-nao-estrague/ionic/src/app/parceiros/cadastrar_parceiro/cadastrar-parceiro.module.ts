import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarParceiroRoutingModule } from './cadastrar-parceiro-routing.moduke';

import { HttpClientModule } from '@angular/common/http';

import { EditarParceiroPage } from './cadastrar-parceiro.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditarParceiroRoutingModule,
    HttpClientModule
  ],
  declarations: [EditarParceiroPage]
})
export class EditarParceiroPageModule {}
