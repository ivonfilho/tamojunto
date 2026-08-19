import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VisualizarCupomPage } from './visualizar-cupom.page';

const routes: Routes = [
  {
    path: '',
    component: VisualizarCupomPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisualizarCupomPageRoutingModule {}
