import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OfertasPageRoutingModule } from './ofertas-routing.module';

import { HttpClientModule } from '@angular/common/http';

import { OfertasPage } from './ofertas.page';
import { ExcluirOfertaComponent } from './excluir-ofertas/excluir-oferta.component';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OfertasPageRoutingModule,
    HttpClientModule,
    PipesModule
  ],
  declarations: [OfertasPage]
})
export class OfertasPageModule {}
