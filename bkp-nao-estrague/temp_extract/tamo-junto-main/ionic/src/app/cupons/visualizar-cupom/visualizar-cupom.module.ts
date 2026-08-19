import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VisualizarCupomPageRoutingModule } from './visualizar-cupom-routing.module';
import { VisualizarCupomPage } from './visualizar-cupom.page';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VisualizarCupomPageRoutingModule,
    PipesModule
  ],
  declarations: [VisualizarCupomPage]
})
export class VisualizarCupomPageModule {}
