import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VisualizarOfertasPublicaPageRoutingModule } from './visualizar-ofertas-publica-routing.module';
import { VisualizarOfertasPublicaPage } from './visualizar-ofertas-publica.page';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VisualizarOfertasPublicaPageRoutingModule,
    PipesModule
  ],
  declarations: [VisualizarOfertasPublicaPage]
})
export class VisualizarOfertasPublicaPageModule {} 