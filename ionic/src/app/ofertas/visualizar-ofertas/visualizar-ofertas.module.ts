import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VisualizarOfertasRoutingModule } from './visualizar-ofertas-routing.module';

import { HttpClientModule } from '@angular/common/http';

import { VisualizarOfertasPage } from './visualizar-ofertas.page';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VisualizarOfertasRoutingModule,
    HttpClientModule,
    PipesModule
  ],
  declarations: [VisualizarOfertasPage]
})
export class VisualizarOfertasPageModule {}
