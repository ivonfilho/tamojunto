import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CadastroOfertaPageRoutingModule } from './cadastro-oferta-routing.module';

import { CadastroOfertaPage } from './cadastro-oferta.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CadastroOfertaPageRoutingModule
  ],
  declarations: [CadastroOfertaPage]
})
export class CadastroOfertaPageModule {}
