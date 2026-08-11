import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OfertasParceiroPageRoutingModule } from './ofertas-parceiro-routing.module';

import { OfertasParceiroPage } from './ofertas-parceiro.page';

import { HttpClientModule } from '@angular/common/http';
import { PipesModule } from '../pipes/pipes.module';
import { ExcluirOfertaComponent } from '../ofertas/excluir-ofertas/excluir-oferta.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OfertasParceiroPageRoutingModule,
    HttpClientModule,
    PipesModule
  ],
  declarations: [OfertasParceiroPage, ExcluirOfertaComponent]
})
export class OfertasParceiroPageModule {}
