import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CuponsPageRoutingModule } from './cupons-routing.module';

import { CuponsPage } from './cupons.page';
import { RelatorioCupomPage } from './relatorio-cupom/relatorio-cupom.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    CuponsPageRoutingModule,
    PipesModule
  ],
  declarations: [CuponsPage, RelatorioCupomPage]
})
export class CuponsPageModule {}
