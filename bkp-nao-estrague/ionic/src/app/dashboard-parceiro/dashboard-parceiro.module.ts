import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-parceiro-routing.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardParceiroPage } from './dashboard-parceiro.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgApexchartsModule,
    DashboardPageRoutingModule,
    PipesModule,
  ],
  declarations: [DashboardParceiroPage]
})
export class DashboardParceiroPageModule {}
